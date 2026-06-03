import React from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useNavigate, useLocation } from 'react-router-dom';
import { Project } from '@/features/projects/types/project.types';
import { useMasterLookups } from '@/features/masters/hooks/useMasters';
import { useProjectActions } from '@/features/projects/hooks/useProjectActions';
import { FolderKanban, Users, Clock, Target, GripVertical, Layout } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressBar } from 'primereact/progressbar';

const ITEM_TYPE = 'PROJECT_CARD';
const TEAL = 'hsl(160 60% 45%)';

interface ProjectKanbanBoardProps { projects: Project[]; }
interface ProjectCardProps { project: Project; }
interface KanbanColumnProps {
    status: { id: number; label: string };
    projects: Project[];
    onDrop: (projectId: number, statusId: number) => void;
}

function statusColumnColor(label: string) {
    const n = label.toLowerCase();
    if (n.includes('progress') || n.includes('active'))
        return { header: '#3b82f6', border: '#bfdbfe', badge: '#eff6ff', badgeText: '#1d4ed8' };
    if (n.includes('review') || n.includes('test') || n.includes('pending'))
        return { header: '#8b5cf6', border: '#ddd6fe', badge: '#f5f3ff', badgeText: '#6d28d9' };
    if (n.includes('complet') || n.includes('done') || n.includes('delivered'))
        return { header: '#10b981', border: '#a7f3d0', badge: '#ecfdf5', badgeText: '#065f46' };
    if (n.includes('hold') || n.includes('block') || n.includes('pause'))
        return { header: '#f59e0b', border: '#fde68a', badge: '#fffbeb', badgeText: '#92400e' };
    if (n.includes('clos') || n.includes('cancel') || n.includes('archive'))
        return { header: '#6b7280', border: '#e5e7eb', badge: '#f9fafb', badgeText: '#374151' };
    return { header: TEAL, border: '#99f6e4', badge: '#f0fdfa', badgeText: '#134e4a' };
}


function ProjectCard({ project }: ProjectCardProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [{ isDragging }, dragRef] = useDrag({
        type: ITEM_TYPE,
        item: { id: project.id },
        collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    });

    const statusLabel =
        project.status_master?.label ??
        project.status_master?.name ??
        (typeof project.status === 'string' ? project.status : (project.status as any)?.label) ??
        'Active';

    const pct = project.completion_percentage ?? 0;

    return (
        <motion.div
            ref={dragRef as any}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: isDragging ? 0.4 : 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{}}
            className={`group ${isDragging ? 'grabbing-cursor' : 'grab-cursor'}`}
            onClick={() => navigate(`/projects/${project.id}`, { state: { from: location.pathname + location.search } })}
        >
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="h-1 rounded-t-2xl"
                    style={{ background: pct >= 100 ? '#10b981' : pct > 50 ? TEAL : '#f59e0b' }} />

                <div className="p-3.5 space-y-3">

                    <div className="flex items-start justify-between gap-2">
                        {project.public_id && (
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded"
                                style={{ background: `${TEAL}18`, color: TEAL }}>
                                {project.public_id}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 ml-auto">
                            {statusLabel}
                        </span>
                    </div>


                    <p className="text-[13px] font-semibold leading-snug text-slate-800 dark:text-slate-100 line-clamp-2 group-hover:text-brand-teal-600 transition-colors">
                        {project.project_name}
                    </p>


                    <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 truncate">
                        <Target size={11} className="flex-shrink-0" />
                        {(project as any).client_name ?? (project as any).customer_name ?? 'Internal Project'}
                    </p>


                    {project.tags && (
                        <div className="flex flex-wrap gap-1">
                            {project.tags.split(',').slice(0, 3).map((tag: string) => (
                                <span key={tag}
                                    className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                                    style={{ background: `${TEAL}12`, color: TEAL }}>
                                    #{tag.trim()}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400">Completion</span>
                            <span className="font-bold" style={{ color: TEAL }}>{pct}%</span>
                        </div>
                        <ProgressBar
                            value={pct}
                            showValue={false}
                            style={{ height: '5px' }}
                            color={TEAL}
                        />
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-700/60">
                        <div className="flex items-center gap-1.5">
                            {project.project_manager ? (
                                <>
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                                        style={{ background: 'linear-gradient(135deg,#0CD1C3,#6366f1)' }}>
                                        {(project.project_manager.first_name?.[0] ?? 'P')}
                                        {(project.project_manager.last_name?.[0] ?? 'M')}
                                    </div>
                                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[90px]">
                                        {project.project_manager.first_name}
                                    </span>
                                </>
                            ) : (
                                <div className="flex items-center gap-1 text-slate-300 dark:text-slate-600 text-[11px] italic">
                                    <Users size={11} /> No PM
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>
                                {project.expected_end_date
                                    ? new Date(project.expected_end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                                    : '—'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}


function KanbanColumn({ status, projects, onDrop }: KanbanColumnProps) {
    const [{ isOver }, dropRef] = useDrop({
        accept: ITEM_TYPE,
        drop: (item: { id: number }) => onDrop(item.id, status.id),
        collect: (monitor) => ({ isOver: monitor.isOver() }),
    });

    const col = statusColumnColor(status.label);

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
                    <h3 className="font-bold text-[13px] uppercase tracking-wider truncate max-w-[160px]"
                        style={{ color: col.header }}>
                        {status.label}
                    </h3>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: col.badge, color: col.badgeText }}>
                    {projects.length}
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
                        {projects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </AnimatePresence>
                    {projects.length === 0 && (
                        <div
                            className="h-28 rounded-2xl flex flex-col items-center justify-center gap-2 text-[12px] italic"
                            style={{ border: `1.5px dashed ${col.border}`, color: col.header, opacity: 0.6 }}
                        >
                            <GripVertical size={16} />
                            Drop projects here
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


export function ProjectKanbanBoard({ projects }: ProjectKanbanBoardProps) {
    const { data: statusesData = [] } = useMasterLookups('ProjectStatus');
    const { updateProject } = useProjectActions();

    const statuses = statusesData.map(s => ({ id: s.id, label: s.label || s.name || 'Unknown' }));

    const handleDrop = (projectId: number, statusId: number) => {
        const project = projects.find((p) => p.id === projectId);
        if (project && project.status_id !== statusId) {
            updateProject.mutate({ id: projectId, data: { status_id: statusId } as any });
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
                {statuses.length > 0 ? (
                    statuses.map((s) => (
                        <KanbanColumn
                            key={s.id}
                            status={s}
                            projects={projects.filter((p) => p.status_id === s.id)}
                            onDrop={handleDrop}
                        />
                    ))
                ) : (
                    <div className="w-full flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
                        <Layout size={40} className="opacity-20" />
                        <p className="text-sm">No statuses configured for Kanban view.</p>
                    </div>
                )}
            </div>
        </DndProvider>
    );
}
