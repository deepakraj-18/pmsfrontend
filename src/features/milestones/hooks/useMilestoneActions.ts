import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/providers/ToastContext';
import { milestonesService } from '../api/milestones.api';

export function useMilestoneActions() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const createMilestone = useMutation({
        mutationFn: (data: any) => milestonesService.createMilestone(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['milestones'] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            showToast('success', 'Milestone Created', 'New milestone has been added successfully.');
        },
    });

    const updateMilestone = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) =>
            milestonesService.updateMilestone(id, data),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ['milestones'] });
            queryClient.invalidateQueries({ queryKey: ['milestone', vars.id] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            showToast('success', 'Milestone Updated', 'Changes saved successfully.');
        },
    });

    const deleteMilestone = useMutation({
        mutationFn: (id: number) => milestonesService.deleteMilestone(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['milestones'] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            showToast('success', 'Milestone Deleted', 'The milestone was removed.');
        },
    });

    return { createMilestone, updateMilestone, deleteMilestone };
}
