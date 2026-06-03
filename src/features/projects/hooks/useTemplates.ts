import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/providers/ToastContext';
import { projectsService } from '../api/projects.api';
import type { ProjectTemplate, ProjectTemplateCreate, ProjectTemplateUpdate, TemplateTaskCreate } from '../types/template.types';

const templateKeys = {
    all: ['templates'] as const,
    lists: () => [...templateKeys.all, 'list'] as const,
    detail: (id: number) => [...templateKeys.all, 'detail', id] as const,
};

export function useTemplates() {
    return useQuery<ProjectTemplate[]>({
        queryKey: templateKeys.lists(),
        queryFn: () => projectsService.getTemplates(),
        staleTime: 5 * 60 * 1000,
    });
}

export function useTemplate(id: number) {
    return useQuery<ProjectTemplate>({
        queryKey: templateKeys.detail(id),
        queryFn: () => projectsService.getTemplate(id),
        enabled: !!id,
    });
}

export function useCreateTemplate() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: (data: ProjectTemplateCreate) => projectsService.createTemplate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
            showToast('success', 'Template Created', 'Project template saved successfully.');
        },
        onError: () => {
            showToast('error', 'Error', 'Failed to create template.');
        },
    });
}

export function useUpdateTemplate() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: ProjectTemplateUpdate }) =>
            projectsService.updateTemplate(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
            queryClient.invalidateQueries({ queryKey: templateKeys.detail(id) });
            showToast('success', 'Template Updated', 'Changes saved.');
        },
        onError: () => {
            showToast('error', 'Error', 'Failed to update template.');
        },
    });
}

export function useAddTemplateTask() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: ({ templateId, task }: { templateId: number; task: TemplateTaskCreate }) =>
            projectsService.addTemplateTask(templateId, task),
        onSuccess: (_, { templateId }) => {
            queryClient.invalidateQueries({ queryKey: templateKeys.detail(templateId) });
            queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
        },
        onError: () => {
            showToast('error', 'Error', 'Failed to add task.');
        },
    });
}

export function useRemoveTemplateTask() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: ({ templateId, taskId }: { templateId: number; taskId: number }) =>
            projectsService.removeTemplateTask(templateId, taskId),
        onSuccess: (_, { templateId }) => {
            queryClient.invalidateQueries({ queryKey: templateKeys.detail(templateId) });
            queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
        },
        onError: () => {
            showToast('error', 'Error', 'Failed to remove task.');
        },
    });
}

export function useDeleteTemplate() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: (id: number) => projectsService.deleteTemplate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
            showToast('warning', 'Template Deleted', 'Template has been removed.');
        },
    });
}

export function useCloneProjectToTemplate() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: ({
            projectId,
            template_name,
            include_milestones,
        }: { projectId: number; template_name: string; include_milestones: boolean }) =>
            projectsService.cloneProjectToTemplate(projectId, { template_name, include_milestones }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
            showToast('success', 'Template Created', 'Project saved as a template successfully.');
        },
        onError: () => {
            showToast('error', 'Error', 'Failed to clone project to template.');
        },
    });
}
