import { api } from '@/api/client';

export interface Task {
    id: number;
    public_id: string;
    task_name: string;
    description: string | null;
    project_id: number | null;
    assignee_id: number | null;
    owner_id: number | null;
    created_by_id: number | null;
    parent_id?: number | null;
    status_id?: number | null;
    priority_id?: number | null;
    status: any | null;
    priority: any | null;
    status_master?: any;
    priority_master?: any;
    task_list_id?: number | null;
    start_date?: string | null;
    due_date?: string | null;
    end_date?: string | null;
    duration?: number | null;
    estimated_hours?: number | null;
    work_hours?: number | null;
    actual_hours?: number | null;
    cached_timelog_total?: number;
    timelog_total?: number;
    difference?: number;
    completion_percentage: number;
    billing_type?: string | null;
    project?: any;
    task_list?: any;
    assignee?: any;
    single_owner?: any;
    creator?: any;
    assignees?: any[];
    owners?: any[];
    tags?: string | null;
    is_processed?: boolean;
    previous_status_id?: number | null;
}

export interface TaskListResponse {
    total: number;
    items: Task[];
    treeData?: any[];
}

export const tasksService = {
    getTasks: async (params: any = { skip: 0, limit: 100 }): Promise<TaskListResponse> => {
        const { data } = await api.get('/tasks/', { params });
        return data;
    },

    getTask: async (taskId: number): Promise<Task> => {
        const { data } = await api.get(`/tasks/${taskId}`);
        return data;
    },

    createTask: async (payload: any): Promise<Task> => {
        const { data } = await api.post('/tasks/', payload);
        return data;
    },

    bulkCreateTasks: async (tasks: any[]): Promise<Task[]> => {
        const { data } = await api.post('/tasks/bulk', tasks);
        return data;
    },

    updateTask: async (taskId: number, payload: any): Promise<Task> => {
        const { data } = await api.put(`/tasks/${taskId}`, payload);
        return data;
    },

    deleteTask: async (taskId: number): Promise<void> => {
        await api.delete(`/tasks/${taskId}`);
    },
};
