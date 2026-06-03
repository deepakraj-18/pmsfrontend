import { api } from '@/api/client';

export interface ProjectGroup {
    id: number;
    name: string;
    description?: string;
}

export interface ProjectGroupCreate {
    name: string;
    description?: string;
}

export interface ProjectGroupUpdate {
    name?: string;
    description?: string;
}

export const projectGroupsService = {
    getProjectGroups: async (skip = 0, limit = 100): Promise<ProjectGroup[]> => {
        const { data } = await api.get('/project-groups/', { params: { skip, limit } });
        return data;
    },

    getProjectGroup: async (id: number): Promise<ProjectGroup> => {
        const { data } = await api.get(`/project-groups/${id}`);
        return data;
    },

    createProjectGroup: async (payload: ProjectGroupCreate): Promise<ProjectGroup> => {
        const { data } = await api.post('/project-groups/', payload);
        return data;
    },

    updateProjectGroup: async (id: number, payload: ProjectGroupUpdate): Promise<ProjectGroup> => {
        const { data } = await api.put(`/project-groups/${id}`, payload);
        return data;
    },

    deleteProjectGroup: async (id: number): Promise<void> => {
        await api.delete(`/project-groups/${id}`);
    },
};
