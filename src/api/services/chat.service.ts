import { api } from '@/api/client';

export interface ChatAttachment {
    id: number;
    file_name: string;
    content_type: string;
    size: number;
}

export interface ChatMessage {
    id: number;
    project_id: number;
    sender_id: number | null;
    sender_name: string;
    sender_is_external: boolean;
    body: string;
    created_at: string;
    edited_at: string | null;
    attachments: ChatAttachment[];
}

export interface ChatUnread {
    project_id: number;
    count: number;
    mention_count: number;
}

export interface ChatMember {
    id: number;
    name: string;
    is_external: boolean;
}

// `api` already unwraps the { is_success, data } envelope.
export const chatService = {
    async getMessages(projectId: number, beforeId?: number, limit = 50): Promise<ChatMessage[]> {
        const { data } = await api.get(`/projects/${projectId}/chat/messages`, {
            params: { beforeId, limit },
        });
        return data;
    },

    async post(projectId: number, body: string, files: File[] = []): Promise<ChatMessage> {
        if (files.length === 0) {
            const { data } = await api.post(`/projects/${projectId}/chat/messages`, { body });
            return data;
        }
        // Files ride along as multipart; the browser sets the boundary itself.
        const form = new FormData();
        form.append('body', body);
        files.forEach((f) => form.append('files', f, f.name));
        const { data } = await api.post(`/projects/${projectId}/chat/messages`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 120_000,
        });
        return data;
    },

    /** A one-minute credential for the live connection; a URL (and its logs) never holds a real token. */
    async ticket(): Promise<string> {
        const { data } = await api.post('/chat/ticket');
        return data.ticket;
    },

    /** Files are fetched with the user's token (never a public link), then shown or saved from memory. */
    async downloadAttachment(projectId: number, attachmentId: number): Promise<Blob> {
        const { data } = await api.get(`/projects/${projectId}/chat/attachments/${attachmentId}`, {
            responseType: 'blob',
            timeout: 120_000,
        });
        return data;
    },

    async edit(projectId: number, messageId: number, body: string): Promise<ChatMessage> {
        const { data } = await api.put(`/projects/${projectId}/chat/messages/${messageId}`, { body });
        return data;
    },

    async remove(projectId: number, messageId: number): Promise<void> {
        await api.delete(`/projects/${projectId}/chat/messages/${messageId}`);
    },

    async markRead(projectId: number, lastMessageId: number): Promise<void> {
        await api.post(`/projects/${projectId}/chat/read`, { last_message_id: lastMessageId });
    },

    async getMembers(projectId: number): Promise<ChatMember[]> {
        const { data } = await api.get(`/projects/${projectId}/chat/members`);
        return data;
    },

    async getUnread(): Promise<ChatUnread[]> {
        const { data } = await api.get('/chat/unread');
        return data;
    },
};
