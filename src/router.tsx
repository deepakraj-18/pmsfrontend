import React, { Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Dashboard } from '@/features/dashboard/components/Dashboard';
import { AppOverlayLoader } from '@/components/feedback/Loader/AppOverlayLoader';
import { ProtectedRoute } from '@/components/core/ProtectedRoute';
import { UnauthorizedPage } from '@/components/core/UnauthorizedPage';
import { ROLES } from '@/utils/permissions';

const PM_ONLY = [ROLES.ADMIN];
const TL_PLUS = [ROLES.ADMIN, ROLES.TEAM_LEAD];
const ALL = [ROLES.ADMIN, ROLES.TEAM_LEAD, ROLES.EMPLOYEE];

// Minimum time the page-switch loader stays up once shown, regardless of how fast the
// transition itself resolves - a floor, not a cap. Lives on the loader's visibility in
// AppRouter (not wrapped around each import) so it applies on every navigation, not just
// the first-ever visit to a route - React.lazy caches its import after one resolution, so
// a per-import delay only ever fires once per route per session.
const MIN_LOADER_MS = 1000;

const ProjectsListView = React.lazy(() => import('@/features/projects/components/views/ProjectsListView').then(v => ({ default: v.ProjectsListView })));
const ProjectCreateView = React.lazy(() => import('@/features/projects/components/views/ProjectCreateView').then(v => ({ default: v.ProjectCreateView })));
const ProjectDetailView = React.lazy(() => import('@/features/projects/components/views/ProjectDetailView').then(v => ({ default: v.ProjectDetailView })));
const ProjectEditView = React.lazy(() => import('@/features/projects/components/views/ProjectEditView').then(v => ({ default: v.ProjectEditView })));
const TemplatesListView = React.lazy(() => import('@/features/projects/components/views/TemplatesListView').then(v => ({ default: v.TemplatesListView })));
const TemplateCreateView = React.lazy(() => import('@/features/projects/components/views/TemplateCreateView').then(v => ({ default: v.TemplateCreateView })));
const TemplateEditView = React.lazy(() => import('@/features/projects/components/views/TemplateEditView').then(v => ({ default: v.TemplateEditView })));

const TasksListView = React.lazy(() => import('@/features/tasks/components/views/TasksListView').then(v => ({ default: v.TasksListView })));
const TaskCreateView = React.lazy(() => import('@/features/tasks/components/views/TaskCreateView').then(v => ({ default: v.TaskCreateView })));
const TaskDetailView = React.lazy(() => import('@/features/tasks/components/views/TaskDetailView').then(v => ({ default: v.TaskDetailView })));
const TaskEditView = React.lazy(() => import('@/features/tasks/components/views/TaskEditView').then(v => ({ default: v.TaskEditView })));
const TaskImportPage = React.lazy(() => import('@/features/tasks/components/views/TaskImportView').then(v => ({ default: v.TaskImportPage })));
const TaskListCreateView = React.lazy(() => import('@/features/tasklists/components/TaskListCreateView').then(v => ({ default: v.TaskListCreateView })));


const IssuesList = React.lazy(() => import('@/features/issues/components/views/IssuesListView').then(v => ({ default: v.IssuesListView })));
const IssueCreate = React.lazy(() => import('@/features/issues/components/views/IssueCreateView').then(v => ({ default: v.IssueCreateView })));
const IssueDetail = React.lazy(() => import('@/features/issues/components/views/IssueDetailView').then(v => ({ default: v.IssueDetailView })));
const IssueEdit = React.lazy(() => import('@/features/issues/components/views/IssueEditView').then(v => ({ default: v.IssueEditView })));
const IssueImportPage = React.lazy(() => import('@/features/issues/components/IssueImport').then(v => ({ default: v.IssueImportPage })));

const TimeLog = React.lazy(() => import('@/features/timelogs/components/views/TimeLogListView').then(v => ({ default: v.TimeLogListView })));
const WeeklyTimeLogAdd = React.lazy(() => import('@/features/timelogs/components/views/WeeklyTimeLogAddView').then(v => ({ default: v.WeeklyTimeLogAddView })));
const TimeLogAdd = React.lazy(() => import('@/features/timelogs/components/views/TimeLogAddView').then(v => ({ default: v.TimeLogAddView })));

