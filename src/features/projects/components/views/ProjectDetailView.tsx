import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { EntityDetailTemplate } from '@/components/layout/EntityDetailTemplate';
import { SectionLoadingIndicator } from '@/components/feedback/Loader/SectionLoadingIndicator';
import { Message } from 'primereact/message';
import { Avatar } from 'primereact/avatar';
import { Tag } from 'primereact/tag';
import { Tooltip } from 'primereact/tooltip';
import { Button } from '@/components/forms/Button';
import { SegmentedControl } from '@/components/forms/SegmentedControl';
import { Sidebar } from 'primereact/sidebar';
import { DetailFieldRow } from '@/components/data-display/DetailFieldRow';
import { PMSDataTable } from '@/components/data-display/PMSDataTable';
import { ProjectReportTab } from '@/features/projects/components/ui/ProjectReportTab';
import { ProjectDashboardTab } from '@/features/projects/components/ui/ProjectDashboardTab';
import { ProjectDocumentsTab } from '@/features/projects/components/ui/ProjectDocumentsTab';
import { TaskListTable } from '@/features/tasks/components/ui/TaskListTable';
import { UserMultiSelect } from '@/components/core/UserMultiSelect';
import { useToast } from '@/providers/ToastContext';
import { useProjectDetail } from '@/features/projects/hooks/useProjectDetail';
import { statusStr } from '@/utils/statusHelpers';
import { calculateDaysLeft } from '@/utils/dateHelpers';
import { useProjectActions } from '@/features/projects/hooks/useProjectActions';
import { tasklistsService, TaskList } from '@/api/services/tasklists.service';
import {
    Edit, Archive, Plus, RefreshCw,
    Calendar, Building2, Hash, Timer, Tag as TagIcon,
    Briefcase, UserCircle, Target, Clock, AlertCircle, CheckSquare, Layers, Info, Users
} from 'lucide-react';

import { ProgressBar } from 'primereact/progressbar';
import { useAuth } from '@/auth/AuthProvider';
import { can } from '@/utils/permissions';

const TEAL = 'hsl(160 60% 45%)';
const TEAL_DIM = 'hsl(160 60% 45% / 0.12)';

const MasterBadge = ({ master }: { master?: { label: string; color?: string } | null }) => {
    if (!master) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
    return (
        <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
            style={{
                background: master.color ? `${master.color}22` : TEAL_DIM,
                color: master.color ?? TEAL,
                border: `1px solid ${master.color ?? TEAL}44`,
            }}
        >
            {master.label}
        </span>
    );
};


const taskColumns = [
    { field: 'public_id' as const, header: 'ID', sortable: true, width: '90px' },
    {
        field: 'task_name' as const, header: 'Task Name', sortable: true, body: (r: any) => (
            <span className="text-[13px] font-semibold block truncate max-w-[200px] sm:max-w-[300px] p-task-tooltip" style={{ color: 'var(--text-primary)' }} data-pr-tooltip={r.task_name} data-pr-position="top">
                {truncateWords(r.task_name, 3)}
            </span>
        )
    },
    { field: 'owners' as const, header: 'Task Owner', body: (r: any) => r.owners?.length > 0 ? [r.owners[0].first_name, r.owners[0].last_name].filter(Boolean).join(' ') : '—' },
    { field: 'status_master' as const, header: 'Status', sortable: true, body: (r: any) => <MasterBadge master={r.status_master} /> },
    { field: 'priority_master' as const, header: 'Priority', sortable: true, body: (r: any) => <MasterBadge master={r.priority_master} /> },

    { field: 'start_date' as const, header: 'Start Date', sortable: true },
    { field: 'due_date' as const, header: 'Due Date', sortable: true },
    { field: 'work_hours' as const, header: 'Est (P)', body: (r: any) => `${Number(r.work_hours ?? 0).toFixed(1)}h` },
    {
        field: 'timelog_total' as const, header: 'Log (T)', body: (r: any) =>
            <span style={{ color: TEAL, fontWeight: 600 }}>{Number(r.cached_timelog_total ?? 0).toFixed(1)}h</span>
    },
    {
        field: 'difference' as const, header: 'Diff', body: (r: any) => {
            const diff = Number(r.work_hours ?? 0) - Number(r.cached_timelog_total ?? 0);
            return <span style={{ color: diff < 0 ? '#ef4444' : '#64748b' }} className="font-mono text-xs">{diff.toFixed(1)}h</span>
        }
    },
    { field: 'billing_type' as const, header: 'Billing' },
];

