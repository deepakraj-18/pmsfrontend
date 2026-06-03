import { z } from 'zod';

export const projectSchema = z.object({
    
    project_name:    z.string().trim().min(1, 'Project name is required').max(255),
    account_name:    z.string().trim().min(1, 'Account name is required').max(255),
    customer_name:   z.string().trim().min(1, 'Customer name is required').max(255),
    client_name:     z.string().nullable().optional(),
    project_id_sync: z.string().trim().min(1, 'External sync ID is required').max(100),

    billing_model:           z.any().optional(),
    project_type:            z.any().optional(),
    project_status_external: z.any().optional(),

    description:         z.string().nullable().optional(),
    project_manager_id:  z.coerce.number().nullable().optional(),
    delivery_head_id:    z.coerce.number().nullable().optional(),
    owner_id:            z.coerce.number().nullable().optional(),
    template_id:         z.coerce.number().nullable().optional(),

    status:              z.string().optional(),
    priority:            z.string().optional(),
    status_id:           z.any().refine(val => !!val, { message: "Status is required" }),
    priority_id:         z.any().refine(val => !!val, { message: "Priority is required" }),
    project_manager:     z.any().refine(val => !!val, { message: "Project Manager is required" }),
    delivery_head:       z.any().refine(val => !!val, { message: "Delivery Head is required" }),

    expected_start_date: z.any().refine(val => !!val, { message: "Expected Start Date is required" }),
    expected_end_date:   z.any().refine(val => !!val, { message: "Expected End Date is required" }),
    estimated_hours:     z.coerce.number().nullable().optional(),
    actual_start_date:   z.string().nullable().optional(),
    actual_end_date:     z.string().nullable().optional(),
    actual_hours:        z.coerce.number().nullable().optional(),

    is_template:         z.boolean().default(false),
    is_archived:         z.boolean().default(false),
    is_group:            z.boolean().default(false),
    tags:                z.string().nullable().optional(),

    user_emails:         z.array(z.string().email().or(z.literal(''))).min(1, 'At least one Team Member is required').default([]),
}).superRefine((data, ctx) => {
    if (data.expected_start_date && data.expected_end_date) {
        const start = new Date(data.expected_start_date);
        const end = new Date(data.expected_end_date);
        if (end < start) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Expected End Date cannot be before Expected Start Date",
                path: ["expected_end_date"]
            });
        }
    }
    if (data.actual_start_date && data.actual_end_date) {
        const aStart = new Date(data.actual_start_date);
        const aEnd = new Date(data.actual_end_date);
        if (aEnd < aStart) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Actual End Date cannot be before Actual Start Date",
                path: ["actual_end_date"]
            });
        }
    }
});

export type ProjectFormData = z.infer<typeof projectSchema>;

export interface ProjectUser {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    display_name?: string | null;
    role?: { id: number; name: string } | null;
}

export interface MasterItem {
    id: number;
    /** The display label returned by MasterLookupResponse */
    label: string;
    /** Internal value key */
    value?: string;
    /** Lookup category, e.g. "ProjectStatus", "IssueSeverity" */
    category?: string;
    color?: string | null;
    icon?: string | null;
    /** Kept for backward compat; prefer `label` */
    name?: string;
}


export interface ProjectMember {
    project_id: number;
    user_id: number;
    project_profile?: string | null;
    portal_profile?: string | null;
    role_in_project?: string | null;
    invitation_status: string;
    is_owner: boolean;
    
    // Email automation
    is_processed: boolean;
    previous_invitation_status?: string | null;

    user?: ProjectUser | null;
}

export interface Project extends Omit<ProjectFormData, 'status' | 'priority'> {
    id: number;
    public_id: string;

    manager?: ProjectUser | null;
    creator?: ProjectUser | null;
    owner?: ProjectUser | null;
    project_manager?: ProjectUser | null;
    delivery_head?: ProjectUser | null;
    
    // API usually returns string, but sometimes wrapped for master lookup compatibility
    status?: string | MasterItem | null;
    priority?: string | MasterItem | null;

    status_master?: MasterItem | null;
    priority_master?: MasterItem | null;
    status_id?: number | null;
    priority_id?: number | null;

    // Email automation
    is_processed: boolean;
    previous_status?: string | null;



    ms_teams_group_id?: string | null;
    ms_teams_channel_id?: string | null;


    tags?: string | null;

    
    task_count: number;
    issue_count: number;
    milestone_count: number;

    
    team_members: ProjectMember[];


    tasks?: any[];
    issues?: any[];
    milestones?: any[];
    task_lists?: any[];
    documents?: any[];
    timelogs?: any[];
}

export const projectSyncSchema = z.object({
    project_id_sync: z.string().min(1).max(100).optional(),
    account_name:    z.string().min(1).max(255).optional(),
    customer_name:   z.string().min(1).max(255).optional(),
});

export type ProjectSyncData = z.infer<typeof projectSyncSchema>;
