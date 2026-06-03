import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Avatar } from 'primereact/avatar';
import { Button } from '@/components/forms/Button';
import { format, parseISO, isValid } from 'date-fns';
import { TimeLog } from '../../api/timelogs.api';
import { Pencil, MoreVertical, Trash2, Plus, FileText, Briefcase, User as UserIcon, Clock } from 'lucide-react';
import { ConfirmationModal } from '@/components/core/ConfirmationModal';

interface TimeLogTableProps {
    timelogs: TimeLog[];
    onDelete: (id: number) => void;
    onEdit?: (log: TimeLog) => void;
}

const ZOHO_TEAL = '#0CD1C3';
const ZOHO_ORANGE = '#f97316';

const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');
function fmtHHMM(hours: number) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${pad(h)}:${pad(m)}`;
}

function fmtDate(date?: string | null) {
    if (!date) return '—';
    try {
        const d = parseISO(date);
        return isValid(d) ? format(d, 'MM-dd-yyyy') : date;
    } catch { return date; }
}

function UserAvatar({ user, size = '24px' }: { user?: any, size?: string }) {
    if (!user) return <div style={{ width: size, height: size }} className="rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><UserIcon size={12} className="text-slate-400" /></div>;

    const name = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.display_name || 'User';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);


    const colors = [
        'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #0CD1C3 0%, #6366f1 100%)'
    ];
    const colorIdx = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % colors.length;

    return (
        <div className="flex items-center gap-2 group/avatar">
            <Avatar
                label={initials}
                shape="circle"
                style={{
                    width: size, height: size, fontSize: '10px', fontWeight: 700,
                    background: colors[colorIdx], color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.2)'
                }}
            />
            <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 group-hover/avatar:text-brand-teal-500 transition-colors">
                {name}
            </span>
        </div>
    );
}

function BillingBadge({ type }: { type?: string }) {
    const isBillable = type === 'Billable' || !type;
    const isInternal = type === 'Internal';

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${isBillable
            ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30'
            : isInternal
                ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/30'
                : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
            }`}>
            {type || 'Billable'}
        </span>
    );
}

function ActionMenu({ entry, onEdit, onDelete }: {
    entry: TimeLog;
    onEdit?: (log: TimeLog) => void;
    onDelete: (id: number) => void;
}) {

    return (
        <div className="flex items-center justify-end gap-1">
            {onEdit && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(entry)}
                    className="!w-7 !h-7 !p-0 text-slate-400 hover:text-brand-teal-500 hover:bg-brand-teal-50 dark:hover:bg-brand-teal-900/20 rounded-lg transition-all"
                    title="Edit Entry"
                >
                    <Pencil size={13} />
                </Button>
            )}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(entry.id)}
                className="!w-7 !h-7 !p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                title="Delete Entry"
            >
                <Trash2 size={13} />
            </Button>
        </div>
    );
}

