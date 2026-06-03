import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { Avatar } from 'primereact/avatar';
import { Tooltip } from 'primereact/tooltip';
import { format, parseISO, isPast, isValid } from 'date-fns';
import { FilterMatchMode } from 'primereact/api';
import { Project } from '@/features/projects/api/projects.api';
import { statusStr } from '@/utils/statusHelpers';
import { calculateDaysLeft } from '@/utils/dateHelpers';
import { useUpdateProject } from '@/features/projects/hooks/useProjects';
import { useMasterLookups } from '@/features/masters/hooks/useMasters';
import { InlineEditCell } from '@/components/forms/InlineEditCell';
import { InlineSelectCell } from '@/components/forms/InlineSelectCell';
interface ProjectListTableProps {
    projects: Project[];
    loading?: boolean;
    onValueChange?: (data: Project[]) => void;
    lazy?: boolean;
    paginator?: boolean;
    totalRecords?: number;
    onPage?: (event: any) => void;
    first?: number;
    rows?: number;
}

const TEAL = 'hsl(160 60% 45%)';

function PriorityBadge({ priority }: { priority: any }) {
    const label = typeof priority === 'string' ? priority : (priority?.label ?? priority?.name ?? '—');
    const color = typeof priority === 'object' ? priority?.color : undefined;
    
    return (
        <span
            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
            style={{ 
                background: color ? `${color}18` : 'var(--bg-secondary)', 
                color: color ?? 'var(--text-secondary)',
                border: color ? `1px solid ${color}33` : '1px solid var(--border-color)'
            }}
        >
            {label}
        </span>
    );
}

function StatusBadge({ status }: { status: any }) {
    const label = typeof status === 'string' ? status : (status?.label ?? status?.name ?? '—');
    const color = typeof status === 'object' ? status?.color : undefined;
    
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap"
            style={{ 
                background: color ? `${color}18` : 'var(--bg-secondary)', 
                color: color ?? 'var(--text-secondary)',
                border: color ? `1px solid ${color}33` : '1px solid var(--border-color)'
            }}
        >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color ?? 'var(--text-muted)' }} />
            {label}
        </span>
    );
}

function OwnerAvatar({ owner }: { owner?: any }) {
    if (!owner) return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>;

    const initials = (owner.first_name?.[0] ?? owner.displayName?.[0] ?? owner.email?.[0] ?? owner.mail?.[0] ?? '').toUpperCase();
    const name = owner.displayName || [owner.first_name, owner.last_name].filter(Boolean).join(' ') || owner.email || owner.mail || 'Unknown';

    return (
        <div className="flex items-center gap-2">
            <Avatar
                label={initials || '?'}
                size="normal"
                shape="circle"
                style={{
                    width: 26, height: 26, fontSize: 10, fontWeight: 700,
                    background: 'linear-gradient(135deg,#0CD1C3,#6366f1)', color: '#fff',
                    flexShrink: 0,
                }}
            />
            <span className="text-[12px] font-medium truncate max-w-[110px]"
                style={{ color: 'var(--text-primary)' }}>
                {name}
            </span>
        </div>
    );
}

function CountBadge({ count, total, color }: { count: number; total?: number; color: string }) {
    if (total != null && total > 0) {
        const pct = Math.round((count / total) * 100);
        return (
            <div className="flex items-center gap-2 min-w-[80px]">
                <span className="text-[12px] font-bold tabular-nums w-5 text-right"
                    style={{ color }}>
                    {count}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: color }} />
                </div>
            </div>
        );
    }
    return (
        <span className="text-[12px] font-semibold tabular-nums" style={{ color: count > 0 ? color : 'var(--text-muted)' }}>
            {count}
        </span>
    );
}

