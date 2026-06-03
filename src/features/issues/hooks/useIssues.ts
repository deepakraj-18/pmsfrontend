import { useQuery } from '@tanstack/react-query';
import { issuesService } from '../api/issues.api';

export const issueKeys = {
    all:     ['issues']                              as const,
    lists:   () => [...issueKeys.all, 'list']        as const,
    list:    (f: any) => [...issueKeys.lists(), { f }] as const,
    details: () => [...issueKeys.all, 'detail']     as const,
    detail:  (id: number) => [...issueKeys.details(), id] as const,
};

export function useIssues(params: any = { skip: 0, limit: 100 }) {
    return useQuery({
        queryKey: ['issues', 'list', params],
        queryFn:  () => issuesService.getIssues(params),
    });
}

export function useIssue(id: number) {
    return useQuery({
        queryKey: issueKeys.detail(id),
        queryFn:  () => issuesService.getIssue(id),
        enabled:  !!id,
    });
}