export function TimeLogTable({ timelogs, onDelete, onEdit }: TimeLogTableProps) {
    const navigate = useNavigate();
    const [expandedGroups, setExpandedGroups] = useState<any[]>([]);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    useEffect(() => {
        const seen = new Set<string>();
        const firstRows: any[] = [];
        timelogs.forEach(l => {
            if (l.date && !seen.has(l.date)) { seen.add(l.date); firstRows.push(l); }
        });
        setExpandedGroups(firstRows);
    }, [timelogs]);


    const sorted = useMemo(() =>
        [...timelogs].sort((a, b) => {
            const da = a.date ?? '';
            const db = b.date ?? '';
            return db.localeCompare(da);
        }),
        [timelogs]);


    const totals = useMemo(() => {
        const billable = timelogs.filter(l => l.billing_type !== 'Non-Billable').reduce((s, l) => s + Number(l.daily_log_hours ?? 0), 0);
        const nonBillable = timelogs.filter(l => l.billing_type === 'Non-Billable').reduce((s, l) => s + Number(l.daily_log_hours ?? 0), 0);
        return { billable, nonBillable, total: billable + nonBillable, count: timelogs.length };
    }, [timelogs]);

    const groupHeaderTemplate = (data: any) => {
        const dateStr = (data as TimeLog).date ?? '';
        const dateLabel = fmtDate(dateStr);
        const dayTotal = sorted
            .filter(l => l.date === dateStr)
            .reduce((s, l) => s + Number(l.daily_log_hours ?? 0), 0);

        return (
            <span className="inline-flex items-center gap-6 py-2 px-2 select-none cursor-pointer">
                <span className="text-[13px] font-bold text-slate-900 dark:text-slate-100">
                    {dateLabel}
                </span>
                <span className="flex items-center gap-1.5">
                    <Clock size={12} className="text-brand-teal-500" />
                    <span className="text-[13px] font-black tabular-nums text-slate-900 dark:text-slate-100">
                        {fmtHHMM(dayTotal)}
                    </span>
                    <span className="text-[11px] font-bold text-brand-teal-500 uppercase ml-0.5">hrs</span>
                </span>
            </span>
        );
    };

    const isGrouped = true;

    return (
        <div className="w-full flex flex-col h-full bg-theme-surface">
            { }
            <div className="flex-1 overflow-auto custom-scrollbar">
                <DataTable
                    value={sorted}
                    dataKey="id"
                    showGridlines={false}
                    stripedRows={false}
                    resizableColumns
                    columnResizeMode="fit"
                    scrollable
                    scrollHeight="flex"
                    size="small"
                    {...(isGrouped ? {
                        rowGroupMode: 'subheader' as const,
                        groupRowsBy: 'date',
                        expandableRowGroups: true,
                        expandedRows: expandedGroups,
                        onRowToggle: (e: any) => setExpandedGroups(e.data),
                        rowGroupHeaderTemplate: groupHeaderTemplate,
                        sortMode: 'single' as const,
                        sortField: 'date',
                        sortOrder: -1 as const,
                    } : {})}
                    rowClassName={() => 'group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all border-b border-slate-100/50 dark:border-slate-800/30'}
                    emptyMessage={
                        <div className="flex flex-col items-center py-24 gap-4">
                            <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                                <Clock className="w-8 h-8 text-slate-300" />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-slate-900 dark:text-slate-100">No time logs found</p>
                                <p className="text-sm text-slate-500">Try adjusting your filters or add a new entry.</p>
                            </div>
                        </div>
                    }
                    style={{ fontSize: 13 }}
                    pt={{
                        headerRow: { className: 'bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800' },
                        rowGroupHeader: {
                            className: 'bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800'
                        },
                        rowGroupHeaderName: { className: 'inline-flex items-center' },
                        rowGroupToggler: {
                            className: 'w-7 h-7 ml-3 rounded-lg flex items-center justify-center text-slate-400 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all border-none shadow-none focus:ring-0',
                            style: { background: 'transparent' }
                        }
                    }}
                >
                    { }
                    <Column
                        field="id"
                        header="ID"
                        style={{ width: '80px', minWidth: '80px' }}
                        headerClassName="text-[12px] font-bold text-slate-500 uppercase py-3 px-4"
                        body={(r) => (
                            <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
                                {r.public_id || `TL-${r.id}`}
                            </span>
                        )}
                    />

                    { }
                    <Column
                        field="log_title"
                        header="Log Title"
                        style={{ minWidth: '220px' }}
                        headerClassName="text-[12px] font-bold text-slate-500 uppercase py-3 px-4"
                        body={(r) => (
                            <div className="flex items-start gap-3 py-1">
                                <div className="mt-1 w-6 h-6 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center flex-shrink-0 border border-teal-100/50 dark:border-teal-800/30 text-teal-600">
                                    <FileText size={12} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[13px] font-bold text-slate-900 dark:text-slate-100 truncate max-w-[150px] sm:max-w-[200px] line-clamp-1 leading-tight"
                                        title={r.log_title || r.task?.task_name || r.issue?.title || 'Untitled Entry'}>
                                        {r.log_title || r.task?.task_name || r.issue?.title || 'Untitled Entry'}
                                    </p>
                                    {r.task?.task_name && r.log_title && (
                                        <p className="text-[11px] font-medium text-slate-500 mt-0.5 flex items-center gap-1">
                                            <span className="px-1 py-px rounded bg-slate-100 dark:bg-slate-800 text-[9px] uppercase">Task</span> {r.task.task_name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    />

                    { }
                    <Column
                        field="project"
                        header="Project"
                        style={{ minWidth: '180px' }}
                        headerClassName="text-[12px] font-bold text-slate-500 uppercase py-3 px-4"
                        body={(r) => {
                            const name = r.project?.project_name || r.task?.project?.project_name;
                            if (!name) return <span className="text-slate-400 italic text-[12px] pl-6">No project</span>;
                            return (
                                <div className="flex items-center gap-2.5">
                                    <div className="w-5 h-5 rounded flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
                                        <Briefcase size={10} />
                                    </div>
                                    <span className="text-[13px] font-bold text-brand-teal-500 hover:text-brand-teal-600 cursor-pointer truncate max-w-[160px] transition-colors">
                                        {name}
                                    </span>
                                </div>
                            );
                        }}
                    />

                    { }
                    <Column
                        field="daily_log_hours"
                        header="Hours"
                        style={{ width: '120px', minWidth: '120px' }}
                        headerClassName="text-[12px] font-bold text-slate-500 uppercase py-3 px-4"
                        body={(r) => (
                            <div className="flex items-center gap-2">
                                <span className="text-[14px] font-black tabular-nums text-slate-900 dark:text-slate-100">
                                    {fmtHHMM(Number(r.daily_log_hours ?? 0))}
                                </span>
                                <div className="h-3 w-[1px] bg-slate-200 dark:bg-slate-700 mx-0.5" />
                                <span className="text-[11px] font-bold text-slate-400 tabular-nums uppercase">
                                    {fmtHHMM(Number(r.daily_log_hours ?? 0))}
                                </span>
                            </div>
                        )}
                    />

                    { }
                    <Column
                        field="user"
                        header="User"
                        style={{ minWidth: '160px' }}
                        headerClassName="text-[12px] font-bold text-slate-500 uppercase py-3 px-4"
                        body={(r) => <UserAvatar user={r.user} />}
                    />

                    { }
                    <Column
                        field="billing_type"
                        header="Billing"
                        style={{ width: '110px', minWidth: '110px' }}
                        headerClassName="text-[12px] font-bold text-slate-500 uppercase py-3 px-4"
                        body={(r) => <BillingBadge type={r.billing_type} />}
                    />

                    { }
                    <Column
                        field="notes"
                        header="Notes"
                        style={{ minWidth: '180px' }}
                        headerClassName="text-[12px] font-bold text-slate-500 uppercase py-3 px-4"
                        body={(r) => (
                            <p className="text-[12px] text-slate-500 italic truncate max-w-[200px] leading-relaxed line-clamp-1" title={r.notes}>
                                {r.notes || '—'}
                            </p>
                        )}
                    />

                    { }
                    <Column
                        header="Actions"
                        headerClassName="text-[12px] font-bold text-slate-500 uppercase py-3 px-4"
                        style={{ width: '100px' }}
                        bodyClassName="py-2"
                        body={(r) => <ActionMenu entry={r} onEdit={onEdit} onDelete={setDeleteId} />}
                    />
                </DataTable>
            </div>

            { }
            <div className="flex-shrink-0 flex items-center justify-between px-8 py-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-10">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                            <FileText size={18} className="text-slate-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Entries</span>
                            <span className="text-[18px] font-black text-slate-900 dark:text-slate-100 tabular-nums leading-none">{totals.count}</span>
                        </div>
                    </div>

                    <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800" />

                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-brand-teal-500/80 uppercase tracking-widest mb-1.5 leading-none">Billable Time</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-[18px] font-black text-slate-900 dark:text-slate-100 tabular-nums leading-none">{fmtHHMM(totals.billable)}</span>
                            <span className="text-[11px] font-bold text-brand-teal-500 uppercase">Hrs</span>
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Non-Billable</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-[18px] font-black text-slate-600 dark:text-slate-400 tabular-nums leading-none">{fmtHHMM(totals.nonBillable)}</span>
                            <span className="text-[11px] font-bold text-slate-400 uppercase">Hrs</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-2 pr-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                    <div className="w-10 h-10 rounded-xl bg-brand-teal-500 text-white flex items-center justify-center shadow-lg shadow-brand-teal-500/20">
                        <Clock size={20} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Total Logged Time</span>
                        <span className="text-[22px] font-black tabular-nums leading-none text-slate-900 dark:text-brand-teal-400">
                            {fmtHHMM(totals.total)} <span className="text-[12px] text-slate-400 font-bold ml-0.5">HRS</span>
                        </span>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                visible={!!deleteId}
                onHide={() => setDeleteId(null)}
                onConfirm={() => {
                    if (deleteId) {
                        onDelete(deleteId);
                        setDeleteId(null);
                    }
                }}
                title="Delete Time Log"
                message="Are you sure you want to delete this time log? This action cannot be undone."
                confirmLabel="Delete Time Log"
                variant="danger"
            />
        </div>
    );
}
