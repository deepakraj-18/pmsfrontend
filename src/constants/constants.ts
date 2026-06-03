export const THEME_COLORS = {
    TEAL: 'hsl(160 60% 45%)',
    BRAND_TEAL: '#14b8a6',
    EMERALD: '#10b981',
    RED: '#ef4444',
    ORANGE: '#f97316',
    AMBER: '#f59e0b',
    SLATE: '#64748b',
};

export const PRIORITY_COLORS: Record<string, string> = {
    critical: '#991b1b',
    high: '#9a3412',
    medium: '#854d0e',
    low: '#166534',
    none: '#6b7280',
};

export const SEVERITY_COLORS: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
    normal: '#64748b',
    blocker: '#b91c1c',
    'show stopper': '#7f1d1d',
};

export const ISSUE_CLASSIFICATIONS = [
    'None', 'Security', 'Crash/Hang', 'Data Loss', 'Performance',
    'UI/UX Usability', 'Other Bugs', 'Feature (New)', 'Enhancement',
];

export const BUG_TYPE_OPTIONS = [
    { label: 'Internal', value: 'Internal' },
    { label: 'External', value: 'External' },
];

export const REPRO_OPTIONS = [
    { label: 'Yes', value: true },
    { label: 'No', value: false },
];

export const BILLING_OPTIONS = [
    { label: 'Billable', value: 'Billable' },
    { label: 'Non-Billable', value: 'Non-Billable' },
    { label: 'Internal', value: 'Internal' },
];

export const CACHE_INVALIDATION_RESOURCES = ['tasks', 'issues', 'timelogs', 'milestones'];
export const MUTATION_METHODS = ['post', 'put', 'delete', 'patch'];

export const AUTH_TOKEN_KEY = 'pms_token';
export const AUTH_REFRESH_TOKEN_KEY = 'pms_refresh_token';

export const API_V1_PREFIX = /^\/api\/v1\//;

export const QUERY_KEYS = {
    REPORTS: 'reports',
    PROJECTS: 'projects',
    MASTERS: 'masters',
    TIMELOGS: 'timelogs',
    MILESTONES: 'milestones',
    TASKS: 'tasks',
    ISSUES: 'issues',
} as const;

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
} as const;

export const AUTH_ENDPOINTS = {
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
} as const;

export const ROUTES = {
    LOGIN: '/login',
    DASHBOARD: '/',
} as const;

export const STORAGE_KEYS = {
    TOKEN: AUTH_TOKEN_KEY,
    REFRESH_TOKEN: AUTH_REFRESH_TOKEN_KEY,
    THEME: 'app-theme',
    USER: 'user',
    USER_DATA: 'user_data',
} as const;

export const EVENTS = {
    TOAST: 'pms:toast',
} as const;
