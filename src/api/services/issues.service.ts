import { api } from '@/api/client';

export interface Issue {
    id: number;
    public_id: string;
    bug_name: string;
    description: string | null;
    project_id: number | null;
    reporter_id: number | null;
    assignee_id: number | null;
    status: string | null;
    severity: string | null;
    priority: string | null;
    classification?: string | null;
    module?: string | null;
    tags?: string | null;
    flag?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    last_modified_time?: string | null;
    estimated_hours?: number;
    project?: any;
    reporter?: any;
    assignee?: any;
    assignees?: any[];
    followers?: any[];
    documents?: any[];
    created_at?: string;
    updated_at?: string;
    is_processed?: boolean;
    previous_status_id?: number | null;
}

export interface IssueListResponse {
    total: number;
    items: Issue[];
}

export const issuesService = {
    getIssues: async (params: any = { skip: 0, limit: 100 }): Promise<IssueListResponse> => {
        const { data } = await api.get('/issues/', { params });
        return data;
    },

    getIssue: async (issueId: number): Promise<Issue> => {
        const { data } = await api.get(`/issues/${issueId}`);
        return data;
    },

    createIssue: async (payload: any): Promise<Issue> => {
        const { data } = await api.post('/issues/', payload);
        return data;
    },

    bulkCreateIssues: async (payload: any[]): Promise<Issue[]> => {
        const { data } = await api.post('/issues/bulk', payload);
        return data;
    },

    updateIssue: async (issueId: number, payload: any): Promise<Issue> => {
        const { data } = await api.put(`/issues/${issueId}`, payload);
        return data;
    },

    deleteIssue: async (issueId: number): Promise<void> => {
        await api.delete(`/issues/${issueId}`);
    },
};
