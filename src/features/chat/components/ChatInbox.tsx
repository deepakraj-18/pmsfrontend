import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, isToday } from 'date-fns';
import { MessageSquare, Paperclip, ChevronLeft } from 'lucide-react';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { useAuth } from '@/auth/AuthProvider';
import { isAdmin, checkPermission } from '@/utils/permissions';
import { CHAT } from '@/constants/constants';
import { useChatRooms } from '../hooks/useChat';
import { ProjectChatTab } from './ProjectChatTab';
import type { ChatRoom } from '@/api/services/chat.service';

const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';

const previewOf = (room: ChatRoom) => {
  if (!room.last_message_at) return 'No messages yet';
  const who = room.last_message_sender_name ? `${room.last_message_sender_name}: ` : '';
  if (room.last_message_body) return `${who}${room.last_message_body}`;
  return room.last_message_has_attachments ? `${who}sent an attachment` : who.trim();
};

const timeOf = (iso: string) => {
  const d = new Date(iso);
  return isToday(d) ? format(d, 'p') : format(d, 'MMM d');
};

export function ChatInbox() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const selected = params.get('project') ? Number(params.get('project')) : null;

  const canChat = !user?.is_external || checkPermission(user?.role, CHAT.VIEW_PERMISSION);
  const canPostChat = !user?.is_external || checkPermission(user?.role, CHAT.POST_PERMISSION);
  const { data: rooms, isLoading } = useChatRooms(canChat);

  // Open the most active conversation by default, like LinkedIn's own inbox - but only once,
  // never overriding a room the reader already picked (or navigated to directly via the URL).
  useEffect(() => {
    if (selected || !rooms || rooms.length === 0) return;
    setParams({ project: String(rooms[0].project_id) }, { replace: true });
  }, [selected, rooms, setParams]);

  const activeRoom = useMemo(() => rooms?.find((r) => r.project_id === selected) ?? null, [rooms, selected]);

  if (!canChat) {
    return (
      <PageLayout title="Chat" showBackButton={false}>
        <p className="text-sm text-slate-500">Your role does not have access to chat.</p>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Chat" isFullHeight showBackButton={false}>
      <div className="flex-1 flex min-h-0 gap-4">
        <aside
          className={`w-full sm:w-[320px] flex-shrink-0 flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden
            ${selected ? 'hidden sm:flex' : 'flex'}`}
        >
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Conversations</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading && <p className="p-4 text-sm text-slate-400">Loading…</p>}
            {!isLoading && (rooms?.length ?? 0) === 0 && (
              <p className="p-4 text-sm text-slate-400">No projects to chat in yet.</p>
            )}
            {rooms?.map((room) => {
              const isActive = room.project_id === selected;
              const hasUnread = room.unread_count > 0;
              return (
                <button
                  key={room.project_id}
                  type="button"
                  onClick={() => setParams({ project: String(room.project_id) })}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-slate-100 dark:border-slate-800 transition-colors
                    ${isActive ? 'bg-teal-50 dark:bg-teal-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
                >
                  <span className="flex-shrink-0 h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 flex items-center justify-center text-xs font-bold">
                    {initialsOf(room.project_name)}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center justify-between gap-2">
                      <span className={`text-sm truncate ${hasUnread ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-200'}`}>
                        {room.project_name}
                      </span>
                      {room.last_message_at && (
                        <span className="flex-shrink-0 text-[11px] text-slate-400">{timeOf(room.last_message_at)}</span>
                      )}
                    </span>
                    <span className="flex items-center justify-between gap-2 mt-0.5">
                      <span className={`text-xs truncate flex items-center gap-1 ${hasUnread ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400'}`}>
                        {room.last_message_has_attachments && <Paperclip size={11} className="flex-shrink-0" />}
                        {previewOf(room)}
                      </span>
                      {hasUnread && (
                        <span
                          className={`flex-shrink-0 min-w-[18px] rounded-full px-1.5 text-center text-[10px] font-bold leading-[18px] text-white
                            ${room.mention_count > 0 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        >
                          {room.mention_count > 0 ? `@${room.mention_count}` : room.unread_count > 99 ? '99+' : room.unread_count}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <main className={`flex-1 min-w-0 min-h-0 flex-col ${selected ? 'flex' : 'hidden sm:flex'}`}>
          {activeRoom ? (
            <>
              <button
                type="button"
                onClick={() => setParams({})}
                className="sm:hidden mb-2 flex-shrink-0 flex items-center gap-1 text-sm font-semibold text-teal-600"
              >
                <ChevronLeft size={16} /> Conversations
              </button>
              <ProjectChatTab
                key={activeRoom.project_id}
                projectId={activeRoom.project_id}
                currentUserId={user?.id}
                canPost={canPostChat}
                canModerate={isAdmin(user?.role?.name)}
                fillHeight
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <MessageSquare size={32} className="mb-2 opacity-50" />
              <p className="text-sm">Select a conversation to start reading</p>
            </div>
          )}
        </main>
      </div>
    </PageLayout>
  );
}
