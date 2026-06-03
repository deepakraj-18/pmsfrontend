import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import {
    LayoutTemplate, GripVertical, Trash2, Plus, Pencil,
    Clock, User, Calendar, Save, ArrowLeft,
    Layers, Globe2, Lock, Info, AlertCircle
} from 'lucide-react';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { Button } from '@/components/forms/Button';
import { useTemplate, useUpdateTemplate, useRemoveTemplateTask, useAddTemplateTask } from '../../hooks/useTemplates';
import { handleServerError } from '@/utils/errorHelpers';
import { useToast } from '@/providers/ToastContext';
import type { TemplateTaskItem } from '../types/template.types';

const TEAL = 'hsl(160 60% 45%)';


function InfoChip({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
    if (!value) return null;
    return (
        <div className="flex items-center gap-2 text-sm">
            <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
            <span style={{ color: 'var(--text-secondary)' }}>{label}:</span>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</span>
        </div>
    );
}

export function TemplateEditView() {
    const { showToast } = useToast();
    const { templateId } = useParams<{ templateId: string }>();
    const navigate = useNavigate();
    const id = Number(templateId);

    const { data: template, isLoading } = useTemplate(id);
    const updateTemplate = useUpdateTemplate();
    const removeTask = useRemoveTemplateTask();
    const addTask = useAddTemplateTask();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [tasks, setTasks] = useState<TemplateTaskItem[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [rootError, setRootError] = useState<string | null>(null);

    useEffect(() => {
        if (template) {
            setName(template.name);
            setDescription(template.description ?? '');
            setTasks([...template.tasks].sort((a, b) => a.order_index - b.order_index));
        }
    }, [template]);

    const markDirty = () => setIsDirty(true);

    const handleSave = async () => {
        setRootError(null);
        if (!name.trim()) {
            setRootError('Template name is required');
            return;
        }

        const invalidTasks = tasks.filter(t => !t.title?.trim());
        if (invalidTasks.length > 0) {
            setRootError('All tasks must have a title');
            return;
        }

        setSubmitting(true);
        try {
            await updateTemplate.mutateAsync({
                id,
                data: {
                    name: name.trim(),
                    description: description.trim() || undefined,
                    tasks: tasks.map((t, i) => ({
                        title: t.title.trim(),
                        description: t.description ?? undefined,
                        estimated_hours: t.estimated_hours ?? undefined,
                        duration: t.duration ?? undefined,
                        order_index: i,
                    })),
                },
            });
            setIsDirty(false);
        } catch (err: any) {
            console.error('Failed to update template:', err);
            handleServerError(err, (f, e) => setRootError(e.message), showToast, 'Update Failed', true);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRowReorder = (e: any) => {
        setTasks(e.value);
        markDirty();
    };

    const handleAddTask = () => {
        const newTask: TemplateTaskItem = {
            id: -Date.now(),
            title: 'New Task',
            description: '',
            estimated_hours: null,
            duration: null,
            order_index: tasks.length,
        };
        setTasks(prev => [...prev, newTask]);
        markDirty();
    };

    const handleRemoveTask = (task: TemplateTaskItem) => {
        setTasks(prev => prev.filter(t => t.id !== task.id));
        markDirty();
    };

    const handleCellEdit = (taskId: number, field: keyof TemplateTaskItem, value: any) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, [field]: value } : t));
        markDirty();
    };

    if (isLoading) {
        return (
            <PageLayout title="Template" showBackButton backPath="/templates">
                <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${TEAL} transparent transparent transparent` }} />
                        <p style={{ color: 'var(--text-muted)' }}>Loading template…</p>
                    </div>
                </div>
            </PageLayout>
        );
    }

    if (!template) {
        return (
            <PageLayout title="Template Not Found" showBackButton backPath="/templates">
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <LayoutTemplate size={48} style={{ color: 'var(--text-muted)' }} />
                    <h2 style={{ color: 'var(--text-primary)' }}>Template not found</h2>
                    <Button variant="secondary" onClick={() => navigate('/templates')}>
                        <ArrowLeft size={14} /> Back to Templates
                    </Button>
                </div>
            </PageLayout>
        );
    }

    const creatorName = template.created_by
        ? `${template.created_by.first_name ?? ''} ${template.created_by.last_name ?? ''}`.trim()
        : 'Unknown';

    return (
        <PageLayout title={template.name} showBackButton backPath="/templates">
            <div className="max-w-[960px] mx-auto pb-16 px-4 space-y-6">
                {rootError && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
                        <AlertCircle size={16} />
                        <span>{rootError}</span>
                    </div>
                )}

                <div
                    className="rounded-2xl p-5"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        boxShadow: 'var(--card-shadow)',
                    }}
                >
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                                style={{ background: `${TEAL}18`, color: TEAL }}
                            >
                                <LayoutTemplate size={22} />
                            </div>
                            <div>
                                <InputText
                                    value={name}
                                    onChange={e => { setName(e.target.value); markDirty(); }}
                                    className="!text-xl !font-black !border-0 !bg-transparent !shadow-none !p-0 !ring-0 w-full"
                                    style={{ color: 'var(--text-primary)' }}
                                    placeholder="Template name"
                                />
                                <div className="flex items-center gap-2 mt-1">
                                    {template.is_public ? (
                                        <Globe2 size={12} style={{ color: TEAL }} />
                                    ) : (
                                        <Lock size={12} style={{ color: 'var(--text-muted)' }} />
                                    )}
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                        {template.is_public ? 'Public Template' : 'Private Template'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                            {isDirty && (
                                <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                                    Unsaved changes
                                </span>
                            )}
                            <Button
                                variant="primary"
                                onClick={handleSave}
                                disabled={!isDirty || submitting}
                                className="!h-9 !px-5"
                                style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }}
                            >
                                <Save size={14} />
                                {submitting ? 'Saving…' : 'Save Template'}
                            </Button>
                        </div>
                    </div>

                    <InputTextarea
                        value={description}
                        onChange={e => { setDescription(e.target.value); markDirty(); }}
                        rows={2}
                        autoResize
                        placeholder="Add a description for this template…"
                        className="w-full !border-0 !bg-transparent !shadow-none !ring-0 resize-none text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                    />

                    <div
                        className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 pt-3"
                        style={{ borderTop: '1px solid var(--border-color)' }}
                    >
                        <InfoChip icon={<User size={13} />} label="Created by" value={creatorName} />
                        <InfoChip
                            icon={<Calendar size={13} />}
                            label="Created"
                            value={template.created_at ? new Date(template.created_at).toLocaleDateString() : null}
                        />
                        <InfoChip icon={<Layers size={13} />} label="Tasks" value={String(tasks.length)} />
                        <InfoChip icon={<Clock size={13} />} label="Est. Hours" value={
                            String(tasks.reduce((s, t) => s + (t.estimated_hours ?? 0), 0)) + 'h'
                        } />
                    </div>
                </div>

                <div
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
                    style={{
                        background: 'hsl(210 80% 55% / 0.08)',
                        border: '1px solid hsl(210 80% 55% / 0.2)',
                        color: 'hsl(210 80% 45%)',
                    }}
                >
                    <Info size={15} className="flex-shrink-0" />
                    <span>
                        Drag rows to reorder tasks. Changes apply when you click <strong>Save Template</strong>.
                        Tasks cloned from a project have no assignees or dates — those are set when you create a new project.
                    </span>
                </div>

                <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        boxShadow: 'var(--card-shadow)',
                    }}
                >
                    <div
                        className="flex items-center justify-between px-5 py-3"
                        style={{ borderBottom: '1px solid var(--border-color)' }}
                    >
                        <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                            Default Tasks ({tasks.length})
                        </h3>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleAddTask}
                            className="!h-8 !px-3"
                        >
                            <Plus size={13} /> Add Task
                        </Button>
                    </div>

                    <DataTable
                        value={tasks}
                        dataKey="id"
                        reorderableRows
                        onRowReorder={handleRowReorder}
                        tableStyle={{ minWidth: '540px' }}
                        emptyMessage={
                            <div className="flex flex-col items-center gap-3 py-10">
                                <Layers size={36} style={{ color: 'var(--text-muted)' }} />
                                <p style={{ color: 'var(--text-muted)' }}>No tasks yet — click "Add Task" to get started.</p>
                            </div>
                        }
                        className="template-task-table"
                    >
                        <Column rowReorder style={{ width: '3rem' }} body={() => (
                            <GripVertical size={14} style={{ color: 'var(--text-muted)', cursor: 'grab' }} />
                        )} />

                        <Column
                            field="order_index"
                            header="#"
                            style={{ width: '3rem' }}
                            body={(_row, opts) => (
                                <span className="text-xs font-black tabular-nums" style={{ color: 'var(--text-muted)' }}>
                                    {(opts.rowIndex + 1).toString().padStart(2, '0')}
                                </span>
                            )}
                        />

                        <Column
                            field="title"
                            header="Task Name"
                            style={{ minWidth: '180px' }}
                            body={(row) => (
                                <InputText
                                    value={row.title}
                                    onChange={e => handleCellEdit(row.id, 'title', e.target.value)}
                                    className="!border-0 !bg-transparent !shadow-none !ring-0 w-full text-sm font-medium"
                                    style={{ color: 'var(--text-primary)' }}
                                    placeholder="Task name"
                                />
                            )}
                        />

                        <Column
                            field="estimated_hours"
                            header="Est. Hrs"
                            style={{ width: '100px' }}
                            body={(row) => (
                                <InputNumber
                                    value={row.estimated_hours}
                                    onValueChange={e => handleCellEdit(row.id, 'estimated_hours', e.value)}
                                    mode="decimal"
                                    minFractionDigits={0}
                                    maxFractionDigits={1}
                                    min={0}
                                    className="w-full"
                                    inputClassName="!border-0 !bg-transparent !shadow-none !ring-0 text-sm w-full"
                                    placeholder="—"
                                />
                            )}
                        />




                        <Column
                            header="Actions"
                            style={{ width: '6rem' }}
                            body={(row) => (
                                <div className="flex items-center gap-2">

                                    <Button
                                        variant="ghost"
                                        onClick={() => handleRemoveTask(row)}
                                        className="w-7 h-7 !p-0 flex items-center justify-center"
                                        title="Remove task"
                                    >
                                        <Trash2 size={15} className="text-red-500" />
                                    </Button>
                                </div>
                            )}
                        />
                    </DataTable>
                </div>

            </div>
        </PageLayout>
    );
}
