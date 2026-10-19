import { api } from '@/api/client';
import { z } from 'zod';
import type { MasterItem } from '@/features/masters/types/master.types';

export const userSchema = z.object({
    first_name:    z.string().trim().min(2, 'First name is too short').max(50),
    last_name:     z.string().trim().max(50).nullable().optional(),
    email:         z.string().email('Invalid email address'),
    phone:         z.string().trim().max(20).nullable().optional(),
    employee_id:   z.string().trim().min(3, 'Employee ID is required'),
    job_title:     z.string().trim().max(100).nullable().optional(),
    username:      z.string().trim().max(50).nullable().optional(),
    role_id:       z.any().nullable().optional(),
    status_id:     z.any().nullable().optional(),
    manager_email: z.any().nullable().optional(),
    join_date:     z.date().nullable().optional(),
});

export type UserFormValues = z.infer<typeof userSchema>;

export interface User {
    id: number;
    public_id: string;
    email: string;
    username: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    job_title: string | null;
    join_date: string | null;
    role_id: number | null;
    status_id: number | null;
    role?: MasterItem;
    manager?: { first_name: string; last_name: string };
    status?: MasterItem;
    skills?: MasterItem[];
    is_external?: boolean;
}

export interface SyncUsersResult {
    total_fetched_from_azure: number;
    created: number;
    updated: number;
    skipped: number;
}

export const usersService = {
    getUsers: async (skip = 0, limit = 100): Promise<User[]> => {
        const { data } = await api.get('/users/', { params: { skip, limit } });
        return Array.isArray(data) ? data : (data.data ?? []);
    },

    // Bulk-pulls every user in the Azure AD tenant via Microsoft Graph (app-only, needs the
    // 'User.Read.All' application permission admin-consented in Azure AD) and upserts each
    // one locally. Throws on failure — most commonly a 400 because that permission/consent
    // isn't granted yet; the error message from the backend says so explicitly.
    syncFromAzure: async (): Promise<SyncUsersResult> => {
        const { data } = await api.post('/users/sync');
        return data;
    },

    getCurrentUser: async (): Promise<User> => {
        const { data } = await api.get('/users/me');
        return data;
    },

    getUser: async (userId: number): Promise<User> => {
        const { data } = await api.get(`/users/${userId}`);
        return data;
    },

    createUser: async (payload: any): Promise<User> => {
        const { data } = await api.post('/users/', payload);
        return data;
    },

    updateUser: async (userId: number, payload: any): Promise<User> => {
        const { data } = await api.put(`/users/${userId}`, payload);
        return data;
    },

    deleteUser: async (userId: number): Promise<void> => {
        await api.delete(`/users/${userId}`);
    },
};
