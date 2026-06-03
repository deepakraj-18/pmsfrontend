import { api } from '@/api/client';
import { z } from 'zod';

export const roleSchema = z.object({
    name: z.string().trim().min(3, 'Role name must be at least 3 characters').max(50),
    description: z.string().trim().max(255).nullable().default(''),
    permissions: z.record(z.string(), z.any()),
    user_ids: z.array(z.coerce.number().int().positive()),
});

export interface RoleFormValues {
    name: string;
    description: string | null;
    permissions: Record<string, any>;
    user_ids: number[];
}

export interface RoleCreate {
    name: string;
    description?: string | null;
    permissions?: Record<string, any>;
    user_ids?: number[];
}

export interface RoleUpdate extends Partial<RoleCreate> {}

export interface Role {
    id: number;
    name: string;
    description: string | null;
    permissions: any;
    users?: any[];
    users_count: number;
}

export const rolesService = {
    getRoles: async (): Promise<Role[]> => {
        const { data } = await api.get('/masters/roles');
        return data;
    },

    getRole: async (roleId: number): Promise<Role> => {
        const { data } = await api.get(`/masters/roles/${roleId}`);
        return data;
    },

    createRole: async (payload: RoleCreate): Promise<Role> => {
        const { data } = await api.post('/masters/roles', payload);
        return data;
    },

    updateRole: async (roleId: number, payload: RoleUpdate): Promise<Role> => {
        const { data } = await api.put(`/masters/roles/${roleId}`, payload);
        return data;
    },

    deleteRole: async (roleId: number): Promise<void> => {
        await api.delete(`/masters/roles/${roleId}`);
    },

    updateBulkRolePermissions: async (role_permissions: Record<number, any>): Promise<void> => {
        await api.post('/masters/roles/bulk-permissions', { role_permissions });
    },
};