const truncateWords = (text: string, count: number) => {
    if (!text) return '';
    const words = text.split(/\s+/);
    if (words.length <= count) return text;
    return words.slice(0, count).join(' ') + ' ......';
};

const issueColumns = [
    { field: 'public_id' as const, header: 'ID', sortable: true, width: '90px' },
    {
        field: 'bug_name' as const, header: 'Bug Name', sortable: true, body: (r: any) => (
            <span className="text-[13px] font-semibold block truncate max-w-[200px] sm:max-w-[300px] p-bug-tooltip" style={{ color: 'var(--text-primary)' }} data-pr-tooltip={r.bug_name} data-pr-position="top">
                {truncateWords(r.bug_name, 2)}
            </span>
        )
    },
    { field: 'status_master' as const, header: 'Status', body: (r: any) => <MasterBadge master={r.status_master} /> },
    { field: 'severity_master' as const, header: 'Severity', body: (r: any) => <MasterBadge master={r.severity_master} /> },
    { field: 'assignees' as const, header: 'Assignee', body: (r: any) => r.assignees?.length > 0 ? [r.assignees[0].first_name, r.assignees[0].last_name].filter(Boolean).join(' ') : '—' },
    { field: 'reporter' as const, header: 'Reporter', body: (r: any) => r.reporter ? [r.reporter.first_name, r.reporter.last_name].filter(Boolean).join(' ') : '—' },
    { field: 'due_date' as const, header: 'Target Date', sortable: true },
    { field: 'classification_master' as const, header: 'Classification', body: (r: any) => <MasterBadge master={r.classification_master} /> },
];

const milestoneColumns = [
    {
        field: 'milestone_name' as const, header: 'Milestone Name', sortable: true, body: (r: any) => (
            <span className="text-[13px] font-semibold block truncate max-w-[200px] sm:max-w-[300px]" style={{ color: 'var(--text-primary)' }} title={r.milestone_name}>
                {truncateWords(r.milestone_name, 3)}
            </span>
        )
    },
    { field: 'status_master' as const, header: 'Status', body: (r: any) => <MasterBadge master={r.status_master} /> },
    { field: 'completion_percentage' as const, header: '%', body: (r: any) => `${r.completion_percentage ?? 0}%` },
    { field: 'owner' as const, header: 'Milestone Owner', body: (r: any) => r.owner ? [r.owner.first_name, r.owner.last_name].filter(Boolean).join(' ') : '—' },
    { field: 'start_date' as const, header: 'Start Date', sortable: true },
    { field: 'end_date' as const, header: 'End Date', sortable: true },
    { field: 'task_count' as const, header: 'Tasks' },
    { field: 'issue_count' as const, header: 'Bugs' }
];

const timelogColumns = [
    { field: 'date', header: 'Date', body: (r: any) => new Date(r.date).toLocaleDateString('en-GB') },
    { field: 'user', header: 'User', body: (r: any) => [r.user?.first_name, r.user?.last_name].filter(Boolean).join(' ') },
    { field: 'hours', header: 'Hours', body: (r: any) => <span className="font-bold" style={{ color: TEAL }}>{Number(r.daily_log_hours ?? r.hours ?? 0).toFixed(1)}h</span> },
    {
        field: 'log_title', header: 'Title', body: (r: any) => (
            <span className="text-[13px] font-semibold block truncate max-w-[150px]" style={{ color: 'var(--text-primary)' }} title={r.log_title}>
                {truncateWords(r.log_title, 3)}
            </span>
        )
    },
    { field: 'billing_type', header: 'Billing' },
    {
        field: 'notes', header: 'Notes', width: '200px', body: (r: any) => (
            <span className="italic text-xs text-muted block truncate max-w-[200px]" title={r.description || r.notes}>
                {truncateWords(r.description || r.notes, 4)}
            </span>
        )
    }
];

