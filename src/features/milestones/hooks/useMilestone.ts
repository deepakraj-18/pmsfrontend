import { useQuery } from '@tanstack/react-query';
import { milestonesService } from '../api/milestones.api';

export function useMilestone(id?: number) {
    return useQuery({
        queryKey: ['milestone', id],
        queryFn: () => milestonesService.getMilestone(id!),
        enabled: !!id,
    });
}
