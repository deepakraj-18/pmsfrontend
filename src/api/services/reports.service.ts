import { api } from '@/api/client';

export interface ReportSummary {
    total_projects: number;
    active_projects: number;
    total_tasks: number;
    completed_tasks: number;
    total_issues: number;
    open_issues: number;
    total_hours_logged: number;
    total_milestones?: number;
}

export interface ProjectReport {
    project_id: number;
    project_name: string;
    total_tasks: number;
    completed_tasks: number;
    total_issues: number;
    open_issues: number;
    total_milestones: number;
    total_hours_logged: number;
    tasks_by_status: { status: string; count: number }[];
    issues_by_priority: { priority: string; count: number }[];
    hours_by_user: { email: string; name: string; hours: number }[];
}

export const reportsService = {
    getSummary: async (): Promise<ReportSummary> => {
        const { data } = await api.get('/reports/summary');
        return data;
    },
    getProjectReport: async (projectId: number): Promise<ProjectReport> => {
        const { data } = await api.get(`/reports/project/${projectId}`);
        return data;
    },
};

