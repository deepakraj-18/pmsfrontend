import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { EntityDetailTemplate } from '@/components/layout/EntityDetailTemplate';
import { SectionLoadingIndicator } from '@/components/feedback/Loader/SectionLoadingIndicator';
import { Button } from '@/components/forms/Button';
import { useMilestone } from '@/features/milestones/hooks/useMilestone';
import { format, parseISO, isValid } from 'date-fns';
import { Edit, Milestone as MilestoneIcon, Calendar, Target, Clock, Hash, Tag, Layers, TrendingUp, Trash2 } from 'lucide-react';
import { DetailFieldRow } from '@/components/data-display/DetailFieldRow';
import { ProgressBar } from 'primereact/progressbar';
import { ConfirmationModal } from '@/components/core/ConfirmationModal';
import { milestonesService } from '@/api/services/milestones.service';
import { useMilestoneActions } from '../../hooks/useMilestoneActions';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { useIssues } from '@/features/issues/hooks/useIssues';
import { TaskListTable } from '@/features/tasks/components/ui/TaskListTable';
import { PMSDataTable } from '@/components/data-display/PMSDataTable';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { useLocation } from 'react-router-dom';
import { statusStr } from '@/utils/statusHelpers';

const TEAL = 'hsl(160 60% 45%)';

function fmtDate(raw?: string | null) {
    if (!raw) return '—';
    try {
        const d = parseISO(raw);
        return isValid(d) ? format(d, 'MMM d, yyyy') : raw;
    } catch { return raw; }
}

