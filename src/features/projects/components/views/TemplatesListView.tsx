import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag } from 'primereact/tag';
import { Avatar } from 'primereact/avatar';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tooltip } from 'primereact/tooltip';
import {
    LayoutTemplate, Plus, Trash2, Pencil,
    Layers, Clock, Globe2, Lock, ChevronDown, ChevronRight, Check
} from 'lucide-react';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { Button } from '@/components/forms/Button';
import { useTemplates, useDeleteTemplate } from '../../hooks/useTemplates';
import type { ProjectTemplate } from '../../types/template.types';
import { ConfirmationModal } from '@/components/core/ConfirmationModal';

const TEAL = 'hsl(160 60% 45%)';

function TemplateCard({ template, onDelete, expanded, onToggle }: {
    template: ProjectTemplate;
    onDelete: (t: ProjectTemplate) => void;
    expanded: boolean;
    onToggle: () => void;
}) {
    const navigate = useNavigate();

    const creatorName = template.created_by
        ? `${template.created_by.first_name ?? ''} ${template.created_by.last_name ?? ''}`.trim()
        : 'Unknown';

    const taskCount = template.tasks.length;
    const totalHours = template.tasks.reduce((s, t) => s + (t.estimated_hours ?? 0), 0);

    return (
        <div className="relative">
            <div
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col justify-between"
                style={{ minHeight: '180px' }}
            >
                <div className="p-4 flex items-start gap-3">
                    <div className="w-14 h-8 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center text-white flex-shrink-0">
                        <LayoutTemplate size={16} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate" title={template.name}>
                            {template.name}
                        </h3>
                        <p className="text-xs text-slate-500 truncate">
                            {template.description || "What is Lorem ipsum dolor sit amet..."}
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-slate-400 flex-shrink-0">
                        {template.is_public ? (
                            <Globe2 size={14} className="text-emerald-500" />
                        ) : (
                            <Lock size={14} />
                        )}
                        <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/templates/${template.id}`); }} 
                            className="hover:text-teal-500 p-1 transition-colors"
                            title="Edit Template"
                        >
                            <Pencil size={14} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(template); }} 
                            className="hover:text-red-500 p-1 transition-colors"
                            title="Delete Template"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                <div className="px-4 py-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 border-t border-slate-50 dark:border-slate-700">
                    <div className="flex items-center gap-1">
                        <Layers size={14} className="text-emerald-500" />
                        <span className="font-medium">{taskCount} task{taskCount !== 1 ? 's' : ''}</span>
                    </div>
                    
                    {template.billing_type ? (
                        <span className="px-3 py-0.5 bg-blue-500 text-white rounded-full text-[10px] font-bold uppercase">
                            {template.billing_type}
                        </span>
                    ) : totalHours > 0 ? (
                        <div className="flex items-center gap-1">
                            <Clock size={14} className="text-slate-400" />
                            <span>{totalHours}h total</span>
                        </div>
                    ) : null}
                    
                    <div className="flex items-center gap-1.5">
                        <Avatar 
                            label={template.created_by?.first_name?.[0] || 'U'} 
                            size="normal" 
                            shape="circle" 
                            style={{ width: 22, height: 22, fontSize: 10, background: '#0066FF', color: '#fff' }}
                        />
                        <span className="text-[11px] font-medium text-slate-500 truncate max-w-[80px]">
                            {creatorName}
                        </span>
                    </div>
                </div>

                <button 
                    onClick={onToggle}
                    className="w-full py-2.5 bg-slate-50 dark:bg-slate-700/50 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center gap-1 border-t border-slate-100 dark:border-slate-700 transition-colors"
                >
                    {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    Show tasks
                </button>
            </div>
            
            {expanded && taskCount > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-b-2xl shadow-lg divide-y divide-slate-50 dark:divide-slate-700 max-h-[200px] overflow-y-auto z-20">
                    {template.tasks.map((t: any, i: number) => (
                        <div key={t.id} className="flex items-center gap-3 px-4 py-2 text-xs">
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex-shrink-0">
                                {i + 1}
                            </span>
                            <span className="text-slate-700 dark:text-slate-200 flex-1 truncate" title={t.title}>
                                {t.title}
                            </span>
                            <div className="flex items-center gap-2 flex-shrink-0 text-slate-500">
                                {t.estimated_hours != null && (
                                    <span className="font-bold text-emerald-500">{t.estimated_hours}h</span>
                                )}

                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}



function StatChip({ icon, value, color }: { icon: React.ReactNode; value: string; color: string }) {
    return (
        <div className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color }}>
            {icon}
            {value}
        </div>
    );
}

export function TemplatesListView() {
    const navigate = useNavigate();
    const { data: templates = [], isLoading } = useTemplates();
    const deleteTemplate = useDeleteTemplate();
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<ProjectTemplate | null>(null);

    const handleDelete = (t: ProjectTemplate) => setConfirmDelete(t);
    const confirmDeleteNow = async () => {
        if (confirmDelete) {
            await deleteTemplate.mutateAsync(confirmDelete.id);
            setConfirmDelete(null);
        }
    };

    return (
        <PageLayout
            title="Project Templates"
            subtitle="Reusable task sets for faster project setup"
            actions={
                <Button
                    variant="gradient"
                    size="sm"
                    icon={<Plus size={14} />}
                    onClick={() => navigate('/templates/create')}
                >
                    New Template
                </Button>
            }
        >
            <div className="px-4 py-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <ProgressSpinner style={{ width: 40, height: 40 }} />
                    </div>
                ) : templates.length === 0 ? (
                    <div className="flex flex-col items-center py-24 gap-4" style={{ color: 'var(--text-muted)' }}>
                        <LayoutTemplate size={48} strokeWidth={1} />
                        <div className="text-center">
                            <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                                No templates yet
                            </p>
                            <p className="text-sm mt-1">Create a template to speed up project creation</p>
                        </div>
                        <Button variant="gradient" icon={<Plus size={14} />}
                            onClick={() => navigate('/templates/create')}>
                            Create First Template
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                        {templates.map(t => (
                            <TemplateCard
                                key={t.id}
                                template={t}
                                onDelete={handleDelete}
                                expanded={expandedId === t.id}
                                onToggle={() => setExpandedId(prev => prev === t.id ? null : t.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            { }
            <ConfirmationModal
                visible={!!confirmDelete}
                onHide={() => setConfirmDelete(null)}
                onConfirm={confirmDeleteNow}
                title={`Delete "${confirmDelete?.name}"?`}
                message={`This will permanently remove the template and its ${confirmDelete?.tasks.length ?? 0} task(s). Projects already created from this template will not be affected.`}
                confirmLabel="Delete"
                variant="danger"
                loading={deleteTemplate.isPending}
            />
        </PageLayout>
    );
}
