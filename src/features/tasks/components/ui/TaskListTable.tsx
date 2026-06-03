import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressBar } from 'primereact/progressbar';
import { Avatar } from 'primereact/avatar';
import { format, parseISO, isPast, isValid } from 'date-fns';
import { Task } from '@/api/services/tasks.service';

interface TaskListTableProps {
    tasks: Task[];
    onRowClick?: (task: Task) => void;
    loading?: boolean;
    projectId?: number;
    timelogs?: any[];
    groupBy?: 'none' | 'project' | 'tasklist';
    onTaskListRenamed?: () => void;
    taskLists?: any[];
    canRename?: boolean;
    onValueChange?: (data: Task[]) => void;
    lazy?: boolean;
    paginator?: boolean;
    totalRecords?: number;
    onPage?: (event: any) => void;
    first?: number;
    rows?: number;
}

const TEAL = 'hsl(160 60% 45%)';

function PriorityBadge({ priority }: { priority?: any }) {
    const label = typeof priority === 'string' ? priority : (priority?.label ?? priority?.name ?? '—');
    const color = typeof priority === 'object' ? priority?.color : undefined;

    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
            style={{
                background: color ? `${color}18` : 'var(--bg-secondary)',
                color: color ?? 'var(--text-secondary)',
                border: color ? `1px solid ${color}33` : '1px solid var(--border-color)'
            }}>
            {label}
        </span>
    );
}

