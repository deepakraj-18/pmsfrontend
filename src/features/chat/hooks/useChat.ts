import { useCallback, useEffect, useRef, useState } from 'react';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatService, ChatMessage } from '@/api/services/chat.service';
import { CHAT, STORAGE_KEYS } from '@/constants/constants';

export type ChatConnectionStatus = 'connecting' | 'live' | 'reconnecting' | 'offline' | 'revoked';

export const chatKeys = {
    unread: ['chat', 'unread'] as const,
    members: (projectId: number) => ['chat', 'members', projectId] as const,
};

/** The SignalR hub lives beside the REST API, minus its /api/v1 prefix. */
const hubUrl = (): string => {
    const base = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '') as string;
    return `${base.replace(/\/api\/v\d+\/?$/, '')}${CHAT.HUB_PATH}`;
};

const byId = (a: ChatMessage, b: ChatMessage) => a.id - b.id;

/** Merge by id so a message arriving both from the POST response and the hub appears once. */
const merge = (current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] => {
    const map = new Map(current.map((m) => [m.id, m]));
    incoming.forEach((m) => map.set(m.id, m));
    return [...map.values()].sort(byId);
};

export function useChatUnread(enabled = true) {
    return useQuery({
        enabled,
        queryKey: chatKeys.unread,
        queryFn: chatService.getUnread,
        refetchInterval: CHAT.UNREAD_POLL_MS,
        staleTime: CHAT.UNREAD_POLL_MS / 2,
        retry: false,
    });
}

/** People who can be @mentioned in a room. */
export function useChatMembers(projectId: number, enabled = true) {
    return useQuery({
        enabled,
        queryKey: chatKeys.members(projectId),
        queryFn: () => chatService.getMembers(projectId),
        staleTime: 60_000,
        retry: false,
    });
}

export function useProjectChat(projectId: number, enabled = true) {
    const queryClient = useQueryClient();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [status, setStatus] = useState<ChatConnectionStatus>('connecting');
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const connectionRef = useRef<HubConnection | null>(null);
    const readTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const newestRef = useRef(0);

    // Tell the server how far we've read (debounced), then refresh the unread badge.
    const scheduleMarkRead = useCallback(() => {
        clearTimeout(readTimer.current);
        readTimer.current = setTimeout(async () => {
            const newest = newestRef.current;
            if (!newest) return;
            try {
                await chatService.markRead(projectId, newest);
                queryClient.invalidateQueries({ queryKey: chatKeys.unread });
            } catch {
                /* the badge simply stays until the next successful read */
            }
        }, CHAT.MARK_READ_DEBOUNCE_MS);
    }, [projectId, queryClient]);

    const apply = useCallback((updater: (prev: ChatMessage[]) => ChatMessage[]) => {
        setMessages((prev) => {
            const next = updater(prev);
            newestRef.current = next.length ? next[next.length - 1].id : 0;
            return next;
        });
    }, []);

    const loadLatest = useCallback(async () => {
        const page = await chatService.getMessages(projectId, undefined, CHAT.PAGE_SIZE);
        apply((prev) => merge(prev, page));
        setHasMore((prev) => prev || page.length >= CHAT.PAGE_SIZE);
        scheduleMarkRead();
    }, [projectId, apply, scheduleMarkRead]);

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;
        setMessages([]);
        newestRef.current = 0;
        setLoading(true);
        setLoadError(null);
        setStatus('connecting');

        loadLatest()
            .catch((err: any) => {
                if (!cancelled) setLoadError(err?.response?.data?.message || 'Could not load the chat.');
            })
            .finally(() => !cancelled && setLoading(false));

        const connection = new HubConnectionBuilder()
            .withUrl(hubUrl(), { accessTokenFactory: () => chatService.ticket() })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Warning)
            .build();
        connectionRef.current = connection;

        connection.on('MessageReceived', (m: ChatMessage) => {
            if (m.project_id !== projectId) return;
            apply((prev) => merge(prev, [m]));
            scheduleMarkRead();
        });
        connection.on('MessageEdited', (m: ChatMessage) => {
            if (m.project_id !== projectId) return;
            apply((prev) => merge(prev, [m]));
        });
        connection.on('MessageDeleted', (e: { project_id: number; id: number }) => {
            if (e.project_id !== projectId) return;
            apply((prev) => prev.filter((m) => m.id !== e.id));
        });

        // The server can take the room away at any moment (removed from the project, role changed).
        const revoke = () => {
            if (cancelled) return;
            setStatus('revoked');
            apply(() => []);
            setHasMore(false);
            connection.stop().catch(() => undefined);
        };
        connection.on('AccessRevoked', (e: { project_id: number }) => {
            if (e.project_id === projectId) revoke();
        });

        connection.onreconnecting(() => setStatus('reconnecting'));
        connection.onreconnected(async () => {
            try {
                await connection.invoke('JoinProject', projectId);
                await loadLatest();      // fill in anything missed while disconnected
                setStatus('live');
            } catch (err: any) {
                if (String(err?.message ?? '').includes('Access denied')) revoke();
                else setStatus('offline');
            }
        });
        connection.onclose(() => !cancelled && setStatus((s) => (s === 'revoked' ? s : 'offline')));

        connection
            .start()
            .then(() => connection.invoke('JoinProject', projectId))
            .then(() => !cancelled && setStatus('live'))
            .catch((err: any) => {
                if (cancelled) return;
                if (String(err?.message ?? '').includes('Access denied')) revoke();
                else setStatus('offline');
            });

        return () => {
            cancelled = true;
            clearTimeout(readTimer.current);
            if (connection.state === HubConnectionState.Connected) {
                connection.invoke('LeaveProject', projectId).catch(() => undefined);
            }
            connection.stop().catch(() => undefined);
            connectionRef.current = null;
        };
    }, [projectId, enabled, loadLatest, apply, scheduleMarkRead]);

    const loadOlder = useCallback(async () => {
        const oldest = messages[0]?.id;
        if (!oldest) return;
        const page = await chatService.getMessages(projectId, oldest, CHAT.PAGE_SIZE);
        setHasMore(page.length >= CHAT.PAGE_SIZE);
        apply((prev) => merge(prev, page));
    }, [messages, projectId, apply]);

    const send = useCallback(async (body: string, files: File[] = []) => {
        const created = await chatService.post(projectId, body, files);
        apply((prev) => merge(prev, [created]));
    }, [projectId, apply]);

    const edit = useCallback(async (id: number, body: string) => {
        const updated = await chatService.edit(projectId, id, body);
        apply((prev) => merge(prev, [updated]));
    }, [projectId, apply]);

    const remove = useCallback(async (id: number) => {
        await chatService.remove(projectId, id);
        apply((prev) => prev.filter((m) => m.id !== id));
    }, [projectId, apply]);

    return { messages, status, loading, loadError, hasMore, loadOlder, send, edit, remove };
}
