import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar } from 'primereact/avatar';
import { ProgressBar } from 'primereact/progressbar';
import { ZohoEntityDetailLayout } from '@/components/layout/ZohoEntityDetailLayout';
import { SectionLoadingIndicator } from '@/components/feedback/Loader/SectionLoadingIndicator';
import { DetailViewSkeleton } from '@/components/feedback/Skeleton/DetailViewSkeleton';
import { Button } from '@/components/forms/Button';
import { useTask } from '@/features/tasks/hooks/useTasks';
import { tasksService } from '@/api/services/tasks.service';
import { timelogsService } from '@/api/services/timelogs.service';
import { format, parseISO, isValid } from 'date-fns';
import { useToast } from '@/providers/ToastContext';
import {
    Edit, Clock, Hash, Calendar, User2, Tag, Timer, Layers, TrendingUp, Users, MessageSquare, Paperclip, Workflow, Bug, ListTodo, Shield, AlertCircle, Info, Layout
} from 'lucide-react';

import { calculateDaysLeft, formatDaysLeftText } from '@/utils/dateHelpers';
import { DetailFieldRow } from '@/components/data-display/DetailFieldRow';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { PriorityBadge } from '@/components/data-display/PriorityBadge';
import { PersonAvatar } from '@/components/data-display/PersonAvatar';
import { LogTimeInline } from '@/features/timelogs/components/ui/LogTimeInline';

const TEAL = 'hsl(160 60% 45%)';
import { useAuth } from '@/auth/AuthProvider';
import { can } from '@/utils/permissions';

function fmtDate(raw?: string | null) {
    if (!raw) return '—';
    try {
        const d = parseISO(raw);
        return isValid(d) ? format(d, 'MMM d, yyyy') : raw;
    } catch { return raw; }
}

