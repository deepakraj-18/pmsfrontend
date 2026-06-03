import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/providers/ToastContext';
import { tasksService } from '../api/tasks.api';
import { taskKeys } from './useTasks';

export function useTaskActions() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const createTask = useMutation({
        mutationFn: (data: any) => tasksService.createTask(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            showToast('success', 'Task Created', 'The task has been created successfully.');
        },
    });

    const updateTask = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => tasksService.updateTask(id, data),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all });
            queryClient.invalidateQueries({ queryKey: taskKeys.detail(vars.id) });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            showToast('success', 'Task Updated', 'Changes saved successfully.');
        },
    });

    const deleteTask = useMutation({
        mutationFn: (id: number) => tasksService.deleteTask(id),
        onSuccess: (_, id) => {
            // Immediately remove from cache
            queryClient.removeQueries({ queryKey: taskKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: taskKeys.all });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            showToast('success', 'Task Deleted', 'The task has been removed.');
        },
    });

    const bulkCreateTasks = useMutation({
        mutationFn: (tasks: any[]) => tasksService.bulkCreateTasks(tasks),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            showToast('success', 'Tasks Imported', 'Multiple tasks have been created.');
        },
    });

    return { createTask, updateTask, deleteTask, bulkCreateTasks };
}