function OwnerCell({ owner }: { owner?: any }) {
    if (!owner) return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>;

    if (typeof owner === 'string') {
        return <span className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>{owner}</span>;
    }

    const firstName = owner.first_name || '';
    const lastName = owner.last_name || '';
    const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
    const name = `${firstName} ${lastName}`.trim() || owner.username || 'User';

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

function DateCell({ date, warn }: { date?: any; warn?: boolean }) {
    if (!date) return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>;

    if (typeof date !== 'string') {
        const dStr = date?.toString?.() || String(date);
        return <span style={{ fontSize: 12 }}>{dStr}</span>;
    }

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

function StatusCell({ status }: { status?: any }) {
    const label = typeof status === 'string' ? status : status?.label ?? '—';
    const color = typeof status === 'object' ? status?.color : undefined;

    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
            style={{
                background: color ? `${color}18` : `${TEAL}18`,
                color: color ?? TEAL,
                border: `1px solid ${color ?? TEAL}33`,
            }}>
            {label}
        </span>
    );
}

function DiffCell({ workHours, timelogTotal }: { workHours?: number; timelogTotal?: number }) {
    const p = Number(workHours ?? 0);
    const t = Number(timelogTotal ?? 0);
    const diff = p - t;
    const isOver = diff < 0;
    return (
        <span className="text-[12px] font-bold tabular-nums"
            style={{ color: isOver ? '#ef4444' : '#22c55e' }}>
            {isOver ? '−' : '+'}{Math.abs(diff).toFixed(1)}h
        </span>
    );
}

import { tasklistsService } from '@/api/services/tasklists.service';
import { useToast } from '@/providers/ToastContext';
import { InputText } from 'primereact/inputtext';
import { Pencil, Trash2 } from 'lucide-react';
import { useDeleteTask, useUpdateTask } from '@/features/tasks/hooks/useTasks';
import { useTaskListActions } from '@/features/tasklists/hooks/useTaskListActions';
import { confirmDialog } from 'primereact/confirmdialog';
import { Tooltip } from 'primereact/tooltip';
import { Button } from '@/components/forms/Button';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { useMasterLookups } from '@/features/masters/hooks/useMasters';
import { FilterMatchMode } from 'primereact/api';
import { InlineEditCell } from '@/components/forms/InlineEditCell';
import { InlineSelectCell } from '@/components/forms/InlineSelectCell';

export function TaskListTable({
    tasks, onRowClick, loading, groupBy, onTaskListRenamed,
    taskLists, canRename, onValueChange,
    lazy, paginator, totalRecords, onPage, first, rows
}: TaskListTableProps) {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { mutate: deleteTask } = useDeleteTask();
    const { updateTaskList } = useTaskListActions();
    const [expandedGroups, setExpandedGroups] = useState<any[]>([]);
    const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
    const [editingValue, setEditingValue] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [multiSortMeta, setMultiSortMeta] = useState<any[]>(
        (groupBy && groupBy !== 'none' && !lazy) ? [{ field: '_group_identity', order: 1 }] : []
    );
    const dt = React.useRef<any>(null);
    const { mutate: updateTask } = useUpdateTask();
    const { data: statusesData } = useMasterLookups('TaskStatus');
    const { data: prioritiesData } = useMasterLookups('TaskPriority');
    const statuses = Array.isArray(statusesData) ? statusesData : (statusesData as any)?.items || [];
    const priorities = Array.isArray(prioritiesData) ? prioritiesData : (prioritiesData as any)?.items || [];

    const onCellEditComplete = (e: any) => {
        let { rowData, newValue, field } = e;
        if (rowData._isDummy) return;

        if (newValue !== undefined) {
            rowData[field] = newValue;
        }

        updateTask({
            id: rowData.id,
            data: {
                task_name: rowData.task_name,
                status_id: rowData.status_master?.id ?? rowData.status_id,
                priority_id: rowData.priority_master?.id ?? rowData.priority_id,
                estimated_hours: rowData.estimated_hours
            }
        });
    };

    const handleInlineUpdate = (task: any, field: string, value: any) => {
        if (task._isDummy) return;
        const data: any = {};
        
        // Optimistically update the local row data so the UI reflects immediately
        if (field === 'task_name') {
            data.task_name = value;
            task.task_name = value;
        }
        if (field === 'status_id') {
            data.status_id = value;
            task.status_id = value;
            if (task.status_master) {
                const matched = statuses.find((s: any) => s.id === value);
                if (matched) task.status_master = matched;
            }
        }
        if (field === 'priority_id') {
            data.priority_id = value;
            task.priority_id = value;
            if (task.priority_master) {
                const matched = priorities.find((p: any) => p.id === value);
                if (matched) task.priority_master = matched;
            }
        }
        
        updateTask({
            id: task.id,
            data
        });
    };



    const isGrouped = !!(groupBy && groupBy !== 'none') && !lazy;

    useEffect(() => {
        if (isGrouped) {
            setMultiSortMeta([{ field: '_group_identity', order: 1 }]);
        } else {
            setMultiSortMeta([]);
        }
    }, [isGrouped, groupBy, lazy]);

    const handleSort = (e: any) => {
        let meta = [...(e.multiSortMeta || [])];
        if (isGrouped) {
            const groupSort = meta.find(s => s.field === '_group_identity') || { field: '_group_identity', order: 1 };
            meta = [groupSort, ...meta.filter(s => s.field !== '_group_identity')];
        }
        setMultiSortMeta(meta);
    };



    const onEditorSubmit = async (e: any) => {
        const { value, props: { id } } = e;
        if (value && value.trim()) {
            try {
                await updateTaskList.mutateAsync({ id, data: { name: value } });
                if (onTaskListRenamed) onTaskListRenamed();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const sortedTasks = useMemo(() => {
        if (!groupBy || groupBy === 'none' || lazy) {
            return [...tasks];
        }

        const normalize = (name: string) => {
            return String(name || '')
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
                .trim();
        };

        const generalIdentity = "ZZZ_GENERAL";

        const groupMap = new Map<string, { name: string; id: number | null; tasks: any[] }>();

        if (groupBy === 'tasklist' && taskLists && taskLists.length > 0) {
            taskLists.forEach(tl => {
                const gn = tl.name || 'General';
                const norm = normalize(gn);
                const identity = (norm === 'GENERAL' || !norm) ? generalIdentity : `AAA_GROUP_${norm}`;

                if (!groupMap.has(identity)) {
                    groupMap.set(identity, { name: gn.trim(), id: tl.id, tasks: [] });
                }
            });
        }

        tasks.forEach(t => {
            let groupName = 'General';
            let groupId: number | null = null;
            let identity = generalIdentity;

            if (groupBy === 'project') {
                const proj = (t as any).project;
                groupName = proj?.project_name || 'Independent Tasks';
                groupId = proj?.id || 0;
                identity = `AAA_PROJ_${normalize(groupName) || groupId}`;
            } else {
                const rawTl = (t as any).task_list;
                const tlId = (t as any).task_list_id || (rawTl && typeof rawTl === 'object' ? rawTl.id : null);
                const normalizedTlId = (tlId && !isNaN(Number(tlId))) ? Number(tlId) : null;

                let gn = 'General';
                if (typeof rawTl === 'string' && rawTl.trim()) {
                    gn = rawTl;
                } else if (rawTl && typeof rawTl === 'object' && rawTl.name) {
                    gn = rawTl.name;
                }

                if (normalizedTlId) {
                    const foundTl = taskLists?.find(tl => tl.id === normalizedTlId);
                    if (foundTl?.name) gn = foundTl.name;
                    groupId = normalizedTlId;
                }

                const norm = normalize(gn);
                if (norm === 'GENERAL' || !norm) {
                    identity = generalIdentity;
                    groupName = 'General';
                } else {
                    identity = `AAA_GROUP_${norm}`;
                    groupName = gn.trim();
                }
            }

            if (!groupMap.has(identity)) {
                groupMap.set(identity, { name: groupName, id: groupId, tasks: [] });
            }
            groupMap.get(identity)!.tasks.push(t);
        });
        const result: any[] = [];
        const sortedIdentities = Array.from(groupMap.keys()).sort();

        sortedIdentities.forEach(id => {
            const group = groupMap.get(id)!;
            if (group.tasks.length === 0) {
                result.push({
                    _uid: `dummy-${id}`,
                    _isDummy: true,
                    _group: group.name,
                    _group_identity: id,
                    _groupId: group.id,
                    task_name: '',
                    status_master: null,
                    priority_master: null
                });
            } else {
                group.tasks.forEach(t => {
                    result.push({
                        ...t,
                        _uid: `${t.id || Math.random()}-${id}`,
                        _group: group.name,
                        _group_identity: id,
                        _groupId: group.id
                    });
                });
            }
        });

        return result;
    }, [tasks, groupBy, taskLists, lazy]);

    useEffect(() => {
        if (!isGrouped) { setExpandedGroups([]); return; }
        const seen = new Set<string>();
        const firstRows: any[] = [];
        sortedTasks.forEach((t: any) => {
            if (t._group_identity && !seen.has(t._group_identity)) {
                seen.add(t._group_identity);
                firstRows.push(t);
            }
        });
        setExpandedGroups(firstRows);
    }, [sortedTasks, isGrouped]);

    const handleRowClick = (e: any) => {
        const target = e.originalEvent?.target as HTMLElement;
        if (target?.closest('input') || target?.closest('.p-dropdown') || target?.closest('button') || target?.closest('.p-dropdown-panel')) {
            return;
        }
        
        const task = e.data as Task;
        if (task._isDummy) return;
        if (onRowClick) onRowClick(task);
        else navigate(`/tasks/${task.id}`);
    };

    const headerTemplate = (data: any) => {
        let groupName = 'General';
        let groupId = null;

        if (data && typeof data === 'object') {
            if ('_group' in data) {
                groupName = data._group || 'General';
                groupId = data._groupId || null;
            } else if ('task_list' in data && data.task_list?.name) {
                groupName = data.task_list.name;
            }
        } else if (typeof data === 'string') {
            groupName = data;
        }

        const isEditing = groupBy === 'tasklist' && editingGroupId === groupId && groupId !== null;

        const handleRename = async () => {
            const newValue = editingValue.trim();
            if (!newValue || newValue === groupName) {
                setEditingGroupId(null);
                return;
            }

            const isDuplicate = taskLists?.some(
                (tl: any) => tl.name.toLowerCase().trim() === newValue.toLowerCase() && tl.id !== groupId
            );

            if (isDuplicate) {
                showToast('error', 'Duplicate Name', `A task list named "${newValue}" already exists.`);
                setEditingGroupId(null);
                return;
            }

            setIsSaving(true);
            try {
                await updateTaskList.mutateAsync({ id: groupId!, data: { name: newValue } });
                if (onTaskListRenamed) onTaskListRenamed();
                setEditingGroupId(null);
            } catch (err) {
            } finally {
                setIsSaving(false);
            }
        };

        return (
            <span className="inline-flex items-center gap-2 py-0.5 select-none cursor-pointer">
                {isEditing ? (
                    <InputText
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename();
                            if (e.key === 'Escape') setEditingGroupId(null);
                        }}
                        autoFocus
                        className="text-[12px] h-7 px-2 py-0 font-bold"
                        style={{ width: '180px' }}
                        disabled={isSaving}
                    />
                ) : (
                    <span
                        className={`text-[12px] font-bold tracking-tight truncate tasklist-header-name ${canRename && groupBy === 'tasklist' && groupId !== null ? 'hover:text-brand-teal-500 transition-colors' : ''}`}
                        style={{ color: 'var(--text-primary)', maxWidth: '300px' }}
                        onDoubleClick={() => {
                            if (canRename && groupBy === 'tasklist' && groupId !== null) {
                                setEditingGroupId(groupId);
                                setEditingValue(groupName);
                            }
                        }}
                        data-pr-tooltip={canRename && groupBy === 'tasklist' && groupId !== null ? "Double-tap to rename list" : ""}
                        data-pr-position="top"
                    >
                        {groupName}
                    </span>
                )}
            </span>
        );
    };

    return (
        <div className="h-full flex flex-col overflow-hidden relative">
            <DataTable
                ref={dt}
                value={sortedTasks}
                editMode="cell"
                onCellEditComplete={onCellEditComplete}
                loading={loading}
                dataKey="_uid"
                showGridlines
                stripedRows
                resizableColumns
                columnResizeMode="fit"
                scrollable
                onValueChange={(e) => onValueChange?.(e as Task[])}
                scrollHeight="flex"
                size="small"
                lazy={lazy}
                paginator={paginator && !isGrouped}
                totalRecords={totalRecords}
                onPage={onPage}
                first={first}
                rows={rows ?? 20}
                rowGroupMode={isGrouped ? 'subheader' : undefined}
                groupRowsBy={isGrouped ? "_group_identity" : undefined}
                expandableRowGroups={isGrouped}
                expandedRows={isGrouped ? expandedGroups : undefined}
                onRowToggle={isGrouped ? ((e: any) => setExpandedGroups(e.data)) : undefined}
                rowGroupHeaderTemplate={isGrouped ? headerTemplate : undefined}
                sortMode="multiple"
                multiSortMeta={isGrouped ? [{ field: '_group_identity', order: 1 }, ...multiSortMeta.filter(m => m.field !== '_group_identity')] : multiSortMeta}
                onSort={handleSort}
                onRowClick={handleRowClick}
                rowClassName={(r) => r._isDummy ? 'bg-slate-50 dark:bg-slate-900/50 text-slate-400 italic opacity-70' : 'cursor-pointer hover:bg-white dark:hover:bg-teal-900 transition-colors'}
                emptyMessage={
                    <div className="flex flex-col items-center py-16 gap-3" style={{ color: 'var(--text-muted)' }}>
                        <span className="text-4xl">✅</span>
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No tasks found</p>
                    </div>
                }
                pt={{
                    header: { className: 'pms-dt-header' },
                    headerRow: { className: 'pms-dt-header-row' },
                    bodyRow: { className: 'pms-dt-row' },
                    column: { bodyCell: { className: 'pms-dt-cell' }, headerCell: { className: 'pms-dt-head-cell' } },
                    rowGroupHeader: {
                        className: 'bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 shadow-sm'
                    },
                    rowGroupToggler: {
                        className: 'w-6 h-6 ml-4 mr-2 rounded-lg flex items-center justify-center text-slate-400 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all border-none shadow-none focus:ring-0',
                        style: { background: 'transparent' }
                    }
                }}
                className="pms-datatable"
                style={{ fontSize: 13 }}
            >
                { }
                <Column
                    field="public_id"
                    header="ID"
                    sortable
                    style={{ width: '90px', minWidth: '80px' }}
                    body={(r) => {
                        if (r._isDummy) return null;
                        return (
                            <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded"
                                style={{
                                    background: r.status_master?.color ? `${r.status_master.color}15` : 'var(--bg-secondary)',
                                    color: r.status_master?.color || 'var(--text-primary)',
                                    border: `1px solid ${r.status_master?.color || 'var(--border-color)'}33`
                                }}
                            >
                                {r.public_id ?? `TSK-${r.id}`}
                            </span>
                        );
                    }}
                />

                <Column
                    field="task_name"
                    header="Task Name"
                    sortable
                    style={{ minWidth: '220px' }}
                    body={(r) => {
                        if (r._isDummy) {
                            return <span className="text-[12px] italic text-slate-400">No tasks in this list</span>;
                        }
                        let isOverdue = false;
                        if (r.due_date) {
                            const dueDate = new Date(r.due_date);
                            dueDate.setHours(23, 59, 59, 999);
                            const statusStr = (r.status_master?.label ?? r.status_master?.name ?? r.status ?? '').toLowerCase();
                            const isDone = statusStr === 'completed' || statusStr === 'closed' || statusStr === 'done';
                            if (!isDone && dueDate < new Date()) {
                                isOverdue = true;
                            }
                        }
                        return (
                            <InlineEditCell
                                value={r.task_name}
                                onSave={(val) => handleInlineUpdate(r, 'task_name', val)}
                                renderValue={(val) => (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[13px] font-semibold block truncate max-w-[200px] sm:max-w-[300px] task-name-tooltip"
                                            style={{ color: 'var(--text-primary)' }}
                                            data-pr-tooltip={r.task_name}
                                            data-pr-position="top"
                                        >
                                            {r.task_name}
                                        </span>
                                        {isOverdue && (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex-shrink-0">Overdue</span>
                                        )}
                                    </div>
                                )}
                            />
                        );
                    }}
                />

                { }
                <Column
                    field="duration"
                    header="Duration"
                    sortable
                    style={{ width: '90px', minWidth: '80px' }}
                    body={(r) => {
                        if (r._isDummy) return null;
                        return (
                            <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                                {r.duration ? `${r.duration}d` : '—'}
                            </span>
                        );
                    }}
                />

                <Column
                    field="priority_master.label"
                    header="Priority"
                    sortable
                    style={{ width: '120px', minWidth: '100px' }}
                    body={(r) => r._isDummy ? null : (
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
                    field="single_owner"
                    header="Task Owner"
                    style={{ minWidth: '140px' }}
                    body={(r) => r._isDummy ? null : <OwnerCell owner={r.assignee || r.single_owner || (r.owners && r.owners.length > 0 ? r.owners[0] : null)} />}
                />

                <Column
                    field="status_master.label"
                    header="Status"
                    sortable
                    style={{ width: '140px', minWidth: '120px' }}
                    body={(r) => r._isDummy ? null : (
                        <InlineSelectCell
                            value={r.status_master?.id ?? r.status_id}
                            options={statuses}
                            optionLabel="label"
                            optionValue="id"
                            onSave={(val) => handleInlineUpdate(r, 'status_id', val)}
                            renderValue={() => <StatusCell status={r.status_master ?? r.status} />}
                        />
                    )}
                />

                { }
                <Column
                    field="tags"
                    header="Tags"
                    style={{ minWidth: '100px' }}
                    body={(r) => {
                        if (r._isDummy) return null;
                        if (!r.tags) return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>;
                        return (
                            <div className="flex flex-wrap gap-1 max-w-[120px] overflow-hidden whitespace-nowrap">
                                {String(r.tags).split(',').slice(0, 2).map((t: string, i: number) => (
                                    <span key={i} className="text-[10px] font-semibold px-1.5 py-0.5 rounded truncate max-w-[50px] tag-tooltip"
                                        style={{ background: '#e0f2fe', color: '#0369a1' }}
                                        data-pr-tooltip={t.trim()}
                                        data-pr-position="top"
                                    >
                                        {t.trim()}
                                    </span>
                                ))}
                            </div>
                        );
                    }}
                />

                <Column
                    field="start_date"
                    header="Start Date"
                    sortable
                    style={{ width: '110px', minWidth: '100px' }}
                    body={(r) => r._isDummy ? null : <DateCell date={r.start_date} />}
                />

                <Column
                    field="due_date"
                    header="Due Date"
                    sortable
                    style={{ width: '110px', minWidth: '100px' }}
                    body={(r) => r._isDummy ? null : <DateCell date={r.due_date ?? r.end_date} warn />}
                />



                <Column
                    field="estimated_hours"
                    header="Work Hours (P)"
                    sortable
                    style={{ width: '105px', minWidth: '95px' }}
                    editor={(options) => <InputNumber value={options.value} onValueChange={(e) => options.editorCallback(e.value)} mode="decimal" minFractionDigits={0} maxFractionDigits={2} className="w-full" inputClassName="py-1 text-[13px]" />}
                    body={(r) => {
                        if (r._isDummy) return null;
                        return (
                            <span className="text-[12px] font-semibold tabular-nums"
                                style={{ color: 'var(--text-primary)' }}>
                                {Number(r.estimated_hours ?? 0).toFixed(1)}h
                            </span>
                        );
                    }}
                />

                <Column
                    field="cached_timelog_total"
                    header="Timelog (T)"
                    sortable
                    style={{ width: '95px', minWidth: '85px' }}
                    body={(r) => {
                        if (r._isDummy) return null;
                        return (
                            <span className="text-[12px] font-semibold tabular-nums" style={{ color: TEAL }}>
                                {Number(r.cached_timelog_total || r.timelog_total || r.work_hours || 0).toFixed(1)}h
                            </span>
                        );
                    }}
                />

                <Column
                    field="difference"
                    header="Diff (P-T)"
                    sortable
                    style={{ width: '90px', minWidth: '80px' }}
                    body={(r) => {
                        if (r._isDummy) return null;
                        return (
                            <DiffCell
                                workHours={r.estimated_hours}
                                timelogTotal={r.cached_timelog_total || r.timelog_total || r.work_hours}
                            />
                        );
                    }}
                />

                <Column
                    field="billing_type"
                    header="Billing Type"
                    style={{ width: '100px', minWidth: '90px' }}
                    body={(r) => {
                        if (r._isDummy) return null;
                        return (
                            <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                                {r.billing_type ?? '—'}
                            </span>
                        );
                    }}
                />



                <Tooltip target=".tasklist-header-name" mouseTrack mouseTrackLeft={10} />
                <Tooltip target=".task-name-tooltip" mouseTrack mouseTrackLeft={10} />
                <Tooltip target=".tag-tooltip" mouseTrack mouseTrackLeft={10} />
            </DataTable>
        </div>
    );
}