export function ProjectDetailView() {
    const { projectId } = useParams<{ projectId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { showToast } = useToast();
    const pid = Number(projectId);
    const activeTab = searchParams.get('tab') || 'Dashboard';
    const [showDetailsSidebar, setShowDetailsSidebar] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
    const [groupBy, setGroupBy] = useState<'none' | 'tasklist' | 'project'>('tasklist');
    const [lazyParams, setLazyParams] = useState({ first: 0, rows: 20, page: 0 });

    const { project, tasks, taskTotal, taskLists, issues, timelogs, milestones, isLoading, refetchAll } =
        useProjectDetail(pid);

    const calculatedMilestones = useMemo(() => {
        return milestones.map(ms => {
            const msTasks = tasks.filter((t: any) => t.milestone_id === ms.id || t.milestone?.id === ms.id);
            const completedTasks = msTasks.filter(t => {
                const s = statusStr((t as any).status_master ?? t.status);
                return s === 'completed' || s === 'closed' || s === 'done';
            }).length;
            const totalTasks = msTasks.length;
            const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            return { ...ms, completion_percentage: pct };
        });
    }, [milestones, tasks]);

    const dashboardStats = useMemo(() => {
        const completedTasks = tasks.filter(t => {
            const s = statusStr((t as any).status_master ?? t.status);
            return s === 'completed' || s === 'closed' || s === 'done';
        }).length;
        const totalTasks = tasks.length;
        const closedIssues = issues.filter(i => statusStr((i as any).status_master ?? i.status) === 'closed').length;
        const totalIssues = issues.length;
        const totalLogged = timelogs.reduce((s, l) => s + Number(l.daily_log_hours || 0), 0);
        const daysLeft = calculateDaysLeft(project?.expected_end_date);

        return {
            tasksDone: `${completedTasks} / ${totalTasks}`,
            issuesOpen: `${totalIssues - closedIssues} / ${totalIssues}`,
            hoursLogged: `${totalLogged.toFixed(1)}h`,
            daysLeft: daysLeft !== null ? (daysLeft > 0 ? `${daysLeft} days` : 'Overdue') : '—'
        };
    }, [tasks, issues, timelogs, project?.expected_end_date]);

    const { updateProject, assignUser, removeUser } = useProjectActions();

    const handleArchive = async () => {
        await updateProject.mutateAsync({ id: pid, data: { is_archived: !project?.is_archived } });
    };



    if (isLoading) return <SectionLoadingIndicator fullPage />;
    if (!project) return <div className="p-8 text-center text-muted">Project not found.</div>;

    const tabs = [
        { label: 'Dashboard' },
        { label: 'Defects' },
        { label: 'Tasks' },
        { label: 'Reports' },
        { label: 'Documents' },
        { label: 'Milestones' },
        { label: 'Timesheet' },
        { label: 'Users' }
    ];

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <EntityDetailTemplate
                title={project.project_name}
                subtitle={`${project.account_name} › ${project.customer_name}`}
                icon={<Briefcase size={20} />}
                badges={[
                    <MasterBadge key="status" master={project.status_master || (typeof project.status === 'object' ? project.status : { label: project.status || 'Active' }) as any} />,
                    <MasterBadge key="priority" master={project.priority_master || (typeof project.priority === 'object' ? project.priority : { label: project.priority || 'Medium' }) as any} />
                ]}
                metadata={[
                    <span key="manager" className="flex items-center gap-1"><UserCircle size={12} /> {project.project_manager ? [project.project_manager.first_name, project.project_manager.last_name].filter(Boolean).join(' ') : 'No Manager'}</span>,
                    <span key="date" className="flex items-center gap-1"><Calendar size={12} /> Ends: {project.expected_end_date || '—'}</span>
                ]}
                headerActions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="xs"
                            icon={<Info size={14} />}
                            onClick={() => setShowDetailsSidebar(true)}
                            className="!p-1 text-slate-800/70 hover:text-slate-900 hover:bg-white/30"
                            tooltip="View Project Details"
                        />
                        {can.editProject(user?.role) && (
                            <Button variant="secondary" onClick={() => navigate(`/projects/${pid}/edit`)}><Edit size={15} /> Edit</Button>
                        )}
                    </div>
                }
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={(tab) => navigate(`/projects/${pid}?tab=${tab}`)}
                hideHeader={false}
                color="cyan"
                backPath="/projects"
            >
                <Tooltip target=".p-task-tooltip" mouseTrack mouseTrackLeft={10} />
                <Tooltip target=".p-bug-tooltip" mouseTrack mouseTrackLeft={10} />
                <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
                    { }
                    <div className="flex-1 min-w-0 space-y-6">
                        {!project.ms_teams_group_id && (
                            <Message
                                severity="info"
                                text="MS Teams workspace provisioning in progress."
                                className="w-full justify-start text-[13px] rounded-xl"
                            />
                        )}

                        {activeTab === 'Dashboard' && (
                            <ProjectDashboardTab project={project} tasks={tasks} issues={issues} timelogs={timelogs} milestones={milestones} />
                        )}

                        {activeTab === 'Defects' && (
                            <div className="overflow-hidden min-h-[400px]">
                                <div className="py-4 flex justify-between items-center">
                                    <h3 className="text-sm font-bold">Reported Defects ({issues.length})</h3>
                                    {can.createIssue(user?.role) && (
                                        <Button variant="gradient" size="sm" icon={<Plus size={13} />} onClick={() => navigate(`/issues/create?project_id=${pid}`)}>New Defect</Button>
                                    )}
                                </div>
                                <PMSDataTable
                                    columns={issueColumns}
                                    data={issues}
                                    dataKey="id"
                                    onRowClick={(r) => navigate(`/issues/${r.id}`, { state: { from: `/projects/${pid}?tab=Defects` } })}
                                />
                            </div>
                        )}

                        {activeTab === 'Tasks' && (
                            <div className="overflow-hidden min-h-[400px]">
                                <div className="py-4 flex justify-between items-center">
                                    <h3 className="text-sm font-bold">Project Tasks ({tasks.length})</h3>
                                    <div className="flex gap-2">
                                        {can.manageTaskLists(user?.role) && (
                                            <Button variant="secondary" size="sm" icon={<Layers size={13} />} onClick={() => navigate(`/tasklists/create?project_id=${pid}`)}>Add Task List</Button>
                                        )}
                                        {can.createTask(user?.role) && (
                                            <Button variant="gradient" size="sm" icon={<Plus size={13} />} onClick={() => navigate(`/tasks/create?project_id=${pid}`)}>Add Task</Button>
                                        )}
                                    </div>
                                </div>
                        <div className="flex-1 overflow-hidden">
                            <TaskListTable
                                tasks={tasks}
                                taskLists={taskLists}
                                timelogs={timelogs}
                                groupBy={groupBy}
                                onTaskListRenamed={() => refetchAll()}
                                totalRecords={taskTotal}
                                paginator={true}
                                lazy={groupBy === 'none'}
                                loading={isLoading}
                                first={lazyParams.first}
                                rows={lazyParams.rows}
                                onPage={(e) => setLazyParams(e)}
                                canRename={can.manageTaskLists(user?.role)}
                                onRowClick={(r: any) => navigate(`/tasks/${r.id}`, { state: { from: `/projects/${pid}?tab=Tasks` } })}
                            />
                        </div>
                    </div>
                )}

                        {activeTab === 'Reports' && (
                            <ProjectReportTab projectId={pid} project={project} tasks={tasks} timelogs={timelogs} issues={issues} />
                        )}

                        {activeTab === 'Documents' && (
                            <ProjectDocumentsTab projectId={pid} />
                        )}

                        {activeTab === 'Milestones' && (
                            <div className="overflow-hidden min-h-[400px]">
                                <PMSDataTable
                                    columns={milestoneColumns}
                                    data={calculatedMilestones}
                                    dataKey="id"
                                    onRowClick={(r: any) => navigate(`/milestones/${r.id}`)}
                                />
                            </div>
                        )}

                        {activeTab === 'Timesheet' && (
                            <div className="overflow-hidden min-h-[400px]">
                                <PMSDataTable
                                    columns={timelogColumns}
                                    data={timelogs}
                                    dataKey="id"
                                />
                            </div>
                        )}

                        {activeTab === 'Users' && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm min-h-[400px]">
                                <div className="mb-8">
                                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                                        <Users size={16} /> Manage Project Team
                                    </h3>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <UserMultiSelect
                                                value={selectedUsers}
                                                onChange={setSelectedUsers}
                                                placeholder="Select users to add..."
                                            />
                                        </div>
                                        <Button
                                            variant="primary"
                                            onClick={() => {
                                                selectedUsers.forEach(u => assignUser.mutate({
                                                    projectId: pid,
                                                    payload: { user_email: u.mail || u.email, project_profile: 'Member' }
                                                }));
                                                setSelectedUsers([]);
                                            }}
                                            disabled={selectedUsers.length === 0}
                                        >
                                            Add Users
                                        </Button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {project.team_members?.map(m => (
                                        <div key={m.user_id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    label={(m.user?.first_name?.[0] || '?').toUpperCase()}
                                                    shape="circle"
                                                    style={{ background: 'linear-gradient(135deg,#0CD1C3,#6366f1)', color: '#fff', fontSize: '12px', fontWeight: 700 }}
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold truncate">{m.user?.first_name} {m.user?.last_name}</p>
                                                    <div className="flex gap-1.5 items-center mt-0.5">
                                                        <Tag value={m.project_profile} severity="info" rounded className="text-[9px] px-1.5 h-4" />
                                                        {m.is_owner && <Tag value="Owner" severity="warning" rounded className="text-[9px] px-1.5 h-4" />}
                                                    </div>
                                                </div>
                                            </div>
                                            {!m.is_owner && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeUser.mutate({ projectId: pid, userId: m.user_id })}
                                                    className="text-red-400 hover:text-red-500 hover:bg-red-50"
                                                    tooltip="Remove user from project"
                                                >
                                                    ✕
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </EntityDetailTemplate>

            <Sidebar
                visible={showDetailsSidebar}
                onHide={() => setShowDetailsSidebar(false)}
                position="right"
                className="w-full md:w-[400px] p-5 border border-slate-200 dark:border-slate-800/60 rounded-2xl"
                header={
                    <div className="flex flex-col gap-1">
                        <h2 className="text-lg font-bold">Project Details</h2>
                        <p className="text-xs text-slate-500">{project.project_name}</p>
                    </div>
                }
            >
                <div className="space-y-4 pt-4 overflow-y-auto max-h-[calc(100vh-120px)] no-scrollbar">

                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/60">
                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Overview</h3>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-white dark:bg-slate-800 text-slate-500 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <Hash size={12} />
                                    </div>
                                    <span className="text-xs font-medium text-slate-500">Sync ID</span>
                                </div>
                                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">{project.project_id_sync || '—'}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-white dark:bg-slate-800 text-slate-500 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <Building2 size={12} />
                                    </div>
                                    <span className="text-xs font-medium text-slate-500">Customer</span>
                                </div>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px]" title={project.customer_name}>{project.customer_name || '—'}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-white dark:bg-slate-800 text-slate-500 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <UserCircle size={12} />
                                    </div>
                                    <span className="text-xs font-medium text-slate-500">Manager</span>
                                </div>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {project.project_manager ? [project.project_manager.first_name, project.project_manager.last_name].filter(Boolean).join(' ') : '—'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-white dark:bg-slate-800 text-slate-500 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <Target size={12} />
                                    </div>
                                    <span className="text-xs font-medium text-slate-500">Delivery Head</span>
                                </div>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {project.delivery_head ? [project.delivery_head.first_name, project.delivery_head.last_name].filter(Boolean).join(' ') : '—'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/60">
                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Timeline & Progress</h3>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-[11px] mb-1.5">
                                    <span className="text-slate-500 font-medium">Task Completion</span>
                                    <span className="font-bold text-brand-teal-600 dark:text-brand-teal-400">{project.completion_percentage ?? 0}%</span>
                                </div>
                                <ProgressBar value={project.completion_percentage ?? 0} showValue={false} style={{ height: '5px' }} color={TEAL} />
                            </div>

                            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-700 pt-3">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Start Date</p>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{project.expected_start_date || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">End Date</p>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{project.expected_end_date || '—'}</p>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/60">
                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Effort & Billing</h3>

                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-[11px] mb-1.5">
                                    <span className="text-slate-500 font-medium">Effort Logged</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-100">{project.actual_hours}h <span className="text-slate-400">/ {project.estimated_hours}h</span></span>
                                </div>
                                <ProgressBar
                                    value={Math.min(100, (Number(project.actual_hours) / (Number(project.estimated_hours) || 1)) * 100)}
                                    showValue={false}
                                    style={{ height: '5px' }}
                                    color={TEAL}
                                />
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-white dark:bg-slate-800 text-slate-500 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <Briefcase size={12} />
                                    </div>
                                    <span className="text-xs font-medium text-slate-500">Billing Model</span>
                                </div>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{project.billing_model || '—'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Section: Classification */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/60">
                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Classification</h3>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-500">Priority</span>
                                <MasterBadge master={project.priority_master || (typeof project.priority === 'object' ? project.priority : { label: project.priority || 'Medium' }) as any} />
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-500">Category</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{project.project_type || 'General'}</span>
                            </div>

                            <div>
                                <span className="text-xs font-medium text-slate-500 block mb-1.5">Tags</span>
                                {project.tags ? (
                                    <div className="flex flex-wrap gap-1">
                                        {project.tags.split(',').map((t: string, i: number) => (
                                            <Tag key={i} value={t.trim()} severity="info" className="text-[9px] px-1.5 h-4" />
                                        ))}
                                    </div>
                                ) : <span className="text-xs text-slate-400">—</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </Sidebar>
        </div>
    );
}
