import { api } from '@/api/client';

export interface TimeLog {
    id: number;
    public_id?: string;
    log_title?: string;
    user_id: number;
    created_by_id?: number;
    project_id?: number;
    task_id?: number;
    issue_id?: number;
    date: string;
    daily_log_hours: number;
    time_period?: string;
    notes?: string;
    billing_type: string;
    approval_status: string;
    general_log: boolean;
    user?: any;
    created_by?: any;
    project?: any;
    task?: any;
    issue?: any;
}

export const timelogsService = {
    getTimelogs: async (skip = 0, limit = 500, projectId?: number, taskId?: number, issueId?: number): Promise<TimeLog[]> => {
        const params: Record<string, any> = { skip, limit };
        if (projectId) params.project_id = projectId;
        if (taskId) params.task_id = taskId;
        if (issueId) params.issue_id = issueId;
        const { data } = await api.get('/timelogs/', { params });
        return data;
    },

    getTimelog: async (id: number): Promise<TimeLog> => {
        const { data } = await api.get(`/timelogs/${id}`);
        return data;
    },

    createTimelog: async (payload: Partial<TimeLog>): Promise<TimeLog> => {
        const { data } = await api.post('/timelogs/', payload);
        return data;
    },

    bulkCreateTimelogs: async (payload: { logs: Partial<TimeLog>[] }): Promise<TimeLog[]> => {
        const { data } = await api.post('/timelogs/bulk', payload);
        return data;
    },

    updateTimelog: async (id: number, payload: Partial<TimeLog>): Promise<TimeLog> => {
        const { data } = await api.put(`/timelogs/${id}`, payload);
        return data;
    },

    deleteTimelog: async (id: number): Promise<void> => {
        await api.delete(`/timelogs/${id}`);
    },
};
