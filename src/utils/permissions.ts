export const ROLES = {
  ADMIN: 'Admin',
  TEAM_LEAD: 'Team Lead',
  EMPLOYEE: 'Employee',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export interface UserRole {
  id: number;
  name: string;
  permissions?: Record<string, any>;
}

export const checkPermission = (role: UserRole | null | undefined, permissionId: string): boolean => {
  if (!role) return false;

  const roleName = role.name?.toLowerCase();
  if (roleName === ROLES.ADMIN.toLowerCase()) return true;

  if (role.permissions) {
    const val = role.permissions[permissionId];
    // Accept boolean true OR any string value ('O', 'A', 'All') as a valid permission
    if (val === true || val === 'O' || val === 'A' || val === 'All') {
      return true;
    }
  }

  return false;
};

/** Get the specific view level for a permission: 'O' | 'A' | 'All' | null */
export const getViewLevel = (role: UserRole | null | undefined, permissionId: string): string | null => {
  if (!role) return null;

  const roleName = role.name?.toLowerCase();
  if (roleName === ROLES.ADMIN.toLowerCase()) return 'All';

  if (role.permissions) {
    const val = role.permissions[permissionId];
    if (val === true || val === 'All') return 'All';
    if (val === 'O') return 'O';
    if (val === 'A') return 'A';
  }

  return null;
};

export const isAdmin = (role?: string | null): boolean =>
  role?.toLowerCase() === ROLES.ADMIN.toLowerCase();

export const isTeamLead = (role?: string | null): boolean =>
  role?.toLowerCase() === ROLES.TEAM_LEAD.toLowerCase();

export const isEmployee = (role?: string | null): boolean =>
  role?.toLowerCase() === ROLES.EMPLOYEE.toLowerCase();

export const isFullAccess = (role?: string | null): boolean =>
  isAdmin(role);

export const isTeamLeadOrAbove = (role?: string | null): boolean =>
  isFullAccess(role) || isTeamLead(role);

export const isEmployeeOnly = (role?: string | null): boolean =>
  isEmployee(role);

export const can = {
  createProject: (role?: UserRole | null) => checkPermission(role, 'proj-create'),
  editProject: (role?: UserRole | null) => checkPermission(role, 'proj-edit'),
  deleteProject: (role?: UserRole | null) => checkPermission(role, 'proj-delete'),
  assignToProject: (role?: UserRole | null) => checkPermission(role, 'proj-assign'),

  createTask: (role?: UserRole | null) => checkPermission(role, 'task-create'),
  deleteTask: (role?: UserRole | null) => checkPermission(role, 'task-delete'),
  updateTask: (role?: UserRole | null) => checkPermission(role, 'task-edit'),

  createIssue: (role?: UserRole | null) => checkPermission(role, 'issue-create'),
  deleteIssue: (role?: UserRole | null) => checkPermission(role, 'issue-delete'),
  updateIssue: (role?: UserRole | null) => checkPermission(role, 'issue-edit'),

  manageTaskLists: (role?: UserRole | null) => checkPermission(role, 'task-edit'),

  createTimelog: (role?: UserRole | null) => checkPermission(role, 'time-create'),
  deleteTimelog: (role?: UserRole | null) => checkPermission(role, 'time-delete'),

  createTimesheet: (role?: UserRole | null) => checkPermission(role, 'time-create'),
  deleteTimesheet: (role?: UserRole | null) => checkPermission(role, 'time-delete'),

  createUser: (role?: UserRole | null) => checkPermission(role, 'user-create'),
  deleteUser: (role?: UserRole | null) => checkPermission(role, 'user-delete'),
  manageUsers: (role?: UserRole | null) => checkPermission(role, 'user-edit'),

  viewDashboard: (_role?: UserRole | null) => true,
  viewProjects: (role?: UserRole | null) => checkPermission(role, 'proj-view'),
  viewTasks: (role?: UserRole | null) => checkPermission(role, 'task-view'),
  viewIssues: (role?: UserRole | null) => checkPermission(role, 'issue-view'),
  viewTimeLogs: (role?: UserRole | null) => checkPermission(role, 'time-view'),
  viewTimesheets: (role?: UserRole | null) => checkPermission(role, 'time-view'),
  viewNotifications: (_role?: UserRole | null) => true,
  viewSettings: (role?: UserRole | null) => checkPermission(role, 'settings-view'),
  viewProfile: (_role?: UserRole | null) => true,

  viewReports: (role?: UserRole | null) => checkPermission(role, 'report-view'),
  viewMilestones: (role?: UserRole | null) => checkPermission(role, 'milestone-view'),

  viewUsers: (role?: UserRole | null) => checkPermission(role, 'user-view'),
  viewTeams: (role?: UserRole | null) => checkPermission(role, 'team-view'),
  viewRoles: (role?: UserRole | null) => checkPermission(role, 'role-manage'),

  syncUsersFromAzure: (role?: UserRole | null) => checkPermission(role, 'automation-manage'),
};

export const settingsTabs = {
  profile: (_role?: UserRole | null) => true,
  notifications: (_role?: UserRole | null) => true,
  organization: (role?: UserRole | null) => checkPermission(role, 'settings-edit'),
  users: (role?: UserRole | null) => checkPermission(role, 'user-view'),
  security: (role?: UserRole | null) => checkPermission(role, 'settings-edit'),
  integrations: (role?: UserRole | null) => checkPermission(role, 'settings-edit'),
};
