
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksService, Task } from '@/api/services/tasks.service';

export const taskKeys = {
    all: ['tasks'] as const,
    lists: () => [...taskKeys.all, 'list'] as const,
    list: (filters: any) => [...taskKeys.lists(), { filters }] as const,
    details: () => [...taskKeys.all, 'detail'] as const,
    detail: (id: number) => [...taskKeys.details(), id] as const,
};

export function useTasks(params: any = { skip: 0, limit: 500 }) {
    return useQuery({
        queryKey: taskKeys.list(params),
        queryFn: () => tasksService.getTasks(params),
    });
}

export function useTask(id: number) {
    return useQuery({
        queryKey: taskKeys.detail(id),
        queryFn: () => tasksService.getTask(id),
        enabled: !!id && id > 0,
    });
}

export function useUpdateTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) =>
            tasksService.updateTask(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all });
            queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });
}

export function useDeleteTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => tasksService.deleteTask(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });
}