export function TaskDetailView() {
    const { taskId } = useParams<{ taskId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const id = parseInt(taskId ?? '0', 10);
    const activeTab = searchParams.get('tab') || 'Time Logs';

    const { data: task, isLoading } = useTask(id);

    const { data: siblingsRes, isLoading: siblingsLoading } = useQuery({
        queryKey: ['tasks', 'siblings', task?.project_id],
        queryFn: () => tasksService.getTasks({ project_id: task?.project_id, limit: 100 }),
        enabled: !!task?.project_id,
    });

    const { data: timelogs = [], refetch: refetchLogs } = useQuery({
        queryKey: ['timelogs-task', id],
        queryFn: () => timelogsService.getTimelogs(0, 2000, undefined, id),
        enabled: !!id,
    });

    if (isLoading) return <DetailViewSkeleton />;
    if (!task) return <SectionLoadingIndicator fullPage label="Task not found" />;

    const taskTimelogs = Array.isArray(timelogs) ? timelogs : (timelogs as any)?.items || [];
    const actualHours = taskTimelogs.reduce((s, l) => s + Number(l.daily_log_hours ?? l.hours ?? 0), 0);
    const estimated = Number(task.estimated_hours ?? 0);
    const pct = task.completion_percentage ?? 0;
    const daysLeft = calculateDaysLeft(task.due_date ?? (task as any).end_date);
    const projectName = task.project?.project_name ?? task.project?.name ?? 'Independent Task';
    
    const getOwnerDisplay = (t: any) => {
        const owner = t.assignee || t.single_owner || (t.owners && t.owners.length > 0 ? t.owners[0] : null);
        if (!owner) return 'Unassigned';
        return `${owner.first_name} ${owner.last_name || ''}`.trim();
    };

    const sidebarItems = (siblingsRes?.items || []).map((t: any) => {
        const owner = t.assignee || t.single_owner || (t.owners && t.owners.length > 0 ? t.owners[0] : null);
        return {
            id: t.id,
            title: t.task_name,
            identifier: t.public_id,
            status: t.status_master || t.status,
            subtitle: owner?.first_name ? [owner.first_name, owner.last_name].filter(Boolean).join(' ') : 'Unassigned'
        };
    });

    const infoSections = [
        {
            title: 'Description',
            content: (
                <div className="text-[14px] leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {task.description || <span className="italic text-slate-400">No description provided.</span>}
                </div>
            ),
            defaultOpen: false
        },
        {
            title: 'Task Information',
            content: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                    <DetailFieldRow icon={<Hash size={13} />} label="Task ID">
                        <span className="font-mono text-xs">{task.public_id}</span>
                    </DetailFieldRow>
                    <DetailFieldRow icon={<User2 size={13} />} label="Task Owner">
                        <PersonAvatar person={task.assignee || task.single_owner || (task.owners && task.owners.length > 0 ? task.owners[0] : null)} size="sm" />
                    </DetailFieldRow>
                    <DetailFieldRow icon={<Clock size={13} />} label="Work Hours">
                        <span className="font-bold text-teal-600">{(task as any).work_hours || 0} hrs</span>
                    </DetailFieldRow>
                    <DetailFieldRow icon={<Timer size={13} />} label="Billing Type">
                        <span className={task.billing_type === 'Non-Billable' ? 'text-rose-500' : 'text-emerald-500'}>
                            {task.billing_type || 'Billable'}
                        </span>
                    </DetailFieldRow>
                    <DetailFieldRow icon={<Calendar size={13} />} label="Start Date">
                        {fmtDate(task.start_date)}
                    </DetailFieldRow>
                    <DetailFieldRow icon={<Calendar size={13} />} label="Due Date">
                        {fmtDate(task.due_date || (task as any).end_date)}
                    </DetailFieldRow>
                    <DetailFieldRow icon={<Layers size={13} />} label="Duration">
                        {task.duration ? `${task.duration} days` : '—'}
                    </DetailFieldRow>

                    <DetailFieldRow icon={<Tag size={13} />} label="Tags">
                        {task.tags || '—'}
                    </DetailFieldRow>
                </div>
            ),
            defaultOpen: false
        }
    ];

    const tabs = [
        {
            label: 'Time Logs',
            content: (
                <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                        <thead>
                            <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-4 py-3 font-bold uppercase text-[10px]">Date</th>
                                <th className="px-4 py-3 font-bold uppercase text-[10px]">User</th>
                                <th className="px-4 py-3 font-bold uppercase text-[10px]">Hours</th>
                                <th className="px-4 py-3 font-bold uppercase text-[10px]">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {taskTimelogs.length === 0 ? (
                                <tr><td colSpan={4} className="py-12 text-center text-slate-400">No time logs found.</td></tr>
                            ) : taskTimelogs.map((log: any) => (
                                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                    <td className="px-4 py-4">{fmtDate(log.date)}</td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <Avatar label={log.user?.first_name?.[0]} shape="circle" size="small" />
                                            <span>{[log.user?.first_name, log.user?.last_name].filter(Boolean).join(' ')}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 font-bold text-teal-600">{Number(log.daily_log_hours || log.hours || 0).toFixed(2)}h</td>
                                    <td className="px-4 py-4 text-slate-500">{log.description || log.log_title || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ),
            count: taskTimelogs.length
        }
    ];

    return (
        <ZohoEntityDetailLayout
            title={task.task_name}
            subtitle={<Link to={`/projects/${task.project_id}`} className="hover:underline">{projectName}</Link>}
            identifier={task.public_id}
            entityType="Task"
            status={task.status_master || task.status}
            priority={task.priority_master || task.priority}
            sidebarItems={sidebarItems}
            sidebarLoading={siblingsLoading}
            onSidebarItemClick={(id) => navigate(`/tasks/${id}${window.location.search}`, { replace: true })}
            activeTab={activeTab}
            onTabChange={(tab) => setSearchParams({ tab })}
            infoSections={infoSections}
            tabs={tabs}
            exitPath={location.state?.from ?? (task.project_id ? `/projects/${task.project_id}?tab=Tasks` : '/tasks')}
            metadata={[
                <span key="created" className="flex items-center gap-1.5"><Calendar size={13} className="text-slate-400" /> Created: {fmtDate(task.created_at)}</span>,
                <span key="priority" className="flex items-center gap-1.5"><Shield size={13} className="text-slate-400" /> Priority: {task.priority_master?.label || 'Normal'}</span>,
                <span key="hours" className="flex items-center gap-1.5"><Timer size={13} className="text-slate-400" /> Est: {task.estimated_hours || task.work_hours || 0}h</span>
            ]}
            headerStats={[
                { label: 'Time Logged', value: `${Number(task.cached_timelog_total || 0).toFixed(1)}h`, icon: <Clock size={16} /> },
                { label: 'Estimate', value: `${Number(task.estimated_hours || task.work_hours || 0).toFixed(1)}h`, icon: <Timer size={16} /> },
                { label: 'Due Date', value: fmtDate(task.due_date || (task as any).end_date), icon: <Calendar size={16} /> },
                { label: 'Task Owner', value: getOwnerDisplay(task), icon: <User2 size={16} /> }
            ]}
            actions={
                <div className="flex items-center gap-2">
                    {can.createTimelog(user?.role) && (
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={<Clock size={14} />}
                            onClick={() => navigate(`/time-log/add?projectId=${task.project_id}&taskId=${id}`, { state: { from: location.pathname } })}
                            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                            Log Time
                        </Button>
                    )}
                    {can.updateTask(user?.role) && (
                        <Button variant="primary" size="sm" icon={<Edit size={14} />} onClick={() => navigate(`/tasks/${id}/edit`, { state: location.state })}>
                            Edit
                        </Button>
                    )}
                </div>
            }
        >
            {null}
        </ZohoEntityDetailLayout>
    );
}