const UsersList = React.lazy(() => import('@/features/users/components/UsersList').then(v => ({ default: v.UsersList })));
const PendingUsers = React.lazy(() => import('@/features/users/components/PendingUsers').then(v => ({ default: v.PendingUsers })));
const UserCreate = React.lazy(() => import('@/features/users/components/UserCreate').then(v => ({ default: v.UserCreate })));
const UserDetail = React.lazy(() => import('@/features/users/components/UserDetail').then(v => ({ default: v.UserDetail })));
const UserEdit = React.lazy(() => import('@/features/users/components/UserEdit').then(v => ({ default: v.UserEdit })));
const Teams = React.lazy(() => import('@/features/teams/components/Teams').then(v => ({ default: v.Teams })));
const TeamCreate = React.lazy(() => import('@/features/teams/components/TeamCreate').then(v => ({ default: v.TeamCreate })));
const TeamDetail = React.lazy(() => import('@/features/teams/components/TeamDetail').then(v => ({ default: v.TeamDetail })));
const TeamEdit = React.lazy(() => import('@/features/teams/components/TeamEdit').then(v => ({ default: v.TeamEdit })));
const Roles = React.lazy(() => import('@/features/roles/components/Roles').then(v => ({ default: v.Roles })));
const RoleCreate = React.lazy(() => import('@/features/roles/components/views/RoleCreateView').then(v => ({ default: v.RoleCreateView })));
const RoleDetail = React.lazy(() => import('@/features/roles/components/views/RoleDetailView').then(v => ({ default: v.RoleDetailView })));
const RoleEdit = React.lazy(() => import('@/features/roles/components/views/RoleEditView').then(v => ({ default: v.RoleEditView })));
const PermissionsMatrix = React.lazy(() => import('@/features/roles/components/views/PermissionsMatrixView').then(v => ({ default: v.PermissionsMatrixView })));

const Reports = React.lazy(() => import('@/features/reports/components/Reports').then(v => ({ default: v.Reports })));
const MilestonesList = React.lazy(() => import('@/features/milestones/components/MilestonesList').then(v => ({ default: v.MilestonesList })));
const MilestoneCreate = React.lazy(() => import('@/features/milestones/components/MilestoneCreate').then(v => ({ default: v.MilestoneCreate })));
const MilestoneDetailView = React.lazy(() => import('@/features/milestones/components/views/MilestoneDetailView').then(v => ({ default: v.MilestoneDetailView })));
const MilestoneEditView = React.lazy(() => import('@/features/milestones/components/views/MilestoneEditView').then(v => ({ default: v.MilestoneEditView })));
const Notifications = React.lazy(() => import('@/features/notifications/components/Notifications').then(v => ({ default: v.Notifications })));
const NotificationSettings = React.lazy(() => import('@/features/notifications/components/NotificationSettings').then(v => ({ default: v.NotificationSettings })));
const Settings = React.lazy(() => import('@/features/settings/components/Settings').then(v => ({ default: v.Settings })));
const ChatInbox = React.lazy(() => import('@/features/chat/components/ChatInbox').then(v => ({ default: v.ChatInbox })));
const Profile = React.lazy(() => import('@/features/users/components/Profile').then(v => ({ default: v.Profile })));

