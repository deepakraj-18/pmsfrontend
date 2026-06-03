import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/providers/ToastContext';
import { issuesService } from '../api/issues.api';
import { issueKeys } from './useIssues';

export function useIssueActions() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const createIssue = useMutation({
        mutationFn: (data: any) => issuesService.createIssue(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            showToast('success', 'Defect Reported', 'New defect has been logged successfully.');
        },
    });


    const updateIssue = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => issuesService.updateIssue(id, data),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: issueKeys.all });
            queryClient.invalidateQueries({ queryKey: issueKeys.detail(vars.id) });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            showToast('success', 'Defect Updated', 'Changes saved successfully.');
        },
    });

    const deleteIssue = useMutation({
        mutationFn: (id: number) => issuesService.deleteIssue(id),
        onSuccess: (_, id) => {
            // Immediately remove from cache
            queryClient.removeQueries({ queryKey: issueKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: issueKeys.all });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            showToast('success', 'Defect Deleted', 'The defect has been removed.');
        },
        onError: () => {
            showToast('error', 'Delete Failed', 'Could not delete the defect. It may have already been removed.');
        },
    });

    const bulkCreateIssues = useMutation({
        mutationFn: (issues: any[]) => issuesService.bulkCreateIssues(issues),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            showToast('success', 'Issues Created', 'Bulk issues have been added.');
        },
    });

    return { createIssue, updateIssue, deleteIssue, bulkCreateIssues };
}

