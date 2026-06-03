import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar } from 'primereact/avatar';
import { ZohoEntityDetailLayout } from '@/components/layout/ZohoEntityDetailLayout';
import { SectionLoadingIndicator } from '@/components/feedback/Loader/SectionLoadingIndicator';
import { DetailViewSkeleton } from '@/components/feedback/Skeleton/DetailViewSkeleton';
import { Button } from '@/components/forms/Button';
import { useIssue } from '../../hooks/useIssues';
import { useIssueActions } from '../../hooks/useIssueActions';
import { useStatuses } from '@/features/masters/hooks/useMasters';
import { useToast } from '@/providers/ToastContext';
import { issuesService } from '@/api/services/issues.service';
import { timelogsService } from '@/api/services/timelogs.service';
import { format, parseISO, isValid } from 'date-fns';
import {
    Edit, AlertCircle, Calendar, Clock, Hash, User2, Users, Tag, Layout, Info, ShieldAlert, ImageIcon, MessageSquare, Paperclip, Workflow, Timer, TrendingUp
} from 'lucide-react';
import { statusStr } from '@/utils/statusHelpers';
import { calculateDaysLeft } from '@/utils/dateHelpers';
import { DetailFieldRow } from '@/components/data-display/DetailFieldRow';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { SeverityBadge } from '@/components/data-display/SeverityBadge';
import { PersonAvatar } from '@/components/data-display/PersonAvatar';
import { LogTimeInline } from '@/features/timelogs/components/ui/LogTimeInline';

const TEAL = 'hsl(160 60% 45%)';
import { useAuth } from '@/auth/AuthProvider';
import { can } from '@/utils/permissions';
const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/api\/v1$/, '') ?? '';

function fmtDate(raw?: string | null) {
    if (!raw) return '—';
    try { const d = parseISO(raw); return isValid(d) ? format(d, 'MMM d, yyyy') : raw; } catch { return raw; }
}