export function MilestoneDetailView() {
    const { milestoneId } = useParams<{ milestoneId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const id = parseInt(milestoneId ?? '0', 10);
    const activeTab = searchParams.get('tab') || 'Overview';


    const { data: milestone, isLoading } = useMilestone(id);
    const { data: tasksResp, isLoading: loadingTasks } = useTasks({ milestone_id: id, limit: 1000 });
    const { data: issuesResp, isLoading: loadingIssues } = useIssues({ milestone_id: id, limit: 1000 });

    if (isLoading) return <SectionLoadingIndicator fullPage label="Loading milestone..." />;
    if (!milestone) return <PageLayout showBackButton onBack={() => navigate(-1)}><div className="p-8 text-center text-muted">Milestone not found.</div></PageLayout>;

    const tasks = tasksResp?.items || [];
    const issues = issuesResp?.items || [];

    const completedCount = tasks.filter(t => {
        const s = statusStr(t.status_master ?? t.status);
        return s === 'completed' || s === 'closed' || s === 'done';
    }).length;
    const totalTasks = tasks.length;
    const pct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    const projectName = milestone.project?.project_name ?? milestone.project?.name ?? 'Independent Project';
    const displayStatus = typeof milestone.status === 'object' ? milestone.status.label : (milestone.status || 'Active');


    return (
        <PageLayout showBackButton onBack={() => navigate(-1)} isFullHeight>
            <EntityDetailTemplate
                title={milestone.milestone_name}
                subtitle={projectName}
                icon={<MilestoneIcon size={20} />}
                color="violet"
                actions={
                    <div className="flex gap-2">
                        <Button
                            variant="gradient" size="sm" icon={<Edit size={14} />}
                            onClick={() => navigate(`/milestones/${milestoneId}/edit`)}
                        >
                            Edit
                        </Button>
                    </div>
                }
                stats={[
                    { label: 'Completion', value: `${pct}%`, color: TEAL, icon: <TrendingUp size={14} /> },
                    { label: 'Tasks', value: milestone.task_count ?? 0, color: '#8b5cf6', icon: <Layers size={14} /> },
                    { label: 'Bugs', value: milestone.issue_count ?? 0, color: '#ef4444', icon: <Hash size={14} /> },
                    { label: 'Status', value: displayStatus, color: '#f59e0b', icon: <Target size={14} /> },
                ]}
                tabs={[
                    { label: 'Overview' },
                    { label: 'Tasks' },
                    { label: 'Defects' },
                ]}

            >
                <div className="min-h-[500px]">
                    {activeTab === 'Overview' && (
                        <div className="flex flex-col lg:flex-row gap-6">
                            <div className="flex-1 space-y-6">
                                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-4">
                                        Description
                                    </h3>
                                    {milestone.description ? (
                                        <div className="text-[14px] leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                            {milestone.description}
                                        </div>
                                    ) : (
                                        <p className="text-sm italic text-slate-400">No description provided.</p>
                                    )}
                                </div>

                                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-4">
                                        Progress Tracking
                                    </h3>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[13px] font-semibold">Milestone Completion</span>
                                        <span className="text-[14px] font-bold" style={{ color: TEAL }}>{pct}%</span>
                                    </div>
                                    <ProgressBar value={pct} showValue={false} style={{ height: '8px' }} color={TEAL} />
                                </div>
                            </div>

                            <div className="w-full lg:w-[320px] shrink-0 space-y-6">
                                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-4 px-1">
                                        Milestone Properties
                                    </h3>

                                    <DetailFieldRow icon={<Hash size={13} />} label="Milestone ID">
                                        <span className="font-mono">{milestone.public_id}</span>
                                    </DetailFieldRow>

                                    <DetailFieldRow icon={<Target size={13} />} label="Status">
                                        <span className="text-[12px] font-bold" style={{ color: TEAL }}>{displayStatus}</span>
                                    </DetailFieldRow>

                                    <DetailFieldRow icon={<Clock size={13} />} label="Timeline">
                                        <div className="flex flex-col gap-1">
                                            <div className="text-[12px] flex justify-between">
                                                <span className="text-slate-400">Start:</span>
                                                <span>{fmtDate(milestone.start_date)}</span>
                                            </div>
                                            <div className="text-[12px] flex justify-between">
                                                <span className="text-slate-400">End:</span>
                                                <span>{fmtDate(milestone.end_date)}</span>
                                            </div>
                                        </div>
                                    </DetailFieldRow>

                                    <DetailFieldRow icon={<Tag size={13} />} label="Tags">
                                        {milestone.tags ? (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {milestone.tags.split(',').map((t: string, i: number) => (
                                                    <span key={i} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold">
                                                        {t.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : '—'}
                                    </DetailFieldRow>

                                    <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800">
                                        <Button
                                            variant="outline"
                                            className="w-full text-[12px] font-bold h-9"
                                            onClick={() => navigate(`/milestones/${milestoneId}/edit`)}
                                        >
                                            <Edit size={12} className="mr-2" /> Modify Properties
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Tasks' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <h3 className="text-sm font-bold">Associated Tasks ({tasks.length})</h3>
                                <Button variant="gradient" size="sm" onClick={() => navigate(`/tasks/create?project_id=${milestone.project_id}&milestone_id=${id}`)}>
                                    <Plus size={14} className="mr-1" /> Add Task
                                </Button>
                            </div>
                            <TaskListTable
                                tasks={tasks}
                                loading={loadingTasks}
                                onRowClick={(t) => navigate(`/tasks/${t.id}`, { state: { from: location.pathname + location.search } })}
                            />
                        </div>
                    )}

                    {activeTab === 'Defects' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <h3 className="text-sm font-bold">Associated Defects ({issues.length})</h3>
                                <Button variant="gradient" size="sm" onClick={() => navigate(`/issues/create?project_id=${milestone.project_id}&milestone_id=${id}`)}>
                                    <Plus size={14} className="mr-1" /> Report Defect
                                </Button>
                            </div>
                            <PMSDataTable
                                columns={[
                                    { field: 'public_id', header: 'ID', width: '90px' },
                                    { field: 'bug_name', header: 'Bug Name', body: (r: any) => <span className="font-semibold">{r.bug_name}</span> },
                                    { field: 'status_master', header: 'Status', body: (r: any) => <span className="text-xs font-bold" style={{ color: r.status_master?.color }}>{r.status_master?.label}</span> },
                                    { field: 'severity_master', header: 'Severity', body: (r: any) => <span className="text-xs font-bold" style={{ color: r.severity_master?.color }}>{r.severity_master?.label}</span> },
                                    { field: 'due_date', header: 'Target Date' }
                                ]}
                                data={issues}
                                loading={loadingIssues}
                                onRowClick={(r: any) => navigate(`/issues/${r.id}`, { state: { from: location.pathname + location.search } })}
                            />
                        </div>
                    )}
                </div>

            </EntityDetailTemplate>
        </PageLayout>
    );
}
