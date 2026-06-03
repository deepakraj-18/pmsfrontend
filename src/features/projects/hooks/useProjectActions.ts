import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/providers/ToastContext';
import { projectsService } from '../api/projects.api';
import { projectGroupsService } from '../api/project_groups.api';
import { projectKeys } from './useProjects';
import type { ProjectFormData } from '../types/project.types';

export interface AssignUserPayload {
    
    user_id?: number;
    
    user_email?: string;
    project_profile?: string;
    portal_profile?: string;
}

export function useProjectActions() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const createProject = useMutation({
        mutationFn: (data: ProjectFormData) => projectsService.createProject(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
            showToast('success', 'Project Created', 'New project has been added successfully.');
        },
    });

    const updateProject = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<ProjectFormData> }) =>
            projectsService.updateProject(id, data),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
            queryClient.invalidateQueries({ queryKey: projectKeys.detail(vars.id) });
            showToast('success', 'Project Updated', 'Changes saved successfully.');
        },
    });

    const deleteProject = useMutation({
        mutationFn: (id: number) => projectsService.deleteProject(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
            showToast('success', 'Project Deleted', 'The project has been removed.');
        },
    });

    const assignUser = useMutation({
        mutationFn: ({ projectId, payload }: { projectId: number; payload: AssignUserPayload }) =>
            projectsService.assignUser(projectId, payload),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.detail(vars.projectId) });
            showToast('success', 'Member Added', 'User has been assigned to the project.');
        },
    });

    const removeUser = useMutation({
        mutationFn: ({ projectId, userId }: { projectId: number; userId: number }) =>
            projectsService.removeUser(projectId, userId),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.detail(vars.projectId) });
            showToast('warning', 'Member Removed', 'User has been removed from the project.');
        },
    });


    const syncProject = useMutation({
        mutationFn: ({ id, data }: { id: number; data: { project_id_sync?: string; account_name?: string; customer_name?: string } }) =>
            projectsService.syncProject(id, data),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
            queryClient.invalidateQueries({ queryKey: projectKeys.detail(vars.id) });
            showToast('success', 'Project Synced', 'External data has been refreshed.');
        },
    });

    return { createProject, updateProject, deleteProject, assignUser, removeUser, syncProject };
}