export function AppRouter() {
    const location = useLocation();
    // Keep rendering the previous route (fully, not just its last frame) while the next
    // one's lazy chunk is still loading, instead of Suspense discarding it for the fallback.
    // isPending drives our own overlay on top of that still-visible old page; the Suspense
    // fallback below is now only a safety net for a Suspense boundary with no prior content
    // to defer to at all (effectively never hit once a first route has rendered).
    const deferredLocation = React.useDeferredValue(location);
    const isPending = location.key !== deferredLocation.key;

    // Every navigation shows the loader for at least MIN_LOADER_MS, even an already-cached
    // route where isPending flips back to false almost instantly - see the note on
    // MIN_LOADER_MS above for why this can't just live on the lazy import itself.
    const [showLoader, setShowLoader] = React.useState(false);
    const hideTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    React.useEffect(() => {
        if (isPending) {
            clearTimeout(hideTimer.current);
            setShowLoader(true);
        } else {
            hideTimer.current = setTimeout(() => setShowLoader(false), MIN_LOADER_MS);
        }
        return () => clearTimeout(hideTimer.current);
    }, [isPending]);

    return (
        <>
        { }
        <AnimatePresence>
            {showLoader && <AppOverlayLoader key="page-loader" />}
        </AnimatePresence>
        <AnimatePresence mode="wait">
            <motion.div
                key={deferredLocation.pathname}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="h-full w-full"
            >
                <Suspense fallback={<AppOverlayLoader />}>
                    <Routes location={deferredLocation}>
                        { }
                        <Route path="/unauthorized" element={<UnauthorizedPage />} />

                        <Route path="/" element={<Dashboard />} />

                        <Route path="/projects" element={
                            <ProtectedRoute requiredPermission="proj-view"><ProjectsListView /></ProtectedRoute>
                        } />
                        <Route path="/projects/create" element={
                            <ProtectedRoute requiredPermission="proj-create"><ProjectCreateView /></ProtectedRoute>
                        } />
                        <Route path="/projects/:projectId" element={
                            <ProtectedRoute requiredPermission="proj-view"><ProjectDetailView /></ProtectedRoute>
                        } />
                        <Route path="/projects/:projectId/edit" element={
                            <ProtectedRoute requiredPermission="proj-edit"><ProjectEditView /></ProtectedRoute>
                        } />
                        <Route path="/projects/:projectId/overview" element={<ProtectedRoute requiredPermission="proj-view"><ProjectDetailView /></ProtectedRoute>} />
                        <Route path="/projects/:projectId/tasks" element={<ProtectedRoute requiredPermission="proj-view"><ProjectDetailView /></ProtectedRoute>} />
                        <Route path="/projects/:projectId/issues" element={<ProtectedRoute requiredPermission="proj-view"><ProjectDetailView /></ProtectedRoute>} />
                        <Route path="/projects/:projectId/milestones" element={<ProtectedRoute requiredPermission="proj-view"><ProjectDetailView /></ProtectedRoute>} />
                        <Route path="/projects/:projectId/documents" element={<ProtectedRoute requiredPermission="proj-view"><ProjectDetailView /></ProtectedRoute>} />
                        <Route path="/projects/:projectId/reports" element={<ProtectedRoute requiredPermission="proj-view"><ProjectDetailView /></ProtectedRoute>} />

                        <Route path="/templates" element={
                            <ProtectedRoute requiredPermission="proj-create"><TemplatesListView /></ProtectedRoute>
                        } />
                        <Route path="/templates/create" element={
                            <ProtectedRoute requiredPermission="proj-create"><TemplateCreateView /></ProtectedRoute>
                        } />
                        <Route path="/templates/:templateId" element={
                            <ProtectedRoute requiredPermission="proj-create"><TemplateEditView /></ProtectedRoute>
                        } />

                        <Route path="/tasks" element={
                            <ProtectedRoute requiredPermission="task-view"><TasksListView /></ProtectedRoute>
                        } />
                        <Route path="/tasks/create" element={
                            <ProtectedRoute requiredPermission="task-create"><TaskCreateView /></ProtectedRoute>
                        } />
                        <Route path="/tasks/import" element={
                            <ProtectedRoute requiredPermission="task-create"><TaskImportPage /></ProtectedRoute>
                        } />
                        <Route path="/tasks/:taskId" element={
                            <ProtectedRoute requiredPermission="task-view"><TaskDetailView /></ProtectedRoute>
                        } />
                        <Route path="/tasks/:taskId/edit" element={
                            <ProtectedRoute requiredPermission="task-edit"><TaskEditView /></ProtectedRoute>
                        } />

                        <Route path="/tasklists/create" element={
                            <ProtectedRoute requiredPermission="task-edit"><TaskListCreateView /></ProtectedRoute>
                        } />

                        <Route path="/issues" element={
                            <ProtectedRoute requiredPermission="issue-view"><IssuesList /></ProtectedRoute>
                        } />
                        <Route path="/issues/create" element={
                            <ProtectedRoute requiredPermission="issue-create"><IssueCreate /></ProtectedRoute>
                        } />
                        <Route path="/issues/import" element={
                            <ProtectedRoute requiredPermission="issue-create"><IssueImportPage /></ProtectedRoute>
                        } />
                        <Route path="/issues/:issueId" element={
                            <ProtectedRoute requiredPermission="issue-view"><IssueDetail /></ProtectedRoute>
                        } />
                        <Route path="/issues/:issueId/edit" element={
                            <ProtectedRoute requiredPermission="issue-edit"><IssueEdit /></ProtectedRoute>
                        } />

                        {/* Time Logs */}
                        <Route path="/time-log" element={
                            <ProtectedRoute requiredPermission="time-view"><TimeLog /></ProtectedRoute>
                        } />
                        <Route path="/time-log/add" element={
                            <ProtectedRoute requiredPermission="time-create"><TimeLogAdd /></ProtectedRoute>
                        } />
                        <Route path="/time-log/edit/:logId" element={
                            <ProtectedRoute requiredPermission="time-edit"><TimeLogAdd /></ProtectedRoute>
                        } />
                        <Route path="/time-log/weekly-add" element={
                            <ProtectedRoute requiredPermission="time-create"><WeeklyTimeLogAdd /></ProtectedRoute>
                        } />

                        {/* Chat */}
                        <Route path="/chat" element={<ChatInbox />} />

                        {/* Reports */}
                        <Route path="/reports" element={
                            <ProtectedRoute requiredPermission="report-view"><Reports /></ProtectedRoute>
                        } />

                        {/* Users */}
                        <Route path="/users" element={
                            <ProtectedRoute requiredPermission="user-view"><UsersList /></ProtectedRoute>
                        } />
                        <Route path="/users/pending" element={
                            <ProtectedRoute requiredPermission="user-edit"><PendingUsers /></ProtectedRoute>
                        } />
                        <Route path="/users/create" element={
                            <ProtectedRoute requiredPermission="user-create"><UserCreate /></ProtectedRoute>
                        } />
                        <Route path="/users/:userId" element={
                            <ProtectedRoute requiredPermission="user-view"><UserDetail /></ProtectedRoute>
                        } />
                        <Route path="/users/:userId/edit" element={
                            <ProtectedRoute requiredPermission="user-edit"><UserEdit /></ProtectedRoute>
                        } />

                        {/* Teams */}
                        <Route path="/teams" element={
                            <ProtectedRoute requiredPermission="team-view"><Teams /></ProtectedRoute>
                        } />
                        <Route path="/teams/create" element={
                            <ProtectedRoute requiredPermission="team-create"><TeamCreate /></ProtectedRoute>
                        } />
                        <Route path="/teams/:teamId" element={
                            <ProtectedRoute requiredPermission="team-view"><TeamDetail /></ProtectedRoute>
                        } />
                        <Route path="/teams/:teamId/edit" element={
                            <ProtectedRoute requiredPermission="team-edit"><TeamEdit /></ProtectedRoute>
                        } />

                        {/* Roles */}
                        <Route path="/roles" element={
                            <ProtectedRoute requiredPermission="role-manage"><Roles /></ProtectedRoute>
                        } />
                        <Route path="/roles/create" element={
                            <ProtectedRoute requiredPermission="role-manage"><RoleCreate /></ProtectedRoute>
                        } />
                        <Route path="/roles/:roleId" element={
                            <ProtectedRoute requiredPermission="role-manage"><RoleDetail /></ProtectedRoute>
                        } />
                        <Route path="/roles/:roleId/edit" element={
                            <ProtectedRoute requiredPermission="role-manage"><RoleEdit /></ProtectedRoute>
                        } />
                        <Route path="/roles/permissions-matrix" element={
                            <ProtectedRoute requiredPermission="role-manage"><PermissionsMatrix /></ProtectedRoute>
                        } />

                        {/* Milestones */}
                        <Route path="/milestones" element={
                            <ProtectedRoute requiredPermission="milestone-view"><MilestonesList /></ProtectedRoute>
                        } />
                        <Route path="/milestones/create" element={
                            <ProtectedRoute requiredPermission="milestone-create"><MilestoneCreate /></ProtectedRoute>
                        } />
                        <Route path="/milestones/:milestoneId" element={
                            <ProtectedRoute requiredPermission="milestone-view"><MilestoneDetailView /></ProtectedRoute>
                        } />
                        <Route path="/milestones/:milestoneId/edit" element={
                            <ProtectedRoute requiredPermission="milestone-edit"><MilestoneEditView /></ProtectedRoute>
                        } />

                        {/* Profile & Settings */}
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/notification-settings" element={<NotificationSettings />} />
                        <Route path="/settings" element={
                            <ProtectedRoute requiredPermission="settings-view"><Settings /></ProtectedRoute>
                        } />
                        <Route path="/profile" element={<Profile />} />
                    </Routes>
                </Suspense>
            </motion.div>
        </AnimatePresence>
        </>
    );
}
