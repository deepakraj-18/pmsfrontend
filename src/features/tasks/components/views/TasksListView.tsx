import { DropdownSelect } from "@/components/forms/DropdownSelect";
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { EntityPageTemplate } from '@/components/layout/EntityPageTemplate';
import { Button } from '@/components/forms/Button';
import { SegmentedControl } from '@/components/forms/SegmentedControl';
import { EmptyState } from '@/components/data-display/EmptyState';
import { StatCardProps } from '@/components/data-display/StatCard';
import { Search, Plus, Download, Upload, Layers, CheckCircle, Clock, AlertTriangle, Columns, List as ListIcon, X } from 'lucide-react';
import { TaskListTable } from '../ui/TaskListTable';
import { TableSkeleton } from '@/components/feedback/Skeleton/TableSkeleton';
import { TaskKanbanBoard } from '../ui/TaskKanbanBoard';
import { Task } from '@/api/services/tasks.service';
import { timelogsService, TimeLog } from '@/api/services/timelogs.service';
import { exportToCSV } from '@/utils/export';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { useMasterLookups, useUsersDropdown } from '@/features/masters/hooks/useMasters';
import { useAuth } from '@/auth/AuthProvider';
import { can } from '@/utils/permissions';
import { statusStr } from '@/utils/statusHelpers';
import { tasklistsService, TaskList } from '@/api/services/tasklists.service';
import { useFilters } from '@/hooks/useFilters';
import { useDebounce } from '@/hooks/useDebounce';
import { InputText } from 'primereact/inputtext';
import { LazyParams } from '@/components/data-display/DataTable';