function DateCell({ date, warnIfPast, status, showDaysLeft, isStart }: { date?: string | null; warnIfPast?: boolean; status?: string | null; showDaysLeft?: boolean; isStart?: boolean }) {
    if (!date) return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>;
    try {
        const d = parseISO(date);
        if (!isValid(d)) return <span style={{ fontSize: 12 }}>{date}</span>;

        const diffDays = calculateDaysLeft(date) ?? 0;
        const isCompleted = ['completed', 'closed', 'cancelled'].includes((status || '').toLowerCase());

        const overdue = warnIfPast && diffDays < 0 && !isCompleted;

        const startsInFuture = isStart && diffDays > 0 && !isCompleted;

        const alreadyStarted = isStart && diffDays < 0 && !isCompleted;

        return (
            <div>
                <span className="text-[12px] font-semibold"
                    style={{ color: overdue ? '#ef4444' : 'var(--text-primary)' }}>
                    {format(d, 'dd MMM yyyy')}
                </span>
                {overdue && (
                    <span className="block text-[10px] font-bold" style={{ color: '#ef4444' }}>
                        ({Math.abs(diffDays)} {Math.abs(diffDays) === 1 ? 'day' : 'days'} overdue)
                    </span>
                )}
                {showDaysLeft && !overdue && !isCompleted && diffDays >= 0 && (
                    <span className="block text-[10px] font-bold" style={{ color: diffDays <= 7 ? '#f59e0b' : '#10b981' }}>
                        {diffDays === 0 ? '(Due today)' : `(${diffDays} days left)`}
                    </span>
                )}
                {startsInFuture && (
                    <span className="block text-[10px] font-bold" style={{ color: '#3b82f6' }}>
                        (Starts in {diffDays} days)
                    </span>
                )}
                {alreadyStarted && (
                    <span className="block text-[10px] font-bold" style={{ color: '#6366f1' }}>
                        (Started {Math.abs(diffDays)} days ago)
                    </span>
                )}
                {isStart && diffDays === 0 && !isCompleted && (
                    <span className="block text-[10px] font-bold" style={{ color: '#3b82f6' }}>
                        (Starts today)
                    </span>
                )}
            </div>
        );
    } catch {
        return <span style={{ fontSize: 12 }}>{date}</span>;
    }
}

