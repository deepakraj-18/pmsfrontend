import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/providers/ToastContext';
import { timelogsService, TimeLog } from '../api/timelogs.api';
import { timelogKeys } from './useTimelogs';

export function useTimelogActions() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const createTimelog = useMutation({
        mutationFn: (data: Partial<TimeLog>) => timelogsService.createTimelog(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: timelogKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            showToast('success', 'Time Logged', 'Entry recorded successfully.');
        },
    });

    const updateTimelog = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<TimeLog> }) =>
            timelogsService.updateTimelog(id, data),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: timelogKeys.lists() });
            queryClient.invalidateQueries({ queryKey: timelogKeys.detail(vars.id) });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            showToast('success', 'Time Log Updated', 'Entry updated successfully.');
        },
    });

    const deleteTimelog = useMutation({
        mutationFn: (id: number) => timelogsService.deleteTimelog(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: timelogKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            showToast('success', 'Log Deleted', 'Time entry has been removed.');
        },
    });

    const bulkCreateTimelogs = useMutation({
        mutationFn: (data: { logs: Partial<TimeLog>[] }) => timelogsService.bulkCreateTimelogs(data),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: timelogKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            showToast('success', 'Time Logs Created', `Successfully logged ${vars.logs.length} entries.`);
        },
    });

    return { createTimelog, updateTimelog, deleteTimelog, bulkCreateTimelogs };
}