export function TasksListView() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [view, setView] = useState<'list' | 'kanban'>('list');
    const [groupBy, setGroupBy] = useState<'none' | 'tasklist' | 'project'>('tasklist');
    const [lazyParams, setLazyParams] = useState<LazyParams>({ first: 0, rows: 20, page: 0 });
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 400);

    const {
        selectedFilters, handleFilterChange, clearFilters, hasActiveFilters,
    } = useFilters();

    const queryParams = useMemo(() => ({
        skip: groupBy !== 'none' ? 0 : lazyParams.first,
        limit: 100,
        status_id: selectedFilters.status?.map(Number),
        priority_id: selectedFilters.priority?.map(Number),
        assignee_email: selectedFilters.assignee,
        project_id: selectedFilters.project?.map(Number),
        search: debouncedSearch || undefined,
    }), [lazyParams, selectedFilters, debouncedSearch, groupBy]);

    const { data: tasksResponse, isLoading: loadingTasks, refetch } = useTasks(queryParams);

    let tasks: Task[] = tasksResponse?.items || [];
    let totalRecords: number = tasksResponse?.total || 0;

    if (selectedFilters.timeline?.includes('overdue')) {
        tasks = tasks.filter(t => {
            if (!t.due_date) return false;
            const s = statusStr((t as any).status_master ?? t.status);
            const isDone = s === 'completed' || s === 'closed' || s === 'done';
            const dueDate = new Date(t.due_date);
            dueDate.setHours(23, 59, 59, 999);
            return !isDone && dueDate < new Date();
        });
        totalRecords = tasks.length;
    }

    const { data: statusesData } = useMasterLookups('TaskStatus');
    const { data: prioritiesData } = useMasterLookups('TaskPriority');
    const { data: allUsersData } = useUsersDropdown();

    const statuses = Array.isArray(statusesData) ? statusesData : (statusesData as any)?.items || [];
    const priorities = Array.isArray(prioritiesData) ? prioritiesData : (prioritiesData as any)?.items || [];
    const allUsers = Array.isArray(allUsersData) ? allUsersData : (allUsersData as any)?.items || [];

    const { data: projectsData } = useProjects({ limit: 1000 });
    const allProjects = Array.isArray(projectsData) ? projectsData : (projectsData as any)?.items || [];

    const [timelogs, setTimelogs] = useState<TimeLog[]>([]);
    const [taskLists, setTaskLists] = useState<TaskList[]>([]);

    useEffect(() => {
        timelogsService.getTimelogs(0, 100).then(setTimelogs).catch(console.error);
        tasklistsService.getTaskLists(undefined, 0, 1000).then(setTaskLists).catch(console.error);
    }, []);

    const filterGroups = [
        { id: 'timeline', label: 'Timeline', options: [{ label: 'Overdue Only', value: 'overdue' }] },
        { id: 'project', label: 'Project', options: allProjects.map((p: any) => ({ label: p.project_name, value: p.id.toString() })) },
        { id: 'status', label: 'Status', options: statuses.map((s: any) => ({ label: s.label || s.name, value: s.id.toString() })) },
        { id: 'priority', label: 'Priority', options: priorities.map((p: any) => ({ label: p.label || p.name, value: p.id.toString() })) },
        { id: 'assignee', label: 'Task Owner', options: allUsers.map((u: any) => ({ label: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email, value: u.email })) },
    ];

    const statsProps: StatCardProps[] = useMemo(() => {
        if (loadingTasks && !tasksResponse) return [];
        return [
            { label: 'Total Visible', value: tasks.length, icon: <Layers size={18} strokeWidth={2} />, accentVariant: 'teal' },
            {
                label: 'Completed', value: tasks.filter(t => {
                    const s = statusStr((t as any).status_master ?? t.status);
                    return s === 'completed' || s === 'closed' || s === 'done';
                }).length, icon: <CheckCircle size={18} strokeWidth={2} />, accentVariant: 'teal'
            },
            {
                label: 'In Progress', value: tasks.filter(t => {
                    const s = statusStr((t as any).status_master ?? t.status);
                    return s === 'in progress' || s === 'active' || s === 'planning';
                }).length, icon: <Clock size={18} strokeWidth={2} />, accentVariant: 'violet'
            },
            {
                label: 'Overdue',
                value: tasks.filter(t => {
                    if (!t.due_date) return false;
                    const s = statusStr((t as any).status_master ?? t.status);
                    const isDone = s === 'completed' || s === 'closed' || s === 'done';
                    const dueDate = new Date(t.due_date);
                    dueDate.setHours(23, 59, 59, 999);
                    return !isDone && dueDate < new Date();
                }).length,
                icon: <AlertTriangle size={18} strokeWidth={2} />,
                accentVariant: 'rose'
            },
        ];
    }, [tasks, tasksResponse, loadingTasks]);

    const handleExport = () => {
        const exportData = tasks.map((t: any) => ({
            'Task ID': t.public_id ?? '',
            'Task Name': t.task_name ?? '',
            'Description': t.description ?? '',
            'Project': t.project?.project_name ?? '',
            'Task List': t.task_list?.name ?? '',
            'Milestone': t.milestone?.name ?? t.milestone?.title ?? '',
            'Status': t.status_master?.label ?? t.status?.label ?? '',
            'Priority': t.priority_master?.label ?? t.priority?.label ?? '',
            'Assignee': t.assignee ? [t.assignee.first_name, t.assignee.last_name].filter(Boolean).join(' ') : '',
            'Assignees': Array.isArray(t.assignees) ? t.assignees.map((u: any) => [u.first_name, u.last_name].filter(Boolean).join(' ')).join('; ') : '',
            'Owners': Array.isArray(t.owners) ? t.owners.map((u: any) => [u.first_name, u.last_name].filter(Boolean).join(' ')).join('; ') : '',
            'Start Date': t.start_date ?? '',
            'Due Date': t.due_date ?? '',
            'Completion Date': t.completion_date ?? '',
            'Completion %': t.completion_percentage ?? 0,
            'Estimated Hours': t.estimated_hours ?? '',
            'Work Hours': t.work_hours ?? '',
            'Timelog Total': t.cached_timelog_total ?? '',
            'Billing Type': t.billing_type ?? '',
            'Tags': t.tags ?? '',
        }));
        exportToCSV(exportData, 'tasks.csv');
    };

    return (
        <EntityPageTemplate
            title="Tasks"
            stats={statsProps}
            filterGroups={filterGroups}
            selectedFilters={selectedFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
            activeFilterCount={Object.values(selectedFilters).flat().length}
            loading={loadingTasks}
            headerActions={
                <div className="flex items-center gap-2">
                    <SegmentedControl
                        value={view}
                        onChange={(v) => setView(v as 'list' | 'kanban')}
                        options={[
                            { label: 'List', value: 'list', icon: <ListIcon size={13} strokeWidth={2.5} /> },
                            { label: 'Kanban', value: 'kanban', icon: <Columns size={13} strokeWidth={2.5} /> },
                        ]}
                    />
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[13px] font-medium whitespace-nowrap">Group by:</span>
                        <SegmentedControl
                            value={groupBy}
                            onChange={(v) => setGroupBy(v as 'none' | 'tasklist' | 'project')}
                            options={[
                                { label: 'None', value: 'none' },
                                { label: 'Task List', value: 'tasklist' },
                                { label: 'Project', value: 'project' },
                            ]}
                        />
                    </div>
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleExport}
                        className="!w-9 !h-9 !p-0 !rounded-xl"
                        tooltip="Export CSV"
                    >
                        <Download size={15} strokeWidth={2.5} />
                    </Button>
                    {can.createTask(user?.role) && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate('/tasks/import')}
                            className="!w-9 !h-9 !p-0 !rounded-xl"
                            tooltip="Import CSV"
                        >
                            <Upload size={15} strokeWidth={2.5} />
                        </Button>
                    )}
                    {can.createTask(user?.role) && (
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/tasklists/create')}
                            className="!h-9 !px-4 !rounded-lg ml-1"
                        >
                            <Layers size={15} /> Add Task List
                        </Button>
                    )}
                    {can.createTask(user?.role) && (
                        <Button
                            variant="primary"
                            onClick={() => navigate('/tasks/create')}
                            className="!h-9 !px-4 !rounded-lg ml-1"
                        >
                            <Plus size={15} /> Add Task
                        </Button>
                    )}
                </div>
            }
            utilityBarExtra={null}
        >
            {view === 'list' ? (
                <div className="h-full flex flex-col min-h-0">
                    {loadingTasks && !tasksResponse ? (
                        <div className="p-4 h-full overflow-hidden">
                            <TableSkeleton rows={10} columns={8} />
                        </div>
                    ) : tasks.length === 0 ? (
                        <EmptyState
                            icon={<Layers />}
                            title="No tasks found"
                            description={hasActiveFilters || search ? "Try adjusting your filters or search to see more tasks." : "No tasks have been created yet. Start by creating a task."}
                            action={(!hasActiveFilters && !search) && <Button variant="primary" onClick={() => navigate('/tasks/create')} className="!h-10 !px-5 !rounded-lg"><Plus size={15} /> New Task</Button>}
                        />
                    ) : (
                        <TaskListTable
                            tasks={tasks}
                            timelogs={timelogs}
                            taskLists={taskLists}
                            canRename={can.manageTaskLists(user?.role)}
                            onRowClick={(task) => navigate(`/tasks/${task.id}`, { state: { from: location.pathname + location.search } })}
                            groupBy={groupBy}
                            onTaskListRenamed={() => refetch()}
                            loading={loadingTasks}
                            lazy={groupBy === 'none'}
                            paginator={true}
                            totalRecords={totalRecords}
                            onPage={(e) => setLazyParams(e)}
                            first={lazyParams.first}
                            rows={lazyParams.rows}
                        />
                    )}
                </div>
            ) : (
                <div className="h-full overflow-hidden bg-slate-50 dark:bg-slate-900/50">
                    {tasks.length === 0 ? (
                        <EmptyState
                            icon={<Layers />}
                            title="Board is empty"
                            description={hasActiveFilters || search ? "No tasks match your filters or search." : "Ready for action! There are no tasks on the board yet."}
                        />
                    ) : (
                        <TaskKanbanBoard tasks={tasks} />
                    )}
                </div>
            )}
        </EntityPageTemplate>
    );
}
