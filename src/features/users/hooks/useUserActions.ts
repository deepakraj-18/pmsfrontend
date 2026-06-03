import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/providers/ToastContext';
import { usersService } from '../api/users.api';
import { userKeys } from './useUsers';

export function useUserActions() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const createUser = useMutation({
        mutationFn: (data: any) => usersService.createUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
            showToast('success', 'User Created', 'New user has been added.');
        },
    });

    const updateUser = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => usersService.updateUser(id, data),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
            queryClient.invalidateQueries({ queryKey: userKeys.detail(vars.id) });
            queryClient.invalidateQueries({ queryKey: userKeys.me });
            showToast('success', 'User Updated', 'Profile updated successfully.');
        },
    });

    const deleteUser = useMutation({
        mutationFn: (id: number) => usersService.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
            showToast('success', 'User Deleted', 'The user has been removed.');
        },
    });

    return { createUser, updateUser, deleteUser };
}