export function IssueDetailView() {
    const { issueId } = useParams<{ issueId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const id = parseInt(issueId ?? '0', 10);
    const activeTab = searchParams.get('tab') || 'Time Logs';

    const { data: issue, isLoading, refetch } = useIssue(id);
    const { data: statuses = [] } = useStatuses();

    const { data: siblingsRes, isLoading: siblingsLoading } = useQuery({
        queryKey: ['issues', 'siblings', issue?.project_id],
        queryFn: () => issuesService.getIssues({ project_id: issue?.project_id, limit: 100 }),
        enabled: !!issue?.project_id,
    });

    const { data: timelogs = [], refetch: refetchLogs } = useQuery({
        queryKey: ['timelogs-issue', id],
        queryFn: () => timelogsService.getTimelogs(0, 2000, undefined, undefined, id),
        enabled: !!id,
    });

    const { updateIssue } = useIssueActions();
    const [reopening, setReopening] = useState(false);

    if (isLoading) return <DetailViewSkeleton />;
    if (!issue) return <SectionLoadingIndicator fullPage label="Issue not found" />;

    const issueTimelogs = Array.isArray(timelogs) ? timelogs : (timelogs as any)?.items || [];
    const actualHours = issueTimelogs.reduce((s, l) => s + Number(l.daily_log_hours ?? l.hours ?? 0), 0);
    const isClosed = statusStr(issue.status) === 'closed';
    const projectName = issue.project?.project_name ?? issue.project?.name ?? 'General Issue';

    const getReporterDisplay = (i: any) => {
        if (!i.reporter) return 'System';
        return `${i.reporter.first_name} ${i.reporter.last_name || ''}`.trim();
    };

    const getAssigneeDisplay = (i: any) => {
        const ass = i.assignee || (i.assignees && i.assignees.length > 0 ? i.assignees[0] : null);
        if (!ass) return 'Unassigned';
        return `${ass.first_name} ${ass.last_name || ''}`.trim();
    };

    const handleReOpen = async () => {
        const s = (statuses as any[]).find(st => ['re-open', 'reopen', 're-opened', 'reopened'].includes(st.name.toLowerCase()));
        if (!s) { showToast('error', 'Error', '"Re-Open" status not found'); return; }
        setReopening(true);
        try {
            await updateIssue.mutateAsync({ id: issue.id, data: { status_id: s.id } });
            refetch();
        } catch { showToast('error', 'Error', 'Failed to update status.'); }
        finally { setReopening(false); }
    };

    const handleViewDocument = async (doc: any) => {
        try {
            const token = localStorage.getItem('pms_token');
            const response = await fetch(`${API_BASE}/api/v1/documents/${doc.id}/download?inline=true`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed');
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch { showToast('error', 'Error', 'Failed to view document.'); }
    };

    const sidebarItems = (siblingsRes?.items || []).map((i: any) => {
        const assignee = i.assignee || (i.assignees && i.assignees.length > 0 ? i.assignees[0] : null);
        return {
            id: i.id,
            title: i.bug_name,
            identifier: i.public_id,
            status: i.status_master || i.status,
            subtitle: assignee?.first_name ? `${assignee.first_name} ${assignee.last_name || ''}` : 'Unassigned'
        };
    });

    const infoSections = [
        {
            title: 'Description',
            content: (
                <div className="text-[14px] leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {issue.description || <span className="italic text-slate-400">No description provided.</span>}
                </div>
            ),
            defaultOpen: false
        },
        {
            title: 'Defect Information',
            content: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                    <DetailFieldRow icon={<Hash size={13} />} label="Public ID">
                        <span className="font-mono text-xs">{issue.public_id}</span>
                    </DetailFieldRow>
                    <DetailFieldRow icon={<ShieldAlert size={13} />} label="Severity">
                        <SeverityBadge severity={issue.severity_master || issue.severity} />
                    </DetailFieldRow>
                    <DetailFieldRow icon={<Info size={13} />} label="Classification">
                        {issue.classification || 'Bug'}
                    </DetailFieldRow>
                    <DetailFieldRow icon={<Layout size={13} />} label="Module / Section">
                        {issue.module || 'Root'}
                    </DetailFieldRow>
                    <DetailFieldRow icon={<User2 size={13} />} label="Reporter">
                        <PersonAvatar person={issue.reporter} size="sm" />
                    </DetailFieldRow>
                    <DetailFieldRow icon={<User2 size={13} />} label="Assignee">
                        <PersonAvatar person={issue.assignee || (issue.assignees && issue.assignees.length > 0 ? issue.assignees[0] : null)} size="sm" />
                    </DetailFieldRow>
                    <DetailFieldRow icon={<Calendar size={13} />} label="Due Date">
                        {fmtDate(issue.due_date)}
                    </DetailFieldRow>
                    <DetailFieldRow icon={<Tag size={13} />} label="Tags">
                        {issue.tags || '—'}
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
                            {issueTimelogs.length === 0 ? (
                                <tr><td colSpan={4} className="py-12 text-center text-slate-400">No time logs found.</td></tr>
                            ) : issueTimelogs.map((log: any) => (
                                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                    <td className="px-4 py-4">{fmtDate(log.date)}</td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <Avatar label={log.user?.first_name?.[0]} shape="circle" size="small" />
                                            <span>{log.user?.first_name} {log.user?.last_name}</span>
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
            count: issueTimelogs.length
        },
        {
            label: 'Attachments',
            content: (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {(!issue.documents || issue.documents.length === 0) ? (
                        <div className="col-span-full py-12 text-center text-slate-400">No attachments found.</div>
                    ) : issue.documents.map((doc: any) => (
                        <div
                            key={doc.id}
                            onClick={() => handleViewDocument(doc)}
                            className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden cursor-pointer hover:shadow-md transition-all"
                        >
                            <div className="aspect-video w-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/50">
                                {(doc.file_type?.startsWith('image/') || doc.file_url?.match(/\.(jpeg|jpg|gif|png)$/i)) ? (
                                    <img
                                        src={`${API_BASE}/api/v1/documents/${doc.id}/download?inline=true&token=${localStorage.getItem('pms_token')}`}
                                        alt={doc.title}
                                        className="h-full w-full object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <Paperclip size={24} className="text-slate-300" />
                                )}
                            </div>
                            <div className="p-2 border-t border-slate-50 dark:border-slate-800">
                                <p className="text-[11px] font-bold truncate text-slate-700 dark:text-slate-300" title={doc.title}>
                                    {doc.title}
                                </p>
                                <p className="text-[9px] text-slate-400 uppercase font-black mt-0.5">
                                    {doc.file_type?.split('/')[1]?.toUpperCase() || 'FILE'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ),
            count: issue.documents?.length || 0
        }
    ];

    return (
        <ZohoEntityDetailLayout
            title={issue.bug_name}
            subtitle={<Link to={`/projects/${issue.project_id}`} className="hover:underline">{projectName}</Link>}
            identifier={issue.public_id}
            entityType="Issue"
            status={issue.status_master || issue.status}
            priority={issue.severity_master || issue.severity}
            sidebarItems={sidebarItems}
            sidebarLoading={siblingsLoading}
            onSidebarItemClick={(id) => navigate(`/issues/${id}${window.location.search}`, { replace: true, state: location.state })}
            activeTab={activeTab}
            onTabChange={(tab) => setSearchParams({ tab }, { state: location.state })}
            infoSections={infoSections}
            tabs={tabs}
            exitPath={location.state?.from || (issue.project_id ? `/projects/${issue.project_id}?tab=Defects` : '/issues')}
            metadata={[
                <span key="created" className="flex items-center gap-1.5"><Calendar size={13} className="text-slate-400" /> Created: {fmtDate(issue.created_at)}</span>,
                <span key="severity" className="flex items-center gap-1.5"><ShieldAlert size={13} className="text-slate-400" /> {issue.severity_master?.label || 'Normal'}</span>,
                <span key="type" className="flex items-center gap-1.5"><Tag size={13} className="text-slate-400" /> {issue.classification_master?.label || 'General'}</span>
            ]}
            headerStats={[
                { label: 'Severity', value: issue.severity_master?.label || issue.severity || 'Normal', icon: <ShieldAlert size={14} />, color: '#ef4444' },
                { label: 'Timeline', value: fmtDate(issue.due_date), icon: <Calendar size={14} />, color: '#6366f1' },
                { label: 'Reporter', value: getReporterDisplay(issue), icon: <User2 size={14} />, color: '#f59e0b' }
            ]}
            actions={
                <div className="flex gap-2">
                    {can.createTimelog(user?.role) && (
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={<Clock size={14} />}
                            onClick={() => navigate(`/time-log/add?projectId=${issue.project_id}&issueId=${id}`, { state: { from: location.pathname } })}
                            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                            Log Time
                        </Button>
                    )}

                    {can.updateIssue(user?.role) && (
                        <Button variant="primary" size="sm" icon={<Edit size={14} />} onClick={() => navigate(`/issues/${issueId}/edit`, { state: location.state })}>
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
