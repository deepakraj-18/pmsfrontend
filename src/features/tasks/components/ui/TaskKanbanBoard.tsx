import React from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useNavigate, useLocation } from 'react-router-dom';
import { Task } from '@/api/services/tasks.service';
import { useStatuses } from '@/features/masters/hooks/useMasters';
import { useUpdateTask } from '@/features/tasks/hooks/useTasks';
import { statusName } from '@/utils/statusHelpers';
import { Clock, User, Layers, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from 'primereact/tooltip';

const ITEM_TYPE = 'TASK_CARD';
const TEAL = 'hsl(160 60% 45%)';

interface KanbanViewProps { tasks: Task[]; }
interface KanbanCardProps { task: Task; }
interface KanbanColumnProps {
    status: { id: number; name: string };
    tasks: Task[];
    onDrop: (taskId: number, statusId: number) => void;
}


function statusColumnColor(name: string) {
    const n = name.toLowerCase();
    if (n.includes('progress') || n.includes('active'))
        return { header: '#3b82f6', border: '#bfdbfe', badge: '#eff6ff', badgeText: '#1d4ed8' };
    if (n.includes('review') || n.includes('test'))
        return { header: '#8b5cf6', border: '#ddd6fe', badge: '#f5f3ff', badgeText: '#6d28d9' };
    if (n.includes('complet') || n.includes('resolv') || n.includes('done'))
        return { header: '#10b981', border: '#a7f3d0', badge: '#ecfdf5', badgeText: '#065f46' };
    if (n.includes('hold') || n.includes('block'))
        return { header: '#f59e0b', border: '#fde68a', badge: '#fffbeb', badgeText: '#92400e' };
    if (n.includes('clos') || n.includes('cancel'))
        return { header: '#6b7280', border: '#e5e7eb', badge: '#f9fafb', badgeText: '#374151' };
    return { header: TEAL, border: '#99f6e4', badge: '#f0fdfa', badgeText: '#134e4a' };
}

function priorityColor(task: Task) {
    const p = statusName((task as any).priority_master ?? task.priority ?? '').toLowerCase();
    if (p === 'critical') return { dot: '#ef4444', bg: '#fef2f2', text: '#dc2626' };
    if (p === 'high') return { dot: '#f97316', bg: '#fff7ed', text: '#c2410c' };
    if (p === 'medium') return { dot: '#eab308', bg: '#fefce8', text: '#854d0e' };
    return { dot: '#22c55e', bg: '#f0fdf4', text: '#166534' };
}


function KanbanCard({ task }: KanbanCardProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [{ isDragging }, dragRef] = useDrag({
        type: ITEM_TYPE,
        item: { id: task.id },
        collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    });

    const prio = priorityColor(task);
    const assignee = (task as any).assignees?.[0] ?? task.assignee;
    const assigneeName = assignee
        ? `${assignee.first_name ?? ''} ${assignee.last_name ?? ''}`.trim()
        : 'Unassigned';
    const assigneeInitials = assignee
        ? `${assignee.first_name?.[0] ?? ''}${assignee.last_name?.[0] ?? ''}`.toUpperCase()
        : '?';

    return (
        <motion.div
            ref={dragRef as any}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: isDragging ? 0.4 : 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ transition: 'box-shadow 0.15s' }}
            className={`group ${isDragging ? 'grabbing-cursor' : 'grab-cursor'}`}
            onClick={() => navigate(`/tasks/${task.id}`, { state: { from: location.pathname + location.search } })}
        >
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">

                <div className="h-1 rounded-t-2xl" style={{ background: prio.dot }} />

                <div className="p-3.5 space-y-3">

                    <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background: `${TEAL}18`, color: TEAL }}>
                            {(task as any).public_id ?? `TSK-${task.id}`}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: prio.bg, color: prio.text }}>
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: prio.dot }} />
                            {statusName((task as any).priority_master ?? task.priority) || 'Normal'}
                        </span>
                    </div>


                    <p
                        className="task-kanban-title text-[13px] font-semibold leading-snug text-slate-800 dark:text-slate-100 line-clamp-2 group-hover:text-brand-teal-600 transition-colors"
                        data-pr-tooltip={task.task_name}
                        data-pr-position="top"
                    >
                        {task.task_name}
                    </p>
                    <Tooltip target=".task-kanban-title" />

                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${task.completion_percentage || 0}%`, background: TEAL }}
                        />
                    </div>
                    <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">Progress</span>
                        <span className="font-bold" style={{ color: TEAL }}>{task.completion_percentage || 0}%</span>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-700/60">
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                                style={{ background: 'linear-gradient(135deg,#0CD1C3,#6366f1)' }}>
                                {assigneeInitials}
                            </div>
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[90px]">
                                {assigneeName}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>{task.due_date ?? '—'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}


function KanbanColumn({ status, tasks, onDrop }: KanbanColumnProps) {
    const [{ isOver }, dropRef] = useDrop({
        accept: ITEM_TYPE,
        drop: (item: { id: number }) => onDrop(item.id, status.id),
        collect: (monitor) => ({ isOver: monitor.isOver() }),
    });

    const col = statusColumnColor(status.name);

    return (
        <div
            ref={dropRef as any}
            className="flex-shrink-0 flex flex-col"
            style={{ width: 300, minWidth: 300, maxWidth: 300, height: '100%' }}
        >

            <div
                className="flex-shrink-0 rounded-2xl mb-3 px-4 py-3 flex items-center justify-between transition-all"
                style={{
                    background: isOver ? `${col.header}22` : `${col.header}14`,
                    border: `1.5px solid ${col.border}`,
                    ...(isOver ? { boxShadow: `0 0 0 2px ${col.header}` } : {}),
                }}
            >
                <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: col.header }} />
                    <h3 className="font-bold text-[13px] uppercase tracking-wider" style={{ color: col.header }}>
                        {status.name}
                    </h3>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: col.badge, color: col.badgeText }}>
                    {tasks.length}
                </span>
            </div>


            <div
                className="flex-1 overflow-y-auto rounded-2xl"
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: `${col.border} transparent`,
                    paddingRight: 4,
                    paddingLeft: 2,
                    paddingTop: 2,
                    paddingBottom: 8,
                    ...(isOver ? { background: `${col.header}08`, borderRadius: '1rem' } : {}),
                }}
            >
                <div className="space-y-3 pr-1">
                    <AnimatePresence initial={false}>
                        {tasks.map((task) => (
                            <KanbanCard key={task.id} task={task} />
                        ))}
                    </AnimatePresence>
                    {tasks.length === 0 && (
                        <div
                            className="h-28 rounded-2xl flex flex-col items-center justify-center gap-2 text-[12px] italic"
                            style={{ border: `1.5px dashed ${col.border}`, color: col.header, opacity: 0.6 }}
                        >
                            <GripVertical size={16} />
                            Drop tasks here
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function TaskKanbanBoard({ tasks }: KanbanViewProps) {
    const { data: statuses = [] } = useStatuses();
    const { mutate: updateTask } = useUpdateTask();

    const handleDrop = (taskId: number, statusId: number) => {
        const task: any = tasks.find((t) => t.id === taskId);
        if (task && task.status_id !== statusId) {
            updateTask({ id: taskId, data: { status_id: statusId } });
        }
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div
                className="flex gap-5 h-full overflow-x-auto"
                style={{
                    padding: '6px 8px 12px',
                    scrollbarWidth: 'thin',
                    scrollbarColor: `hsl(160 60% 45% / 0.3) transparent`,
                    alignItems: 'stretch',
                }}
            >
                {statuses.map((s) => (
                    <KanbanColumn
                        key={s.id}
                        status={s}
                        tasks={tasks.filter((t: any) => t.status_id === s.id)}
                        onDrop={handleDrop}
                    />
                ))}
            </div>
        </DndProvider>
    );
}
