import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasklistsService, TaskList } from '../api/tasklists.api';

export const taskListKeys = {
    all: ['taskLists'] as const,
    lists: () => [...taskListKeys.all, 'list'] as const,
    list: (projectId?: number) => [...taskListKeys.lists(), { projectId }] as const,
    detail: (id: number) => [...taskListKeys.all, 'detail', id] as const,
};

export function useTaskLists(projectId?: number) {
    return useQuery({
        queryKey: taskListKeys.list(projectId),
        queryFn: () => tasklistsService.getTaskLists(projectId),
    });
}

export function useCreateTaskList() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<TaskList>) => tasklistsService.createTaskList(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskListKeys.all });
        },
    });
}

export function useUpdateTaskList() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<TaskList> }) =>
            tasklistsService.updateTaskList(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: taskListKeys.all });
            queryClient.invalidateQueries({ queryKey: taskListKeys.detail(variables.id) });
        },
    });
}

export function useDeleteTaskList() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => tasklistsService.deleteTaskList(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskListKeys.all });
        },
    });
}
