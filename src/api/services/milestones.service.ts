import { api } from '@/api/client';

export interface Milestone {
    id: number;
    public_id: string;
    project_id?: number;
    
    milestone_name: string;
    
    title?: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
    flags?: string;
    tags?: string;
    completion_percentage?: number;
    task_count?: number;
    issue_count?: number;
    owner?: any;
    project?: any;
    is_processed?: boolean;
    previous_status?: string | null;
}

export const milestonesService = {
    getMilestones: async (projectId?: number, skip = 0, limit = 100): Promise<Milestone[]> => {
        const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
        if (projectId) params.append('project_id', String(projectId));
        const { data } = await api.get(`/milestones/?${params}`);
        return data;
    },

    getMilestone: async (id: number): Promise<Milestone> => {
        const { data } = await api.get(`/milestones/${id}`);
        return data;
    },

    createMilestone: async (payload: Partial<Milestone>): Promise<Milestone> => {
        const { data } = await api.post('/milestones/', payload);
        return data;
    },

    updateMilestone: async (id: number, payload: Partial<Milestone>): Promise<Milestone> => {
        const { data } = await api.put(`/milestones/${id}`, payload);
        return data;
    },

    deleteMilestone: async (id: number): Promise<void> => {
        await api.delete(`/milestones/${id}`);
    },
};
