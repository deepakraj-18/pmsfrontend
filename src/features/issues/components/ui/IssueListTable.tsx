import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Avatar } from 'primereact/avatar';
import { format, parseISO, isPast, isValid } from 'date-fns';
import { Issue } from '../../api/issues.api';
import { InlineEditCell } from '@/components/forms/InlineEditCell';
import { InlineSelectCell } from '@/components/forms/InlineSelectCell';
import { useIssueActions } from '../../hooks/useIssueActions';
import { useMasterLookups } from '@/features/masters/hooks/useMasters';

interface IssueListTableProps {
    issues: Issue[];
    onRowClick?: (issue: Issue) => void;
    loading?: boolean;
    totalRecords?: number;
    lazy?: boolean;
    paginator?: boolean;
    onPage?: (event: any) => void;
    first?: number;
    rows?: number;
}

const TEAL = 'hsl(160 60% 45%)';

function SeverityBadge({ severity }: { severity?: any }) {
    const label = typeof severity === 'string' ? severity : (severity?.label ?? severity?.name ?? '—');
    const color = typeof severity === 'object' ? severity?.color : undefined;

    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold"
            style={{
                background: color ? `${color}18` : 'var(--bg-secondary)',
                color: color ?? 'var(--text-secondary)',
                border: color ? `1px solid ${color}33` : '1px solid var(--border-color)'
            }}>
            {label}
        </span>
    );
}

const STATUS_COLOR_MAP: Record<string, string> = {
    'Open': '#3b82f6',
    'In Progress': '#3b82f6',
    'Hold': '#f59e0b',
    'Cancelled': '#ef4444',
    'Resolved': '#10b981',
    'Re-Open': '#ec4899',
    'Not a defect': '#6b7280',
    'Closed': '#6b7280',
};

function StatusBadge({ status }: { status?: any }) {
    const label = typeof status === 'string' ? status : status?.label ?? status?.name ?? '—';
    const labelStr = String(label);
    let color = typeof status === 'object' ? status?.color : undefined;

    if (!color && labelStr) {
        const match = Object.keys(STATUS_COLOR_MAP).find(k => k.toLowerCase() === labelStr.toLowerCase());
        if (match) color = STATUS_COLOR_MAP[match];
    }

    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
            style={{
                background: color ? `${color}18` : 'var(--bg-secondary)',
                color: color ?? 'var(--text-secondary)',
                border: color ? `1px solid ${color}33` : '1px solid var(--border-color)'
            }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: color ?? 'var(--text-muted)' }} />
            {label}
        </span>
    );
}

function PersonCell({ person }: { person?: any }) {
    if (!person) return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>;

    const initials = (person.first_name?.[0] ?? person.displayName?.[0] ?? person.email?.[0] ?? person.mail?.[0] ?? '').toUpperCase();
    const name = person.displayName || [person.first_name, person.last_name].filter(Boolean).join(' ') || person.email || person.mail || 'Unknown';

    return (
        <div className="flex items-center gap-1.5">
            <Avatar
                label={initials || '?'}
                size="normal"
                shape="circle"
                style={{
                    width: 22, height: 22, fontSize: 9, fontWeight: 700,
                    background: 'linear-gradient(135deg,#0CD1C3,#6366f1)', color: '#fff',
                }}
            />
            <span className="text-[12px] font-medium truncate max-w-[120px]"
                style={{ color: 'var(--text-primary)' }}>
                {name}
            </span>
        </div>
    );
}

function DateCell({ date, warn }: { date?: string | null; warn?: boolean }) {
    if (!date) return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>;
    try {
        const d = parseISO(date);
        if (!isValid(d)) return <span style={{ fontSize: 12 }}>{date}</span>;
        const overdue = warn && isPast(d);
        return (
            <span className="text-[12px] font-semibold tabular-nums"
                style={{ color: overdue ? '#ef4444' : 'var(--text-primary)' }}>
                {format(d, 'MM/dd/yyyy')}
            </span>
        );
    } catch {
        return <span style={{ fontSize: 12 }}>{date}</span>;
    }
}

