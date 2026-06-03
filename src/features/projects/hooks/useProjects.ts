import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsService } from '../api/projects.api';
import { ProjectFormData } from '../types/project.types';
import { projectGroupsService } from '../api/project_groups.api';

export const projectKeys = {
    all: ['projects'] as const,
    lists: () => [...projectKeys.all, 'list'] as const,
    list: (filters: string) => [...projectKeys.lists(), { filters }] as const,
    details: () => [...projectKeys.all, 'detail'] as const,
    detail: (id: number) => [...projectKeys.details(), id] as const,
    groups: () => [...projectKeys.all, 'groups'] as const,
};

export function useProjects(params: any = { skip: 0, limit: 100 }) {
    return useQuery({
        queryKey: [...projectKeys.lists(), params],
        queryFn: () => projectsService.getProjects(params),
    });
}

export function useProject(id: number) {
    return useQuery({
        queryKey: projectKeys.detail(id),
        queryFn: () => projectsService.getProject(id),
        enabled: !!id,
    });
}

export function useProjectGroups() {
    return useQuery({
        queryKey: projectKeys.groups(),
        queryFn: () => projectGroupsService.getProjectGroups(),
    });
}

export function useCreateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ProjectFormData) => projectsService.createProject(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
        },
    });
}

export function useUpdateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: ProjectFormData }) =>
            projectsService.updateProject(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
            queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
        },
    });
}
