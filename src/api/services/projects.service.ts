import { api } from '@/api/client';
import type { Project } from '@/features/projects/types/project.types';
import type { ProjectTemplate, ProjectTemplateCreate, ProjectTemplateUpdate, TemplateTaskCreate } from '@/features/projects/types/template.types';

export type { Project };

export const projectsService = {
    getProjects: async (params?: {
        skip?: number; limit?: number; include_all?: boolean;
        status_id?: number[]; priority_id?: number[]; is_archived?: boolean; is_template?: boolean;
        search?: string; manager_emails?: string[]; member_email?: string;
    }): Promise<{ total: number; items: Project[] }> => {
        const { data } = await api.get('/projects/', { params: { skip: 0, limit: 100, include_all: true, ...params } });
        return data;
    },

    getProject: async (projectId: number): Promise<Project> => {
        const { data } = await api.get(`/projects/${projectId}`);
        return data;
    },

    createProject: async (payload: any): Promise<Project> => {
        const { data } = await api.post('/projects/', payload);
        return data;
    },

    checkSyncId: async (id: string, excludeProjectId?: number): Promise<boolean> => {
        const params: any = { id };
        if (excludeProjectId) params.exclude_project_id = excludeProjectId;
        const { data } = await api.get('/projects/check-sync-id', { params });
        return data.exists;
    },

    checkName: async (name: string, excludeProjectId?: number): Promise<boolean> => {
        const params: any = { name };
        if (excludeProjectId) params.exclude_project_id = excludeProjectId;
        const { data } = await api.get('/projects/check-name', { params });
        return data.exists;
    },

    updateProject: async (projectId: number, payload: any): Promise<Project> => {
        const { data } = await api.put(`/projects/${projectId}`, payload);
        return data;
    },

    deleteProject: async (projectId: number): Promise<void> => {
        await api.delete(`/projects/${projectId}`);
    },

    archiveProject: async (projectId: number): Promise<Project> => {
        const { data } = await api.patch(`/projects/${projectId}/archive`);
        return data;
    },

    unarchiveProject: async (projectId: number): Promise<Project> => {
        const { data } = await api.patch(`/projects/${projectId}/unarchive`);
        return data;
    },

    syncProject: async (projectId: number, payload: { project_id_sync?: string; account_name?: string; customer_name?: string }): Promise<Project> => {
        const { data } = await api.post(`/projects/${projectId}/sync`, payload);
        return data;
    },

    assignUser: async (
        projectId: number,
        payload: { user_id?: number; user_email?: string; project_profile?: string; portal_profile?: string },
    ): Promise<void> => {
        await api.post(`/projects/${projectId}/members`, payload);
    },

    removeUser: async (projectId: number, userId: number): Promise<void> => {
        await api.delete(`/projects/${projectId}/members/${userId}`);
    },

    getProjectMembers: async (projectId: number) => {
        const { data } = await api.get(`/projects/${projectId}/members`);
        return data;
    },

    getProjectDashboard: async (projectId: number) => {
        const { data } = await api.get(`/projects/${projectId}/dashboard`);
        return data;
    },

    getTemplates: async (): Promise<ProjectTemplate[]> => {
        const { data } = await api.get('/templates/');
        return data;
    },

    getTemplate: async (templateId: number): Promise<ProjectTemplate> => {
        const { data } = await api.get(`/templates/${templateId}`);
        return data;
    },

    createTemplate: async (payload: ProjectTemplateCreate): Promise<ProjectTemplate> => {
        const { data } = await api.post('/templates/', payload);
        return data;
    },

    updateTemplate: async (templateId: number, payload: ProjectTemplateUpdate): Promise<ProjectTemplate> => {
        const { data } = await api.put(`/templates/${templateId}`, payload);
        return data;
    },

    addTemplateTask: async (templateId: number, task: TemplateTaskCreate): Promise<ProjectTemplate> => {
        const { data } = await api.post(`/templates/${templateId}/tasks`, task);
        return data;
    },

    removeTemplateTask: async (templateId: number, taskId: number): Promise<ProjectTemplate> => {
        const { data } = await api.delete(`/templates/${templateId}/tasks/${taskId}`);
        return data;
    },

    deleteTemplate: async (templateId: number): Promise<void> => {
        await api.delete(`/templates/${templateId}`);
    },

    cloneProjectToTemplate: async (
        projectId: number,
        payload: { template_name: string; include_milestones: boolean },
    ): Promise<ProjectTemplate> => {
        const { data } = await api.post(`/projects/${projectId}/clone-to-template`, payload);
        return data;
    },
};