export function IssueListTable({
    issues, onRowClick, loading, totalRecords,
    lazy, paginator, onPage, first, rows
}: IssueListTableProps) {
    const navigate = useNavigate();
    const { updateIssue } = useIssueActions();
    const { data: statusesData } = useMasterLookups('IssueStatus');
    const { data: severitiesData } = useMasterLookups('IssueSeverity');
    const statuses = Array.isArray(statusesData) ? statusesData : (statusesData as any)?.items || [];
    const severities = Array.isArray(severitiesData) ? severitiesData : (severitiesData as any)?.items || [];

    const handleInlineUpdate = (issue: any, field: string, value: any) => {
        const data: any = {};

        if (field === 'bug_name') {
            data.bug_name = value;
            issue.bug_name = value;
        }
        if (field === 'status_id') {
            data.status_id = value;
            issue.status_id = value;
            if (issue.status_master) {
                const matched = statuses.find((s: any) => s.id === value);
                if (matched) issue.status_master = matched;
            }
        }
        if (field === 'severity_id') {
            data.severity_id = value;
            issue.severity_id = value;
            if (issue.severity_master) {
                const matched = severities.find((s: any) => s.id === value);
                if (matched) issue.severity_master = matched;
            }
        }

        updateIssue.mutate({
            id: issue.id,
            data
        });
    };

    return (
        <div className="w-full h-full overflow-auto">
            <DataTable
                value={issues}
                loading={loading}
                dataKey="id"
                showGridlines
                stripedRows
                resizableColumns
                columnResizeMode="fit"
                scrollable
                scrollHeight="flex"
                size="small"
                lazy={lazy}
                paginator={paginator}
                totalRecords={totalRecords}
                onPage={onPage}
                first={first}
                rows={rows ?? 20}
                onRowClick={(e) => {
                    const target = e.originalEvent?.target as HTMLElement;
                    if (target?.closest('input') || target?.closest('.p-dropdown') || target?.closest('button') || target?.closest('.p-dropdown-panel')) {
                        return;
                    }
                    onRowClick ? onRowClick(e.data as Issue) : navigate(`/issues/${(e.data as Issue).id}`);
                }}
                rowClassName={() => 'hover:bg-teal-50/40 dark:hover:bg-teal-900/10 transition-colors'}
                emptyMessage={
                    <div className="flex flex-col items-center py-16 gap-3" style={{ color: 'var(--text-muted)' }}>
                        <span className="text-4xl">🐛</span>
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No issues reported</p>
                    </div>
                }
                pt={{
                    header: { className: 'pms-dt-header' },
                    headerRow: { className: 'pms-dt-header-row' },
                    bodyRow: { className: 'pms-dt-row' },
                    column: { bodyCell: { className: 'pms-dt-cell' }, headerCell: { className: 'pms-dt-head-cell' } },
                }}
                className="pms-datatable"
                style={{ fontSize: 13 }}
            >

                <Column
                    field="public_id"
                    header="ID"
                    sortable
                    style={{ width: '90px', minWidth: '80px' }}
                    body={(r) => (
                        <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background: `${TEAL}18`, color: TEAL }}>
                            {r.public_id ?? `ISS-${r.id}`}
                        </span>
                    )}
                />

                <Column
                    field="bug_name"
                    header="Bug Name"
                    sortable
                    style={{ minWidth: '200px' }}
                    body={(r) => (
                        <InlineEditCell
                            value={r.bug_name}
                            onSave={(val) => handleInlineUpdate(r, 'bug_name', val)}
                            renderValue={(val) => (
                                <span className="text-[13px] font-semibold block truncate max-w-[200px] sm:max-w-[400px]"
                                    style={{ color: 'var(--text-primary)' }}
                                    title={val}>
                                    {val}
                                </span>
                            )}
                        />
                    )}
                />

                <Column
                    field="reporter"
                    header="Reporter"
                    style={{ minWidth: '140px' }}
                    body={(r) => <PersonCell person={r.reporter} />}
                />

                <Column
                    field="created_at"
                    header="Created"
                    sortable
                    style={{ width: '120px', minWidth: '110px' }}
                    body={(r) => <DateCell date={r.created_at} />}
                />

                <Column
                    field="status"
                    header="Status"
                    sortable
                    style={{ width: '120px', minWidth: '110px' }}
                    body={(r) => (
                        <InlineSelectCell
                            value={r.status_master?.id ?? r.status_id}
                            options={statuses}
                            optionLabel="label"
                            optionValue="id"
                            onSave={(val) => handleInlineUpdate(r, 'status_id', val)}
                            renderValue={() => <StatusBadge status={r.status_master ?? r.status} />}
                        />
                    )}
                />

                <Column
                    field="tags"
                    header="Tags"
                    style={{ minWidth: '100px' }}
                    body={(r) => {
                        if (!r.tags) return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>;
                        return (
                            <div className="flex flex-wrap gap-1 max-w-[120px] overflow-hidden whitespace-nowrap">
                                {String(r.tags).split(',').slice(0, 2).map((t: string, i: number) => (
                                    <span key={i} className="text-[10px] font-semibold px-1.5 py-0.5 rounded truncate max-w-[50px]"
                                        style={{ background: '#e0f2fe', color: '#0369a1' }}
                                        title={t.trim()}>
                                        {t.trim()}
                                    </span>
                                ))}
                            </div>
                        );
                    }}
                />

                <Column
                    field="assignee"
                    header="Assignee"
                    style={{ minWidth: '140px' }}
                    body={(r) => <PersonCell person={r.assignees?.[0] ?? r.assignee} />}
                />

                <Column
                    field="due_date"
                    header="Due Date"
                    sortable
                    style={{ width: '115px', minWidth: '105px' }}
                    body={(r) => <DateCell date={r.due_date} warn />}
                />

                <Column
                    field="severity"
                    header="Severity"
                    sortable
                    style={{ width: '100px', minWidth: '90px' }}
                    body={(r) => (
                        <InlineSelectCell
                            value={r.severity_master?.id ?? r.severity_id}
                            options={severities}
                            optionLabel="label"
                            optionValue="id"
                            onSave={(val) => handleInlineUpdate(r, 'severity_id', val)}
                            renderValue={() => <SeverityBadge severity={r.severity_master ?? r.severity} />}
                        />
                    )}
                />

                <Column
                    field="project"
                    header="Project"
                    style={{ minWidth: '130px' }}
                    body={(r) => (
                        <span className="text-[12px] font-medium truncate max-w-[180px] block"
                            style={{ color: TEAL }}
                            title={r.project?.name ?? r.project?.project_name ?? ''}>
                            {r.project?.name ?? r.project?.project_name ?? '—'}
                        </span>
                    )}
                />
            </DataTable>
        </div>
    );
}
