import { api } from '@/api/client';
import { User } from '@/api/services/users.service';

export interface Document {
    id: number;
    title: string;
    description?: string;
    file_url: string;
    file_type: string;
    file_size?: number;
    project_id: number;
    uploaded_by_email?: string;
    uploaded_by?: User;
    created_at: string;
    updated_at: string;
}

export interface DocumentCreate {
    title: string;
    description?: string;
    file_url: string;
    file_type?: string;
    file_size?: number;
    project_id: number;
}

export interface DocumentUpdate {
    title?: string;
    description?: string;
    file_url?: string;
    file_type?: string;
}

export const documentsService = {
    getDocuments: async (skip = 0, limit = 100, projectId?: number): Promise<Document[]> => {
        const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
        if (projectId) params.append('project_id', String(projectId));
        const { data } = await api.get(`/documents/?${params}`);
        return data;
    },

    getDocument: async (id: number): Promise<Document> => {
        const { data } = await api.get(`/documents/${id}`);
        return data;
    },

    createDocument: async (
        file: File,
        projectId: number,
        title?: string,
        description?: string,
    ): Promise<Document> => {
        const form = new FormData();
        form.append('file', file);
        form.append('project_id', String(projectId));
        if (title) form.append('title', title);
        if (description) form.append('description', description);
        const { data } = await api.post('/documents/upload', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },

    createLinkDocument: async (payload: DocumentCreate): Promise<Document> => {
        const { data } = await api.post('/documents/', payload);
        return data;
    },

    updateDocument: async (id: number, payload: DocumentUpdate): Promise<Document> => {
        const { data } = await api.put(`/documents/${id}`, payload);
        return data;
    },

    deleteDocument: async (id: number): Promise<void> => {
        await api.delete(`/documents/${id}`);
    },
};