export function ProjectListTable({ 
    projects, loading, onValueChange,
    lazy, paginator, totalRecords, onPage, first, rows
}: ProjectListTableProps) {
    const navigate = useNavigate();
    const { mutate: updateProject } = useUpdateProject();
    const { data: statusesData } = useMasterLookups('ProjectStatus');
    const { data: prioritiesData } = useMasterLookups('TaskPriority');
    const statuses = Array.isArray(statusesData) ? statusesData : (statusesData as any)?.items || [];
    const priorities = Array.isArray(prioritiesData) ? prioritiesData : (prioritiesData as any)?.items || [];

    const handleInlineUpdate = (project: any, field: string, value: any) => {
        const data: any = {};
        
        if (field === 'project_name') {
            data.project_name = value;
            project.project_name = value;
        }
        if (field === 'status_id') {
            data.status_id = value;
            project.status_id = value;
            if (project.status_master) {
                const matched = statuses.find((s: any) => s.id === value);
                if (matched) project.status_master = matched;
            }
        }
        if (field === 'priority_id') {
            data.priority_id = value;
            project.priority_id = value;
            if (project.priority_master) {
                const matched = priorities.find((p: any) => p.id === value);
                if (matched) project.priority_master = matched;
            }
        }
        
        updateProject({
            id: project.id,
            data
        });
    };

    return (
        <div className="w-full h-full overflow-hidden flex flex-col relative">
            <div className="flex-1 min-h-0">
            <DataTable
                value={projects}
                loading={loading}
                dataKey="id"
                showGridlines
                stripedRows
                resizableColumns
                columnResizeMode="fit"
                scrollable
                lazy={lazy}
                paginator={paginator}
                totalRecords={totalRecords}
                onPage={onPage}
                first={first}
                rows={rows ?? 20}
                onValueChange={(e) => {
                    onValueChange?.(e as Project[]);
                }}
                scrollHeight="flex"
                size="small"
                onRowClick={(e) => {
                    const target = e.originalEvent?.target as HTMLElement;
                    if (target?.closest('input') || target?.closest('.p-dropdown') || target?.closest('button') || target?.closest('.p-dropdown-panel')) {
                        return;
                    }
                    navigate(`/projects/${(e.data as any).id}`);
                }}
                rowClassName={() => 'hover:bg-teal-50/40 dark:hover:bg-teal-900/10 transition-colors'}
                emptyMessage={
                    <div className="flex flex-col items-center py-16 gap-3" style={{ color: 'var(--text-muted)' }}>
                        <span className="text-4xl">📁</span>
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No projects found</p>
                    </div>
                }
                pt={{
                    header: { className: 'pms-dt-header' },
                    headerRow: { className: 'pms-dt-header-row' },
                    bodyRow: { className: 'pms-dt-row' },
                    column: { bodyCell: { className: 'pms-dt-cell' }, headerCell: { className: 'pms-dt-head-cell' } },
                }}
                style={{ fontSize: 13 }}
            >
                { }
                <Column
                    field="public_id"
                    header="ID"
                    sortable
                    style={{ width: '90px', minWidth: '80px' }}
                    body={(r) => (
                        <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background: `${TEAL}18`, color: TEAL }}>
                            {r.public_id || `PRJ-${r.id}`}
                        </span>
                    )}
                />

                <Column
                    field="project_name"
                    header="Project Name"
                    sortable
                    style={{ minWidth: '200px' }}
                    body={(r) => (
                        <InlineEditCell
                            value={r.project_name || r.name}
                            onSave={(val) => handleInlineUpdate(r, 'project_name', val)}
                            renderValue={(val) => (
                                <div>
                                    <p className="text-[13px] font-semibold truncate max-w-[200px] sm:max-w-[300px]"
                                        style={{ color: TEAL }}
                                        title={val}>
                                        {val}
                                    </p>
                                    {r.client_name && (
                                        <p className="text-[11px] mt-0.5 truncate max-w-[150px]" style={{ color: 'var(--text-muted)' }} title={r.client_name}>
                                            {r.client_name}
                                        </p>
                                    )}
                                </div>
                            )}
                        />
                    )}
                />

                { }
                <Column
                    field="completion_percentage"
                    header="%"
                    sortable
                    style={{ width: '100px', minWidth: '90px' }}
                    body={(r) => {
                        const pct = r.completion_percentage ?? 0;
                        return (
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold tabular-nums w-7"
                                    style={{ color: TEAL }}>
                                    {pct}%
                                </span>
                                <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                    <div className="h-full rounded-full transition-all"
                                        style={{ width: `${pct}%`, background: pct >= 100 ? '#22c55e' : TEAL }} />
                                </div>
                            </div>
                        );
                    }}
                />

                { }
                <Column
                    field="owner"
                    header="Project Owner"
                    style={{ minWidth: '150px' }}
                    body={(r) => <OwnerAvatar owner={r.owner || r.project_manager} />}
                />

                { }
                <Column
                    field="status"
                    header="Status"
                    sortable
                    style={{ width: '130px', minWidth: '110px' }}
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
                    field="priority"
                    header="Priority"
                    sortable
                    style={{ width: '110px', minWidth: '90px' }}
                    body={(r) => (
                        <InlineSelectCell
                            value={r.priority_master?.id ?? r.priority_id}
                            options={priorities}
                            optionLabel="label"
                            optionValue="id"
                            onSave={(val) => handleInlineUpdate(r, 'priority_id', val)}
                            renderValue={() => <PriorityBadge priority={r.priority_master ?? r.priority} />}
                        />
                    )}
                />


                { }
                <Column
                    header="Tasks"
                    style={{ width: '110px', minWidth: '100px' }}
                    body={(r) => {
                        return <CountBadge count={r.task_count || 0} color={TEAL} />;
                    }}
                />

                { }
                <Column
                    header="Milestones"
                    style={{ width: '100px', minWidth: '90px' }}
                    body={(r) => {
                        return <CountBadge count={r.milestone_count || 0} color="#8b5cf6" />;
                    }}
                />

                { }
                <Column
                    header="Bugs"
                    style={{ width: '80px', minWidth: '70px' }}
                    body={(r) => {
                        return <CountBadge count={r.issue_count || 0} color="#ef4444" />;
                    }}
                />

                { }
                <Column
                    field="expected_start_date"
                    header="Start Date"
                    sortable
                    style={{ width: '120px', minWidth: '110px' }}
                    body={(r) => {
                        const statusLabel = r.status_master?.label || r.status_master?.name || r.status?.label || r.status?.name || r.status;
                        return <DateCell date={r.expected_start_date || r.start_date} isStart status={typeof statusLabel === 'string' ? statusLabel : undefined} />;
                    }}
                />

                { }
                <Column
                    field="expected_end_date"
                    header="End Date"
                    sortable
                    style={{ width: '130px', minWidth: '110px' }}
                    body={(r) => {
                        const statusLabel = r.status_master?.label || r.status_master?.name || r.status?.label || r.status?.name || r.status;
                        return <DateCell date={r.expected_end_date || r.end_date} warnIfPast showDaysLeft status={typeof statusLabel === 'string' ? statusLabel : undefined} />;
                    }}
                />

                { }
                <Column
                    field="tags"
                    header="Tags"
                    style={{ minWidth: '100px' }}
                    body={(r) => {
                        if (!r.tags) return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No tags</span>;
                        return (
                            <div className="flex flex-wrap gap-1 max-w-[140px] overflow-hidden whitespace-nowrap">
                                {String(r.tags).split(',').slice(0, 3).map((t: string, i: number) => (
                                    <span key={i}
                                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded truncate max-w-[60px]"
                                        style={{ background: '#e0f2fe', color: '#0369a1' }}
                                        title={t.trim()}>
                                        {t.trim()}
                                    </span>
                                ))}
                            </div>
                        );
                    }}
                />
            </DataTable>
            </div>
        </div>
    );
}
