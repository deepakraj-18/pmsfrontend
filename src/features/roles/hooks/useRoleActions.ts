import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/providers/ToastContext';
import { useAuth } from '@/auth/AuthProvider';
import { rolesService, RoleCreate, RoleUpdate } from '../api/roles.api';

export function useRoleActions() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const { refreshProfile } = useAuth();

    const createRole = useMutation({
        mutationFn: (data: RoleCreate) => rolesService.createRole(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            showToast('success', 'Role Created', 'New role has been added successfully.');
        },
    });

    const updateRole = useMutation({
        mutationFn: ({ id, data }: { id: number; data: RoleUpdate }) =>
            rolesService.updateRole(id, data),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            queryClient.invalidateQueries({ queryKey: ['roles', vars.id] });
            showToast('success', 'Role Updated', 'Changes saved successfully.');
        },
    });

    const deleteRole = useMutation({
        mutationFn: (id: number) => rolesService.deleteRole(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            showToast('success', 'Role Deleted', 'The role has been removed.');
        },
    });

    const bulkUpdatePermissions = useMutation({
        mutationFn: (data: Record<number, any>) => rolesService.updateBulkRolePermissions(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            refreshProfile().catch(console.error);
            showToast('success', 'Permissions Updated', 'Matrix changes saved successfully.');
        },
    });

    return { createRole, updateRole, deleteRole, bulkUpdatePermissions };
}
