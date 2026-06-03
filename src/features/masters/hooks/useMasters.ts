import { useQuery } from '@tanstack/react-query';
import { mastersApi } from '../api/masters.api';

import { usersService } from '@/features/users/api/users.api';
import { teamsService } from '@/features/teams/api/teams.api';

export const masterKeys = {
    statuses:     ['masters', 'statuses']     as const,
    priorities:   ['masters', 'priorities']   as const,
    roles:        ['masters', 'roles']        as const,
    skills:       ['masters', 'skills']       as const,
    userStatuses: ['masters', 'userStatuses'] as const,
    users:        ['masters', 'users']        as const,
    teams:        ['masters', 'teams']        as const,
} as const;

const STATIC  = 60 * 60 * 1000; 
const DYNAMIC =  5 * 60 * 1000; 

export const useStatuses      = () => useQuery({ queryKey: masterKeys.statuses,     queryFn: mastersApi.getStatuses,     staleTime: STATIC  });
export const usePriorities    = () => useQuery({ queryKey: masterKeys.priorities,   queryFn: mastersApi.getPriorities,   staleTime: STATIC  });
export const useRolesLookup   = () => useQuery({ queryKey: masterKeys.roles,        queryFn: mastersApi.getRoles,        staleTime: STATIC  });
export const useUserStatuses  = () => useQuery({ queryKey: masterKeys.userStatuses, queryFn: mastersApi.getUserStatuses, staleTime: STATIC  });
export const useSkillsLookup  = () => useQuery({ queryKey: masterKeys.skills,       queryFn: mastersApi.getSkills,       staleTime: STATIC  });

export const useMasterLookups = (category: string) => 
    useQuery({ queryKey: ['masters', 'lookups', category], queryFn: () => mastersApi.getLookups(category), staleTime: STATIC });

export const useUsersDropdown = () =>
    useQuery({ queryKey: masterKeys.users, queryFn: () => usersService.getUsers(0, 1000), staleTime: DYNAMIC });

export const useTeamsDropdown = () =>
    useQuery({ queryKey: masterKeys.teams, queryFn: () => teamsService.getTeams(0, 500),  staleTime: DYNAMIC });
