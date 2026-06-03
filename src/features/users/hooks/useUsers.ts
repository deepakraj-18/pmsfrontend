import { useQuery } from '@tanstack/react-query';
import { usersService } from '../api/users.api';

export const userKeys = {
    all:     ['users']                                         as const,
    lists:   () => [...userKeys.all, 'list']                  as const,
    list:    (f: any) => [...userKeys.lists(), { f }]         as const,
    details: () => [...userKeys.all, 'detail']                as const,
    detail:  (id: number) => [...userKeys.details(), id]      as const,
    me:      ['users', 'me']                                  as const,
};

export function useUsers(skip = 0, limit = 100) {
    return useQuery({
        queryKey: userKeys.list({ skip, limit }),
        queryFn:  () => usersService.getUsers(skip, limit),
    });
}

export function useCurrentUser() {
    return useQuery({
        queryKey: userKeys.me,
        queryFn:  () => usersService.getCurrentUser(),
        staleTime: 5 * 60 * 1000,
    });
}

export function useUser(id: number) {
    return useQuery({
        queryKey: userKeys.detail(id),
        queryFn:  () => usersService.getUser(id),
        enabled:  !!id,
    });
}
