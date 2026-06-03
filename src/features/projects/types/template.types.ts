
export interface TemplateTaskItem {
    id: number;
    title: string;
    description?: string | null;
    estimated_hours?: number | null;
    duration?: number | null;
    billing_type?: string | null;
    tags?: string | null;
    order_index: number;
}

export interface TemplateCreator {
    id: number;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
}

export interface ProjectTemplate {
    id: number;
    name: string;
    description?: string | null;
    billing_type?: string | null;
    is_public: boolean;
    created_by?: TemplateCreator | null;
    created_at?: string | null;
    updated_at?: string | null;
    tasks: TemplateTaskItem[];
}

export interface TemplateTaskCreate {
    title: string;
    description?: string;
    estimated_hours?: number;
    duration?: number;
    billing_type?: string;
    tags?: string;
    order_index?: number;
}

export interface ProjectTemplateCreate {
    name: string;
    description?: string;
    billing_type?: string;
    is_public?: boolean;
    tasks: TemplateTaskCreate[];
}

export interface ProjectTemplateUpdate {
    name?: string;
    description?: string;
    billing_type?: string;
    is_public?: boolean;
    tasks?: TemplateTaskCreate[];
}
