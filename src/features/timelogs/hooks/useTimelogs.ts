import { useQuery } from '@tanstack/react-query';
import { timelogsService } from '../api/timelogs.api';

export const timelogKeys = {
    all:     ['timelogs']                                          as const,
    lists:   () => [...timelogKeys.all, 'list']                   as const,
    list:    (f: any) => [...timelogKeys.lists(), { f }]          as const,
    details: () => [...timelogKeys.all, 'detail']                 as const,
    detail:  (id: number) => [...timelogKeys.details(), id]       as const,
};

export function useTimelogs(skip = 0, limit = 500, projectId?: number) {
    return useQuery({
        queryKey: timelogKeys.list({ skip, limit, projectId }),
        queryFn:  () => timelogsService.getTimelogs(skip, limit, projectId),
    });
}

export function useTimelog(id: number) {
    return useQuery({
        queryKey: timelogKeys.detail(id),
        queryFn:  () => timelogsService.getTimelog(id),
        enabled:  !!id,
    });
}
