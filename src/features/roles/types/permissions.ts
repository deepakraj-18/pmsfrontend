export interface Permission {
  id: string;
  category: string;
  name: string;
  description: string;
}

export const availablePermissions: Permission[] = [
  { id: 'proj-view', category: 'Projects', name: 'View Projects', description: 'View all project details and overview' },
  { id: 'proj-create', category: 'Projects', name: 'Create Projects', description: 'Create and set up new projects' },
  { id: 'proj-edit', category: 'Projects', name: 'Edit Projects', description: 'Modify project details and configuration' },
  { id: 'proj-delete', category: 'Projects', name: 'Delete Projects', description: 'Permanently delete projects' },
  { id: 'task-view', category: 'Tasks', name: 'View Tasks', description: 'View all tasks and their details' },
  { id: 'task-create', category: 'Tasks', name: 'Create Tasks', description: 'Create and assign new tasks' },
  { id: 'task-edit', category: 'Tasks', name: 'Edit Tasks', description: 'Modify task details and status' },
  { id: 'task-delete', category: 'Tasks', name: 'Delete Tasks', description: 'Remove tasks from the system' },
  { id: 'task-assign', category: 'Tasks', name: 'Assign Tasks', description: 'Assign tasks to team members' },
  { id: 'issue-view', category: 'Issues', name: 'View Issues', description: 'View all reported issues' },
  { id: 'issue-create', category: 'Issues', name: 'Report Issues', description: 'Report new issues and bugs' },
  { id: 'issue-edit', category: 'Issues', name: 'Edit Issues', description: 'Update issue details and priority' },
  { id: 'issue-delete', category: 'Issues', name: 'Delete Issues', description: 'Remove issues from the system' },
  { id: 'milestone-view', category: 'Milestones', name: 'View Milestones', description: 'View all project milestones' },
  { id: 'milestone-create', category: 'Milestones', name: 'Create Milestones', description: 'Create new milestones' },
  { id: 'milestone-edit', category: 'Milestones', name: 'Edit Milestones', description: 'Modify milestone details' },
  { id: 'milestone-delete', category: 'Milestones', name: 'Delete Milestones', description: 'Remove milestones' },
  { id: 'time-view', category: 'Time Tracking', name: 'View Time Logs', description: 'View time entries and reports' },
  { id: 'time-create', category: 'Time Tracking', name: 'Log Time', description: 'Create time log entries' },
  { id: 'time-edit', category: 'Time Tracking', name: 'Edit Time Logs', description: 'Modify time log entries' },
  { id: 'time-delete', category: 'Time Tracking', name: 'Delete Time Logs', description: 'Remove time log entries' },
  { id: 'timesheet-approve', category: 'Time Tracking', name: 'Approve Timesheets', description: 'Approve or reject timesheets' },
  { id: 'user-view', category: 'Users', name: 'View Users', description: 'View user profiles and information' },
  { id: 'user-create', category: 'Users', name: 'Create Users', description: 'Add new users to the system' },
  { id: 'user-edit', category: 'Users', name: 'Edit Users', description: 'Modify user details and roles' },
  { id: 'user-delete', category: 'Users', name: 'Delete Users', description: 'Remove users from the system' },
  { id: 'team-view', category: 'Teams', name: 'View Teams', description: 'View team composition and info' },
  { id: 'team-create', category: 'Teams', name: 'Create Teams', description: 'Create new teams' },
  { id: 'team-edit', category: 'Teams', name: 'Edit Teams', description: 'Modify team details and members' },
  { id: 'team-delete', category: 'Teams', name: 'Delete Teams', description: 'Remove teams from the system' },
  { id: 'report-view', category: 'Reports', name: 'View Reports', description: 'Access dashboards and reports' },
  { id: 'report-export', category: 'Reports', name: 'Export Reports', description: 'Download and export report data' },
  { id: 'settings-view', category: 'Administration', name: 'View Settings', description: 'View system configuration' },
  { id: 'settings-edit', category: 'Administration', name: 'Edit Settings', description: 'Modify system settings' },
  { id: 'role-manage', category: 'Administration', name: 'Manage Roles', description: 'Create, edit and delete roles' },
  { id: 'automation-manage', category: 'Administration', name: 'Manage Automation', description: 'Create and manage automation rules' },
];
