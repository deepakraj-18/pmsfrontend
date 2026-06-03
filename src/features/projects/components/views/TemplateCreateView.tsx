import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import {
    LayoutTemplate, Plus, Trash2, GripVertical,
    FileText, Clock, AlertCircle, ChevronLeft,
} from 'lucide-react';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { Button } from '@/components/forms/Button';
import { FieldError } from '@/components/forms/FieldError';
import { inputCls } from '@/components/forms/FormStyles';
import { handleServerError } from '@/utils/errorHelpers';
import { useToast } from '@/providers/ToastContext';
import { useCreateTemplate } from '../../hooks/useTemplates';
import type { TemplateTaskCreate } from '../../types/template.types';

const BILLING_OPTIONS = [
    { label: 'Billable', value: 'Billable' },
    { label: 'Non-Billable', value: 'NonBillable' },
    { label: 'Internal', value: 'Internal' },
];

const TEAL = 'hsl(160 60% 45%)';

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
    return (
        <label className="flex items-center gap-1 text-[11px] font-bold mb-1.5 tracking-widest uppercase"
            style={{ color: 'var(--text-muted)' }}>
            {label}
            {required && <span className="text-red-500 text-[13px] leading-none ml-0.5">*</span>}
        </label>
    );
}

interface TaskRowDraft extends TemplateTaskCreate {
    _key: string;
}

function newTaskDraft(): TaskRowDraft {
    return {
        _key: crypto.randomUUID(),
        title: '',
        description: '',
        estimated_hours: undefined,
        duration: undefined,
        order_index: 0,
    };
}

export function TemplateCreateView() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { mutateAsync: createTemplate, isPending } = useCreateTemplate();
    const { register, handleSubmit, formState: { errors }, watch, setValue, setError } = useForm({
        defaultValues: {
            name: '',
            description: '',
            is_public: true,
        },
    });

    const [tasks, setTasks] = useState<TaskRowDraft[]>([newTaskDraft()]);
    const [editingKey, setEditingKey] = useState<string | null>(null);


    const addTask = () => {
        const draft = newTaskDraft();
        setTasks(prev => [...prev, draft]);
        setEditingKey(draft._key);
    };

    const removeTask = (key: string) => {
        setTasks(prev => prev.filter(t => t._key !== key));
    };

    const updateTask = (key: string, field: keyof TemplateTaskCreate, value: any) => {
        setTasks(prev => prev.map(t => t._key === key ? { ...t, [field]: value } : t));
    };


    const onSubmit = async (formData: any) => {
        try {
            const validTasks = tasks
                .filter(t => t.title.trim())
                .map((t, i) => ({
                    title: t.title.trim(),
                    description: t.description || undefined,
                    estimated_hours: t.estimated_hours || undefined,
                    duration: t.duration || undefined,
                    order_index: i,
                }));

            await createTemplate({
                name: formData.name,
                description: formData.description || undefined,
                is_public: formData.is_public,
                tasks: validTasks,
            });
            navigate('/templates');
        } catch (err: any) {
            console.error(err);
            handleServerError(err, setError, showToast, 'Creation Failed', true);
        }
    };

    const taskEditor = (task: TaskRowDraft) => (
        <div
            className="rounded-xl p-4 mt-1"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
            onClick={e => e.stopPropagation()}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                    <FieldLabel label="Task Name" required />
                    <InputText
                        value={task.title}
                        onChange={e => updateTask(task._key, 'title', e.target.value)}
                        placeholder="e.g. Requirements gathering"
                        className="w-full text-sm"
                    />
                </div>
                <div className="md:col-span-2">
                    <FieldLabel label="Description" />
                    <InputTextarea
                        value={task.description || ''}
                        onChange={e => updateTask(task._key, 'description', e.target.value)}
                        placeholder="Optional task description…"
                        rows={2}
                        className="w-full text-sm"
                        autoResize
                    />
                </div>
                <div>
                    <FieldLabel label="Estimated Hours" />
                    <InputNumber
                        value={task.estimated_hours ?? null}
                        onValueChange={e => updateTask(task._key, 'estimated_hours', e.value ?? undefined)}
                        minFractionDigits={0} maxFractionDigits={1}
                        min={0} suffix="h" className="w-full"
                        inputClassName="text-sm"
                    />
                </div>

            </div>
        </div>
    );

    return (
        <PageLayout
            title="Create Project Template"
            subtitle="Define a reusable template with default tasks"
            actions={
                <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}
                    onClick={() => navigate('/templates')}>
                    Back
                </Button>
            }
        >
            <form onSubmit={handleSubmit(onSubmit)} className="max-w-5xl mx-auto px-4 py-6 space-y-6">
                {errors.root && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
                        <AlertCircle size={16} />
                        <span>{errors.root.message}</span>
                    </div>
                )}

                { }
                <div
                    className="rounded-2xl p-6 space-y-5"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1 h-5 rounded-full" style={{ background: TEAL }} />
                        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                            Template Details
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <FieldLabel label="Template Name" required />
                            <InputText
                                {...register('name', { required: 'Template name is required' })}
                                placeholder="e.g. Software Development Lifecycle"
                                className={inputCls(!!errors.name)}
                            />
                            <FieldError message={errors.name?.message as string} />
                        </div>

                        <div className="md:col-span-2">
                            <FieldLabel label="Description" />
                            <InputTextarea
                                {...register('description')}
                                placeholder="What kind of projects is this template for?"
                                rows={2}
                                className="w-full"
                                autoResize
                            />
                        </div>

                        <div />

                        <div className="flex items-center gap-3 pt-6">
                            <Checkbox
                                inputId="is_public"
                                checked={watch('is_public')}
                                onChange={e => setValue('is_public', !!e.checked)}
                            />
                            <div>
                                <label htmlFor="is_public" className="text-sm font-semibold cursor-pointer"
                                    style={{ color: 'var(--text-primary)' }}>
                                    Public Template
                                </label>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    Visible to all users when creating projects
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                { }
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                >
                    { }
                    <div className="flex items-center justify-between px-5 py-4"
                        style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-5 rounded-full" style={{ background: TEAL }} />
                            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                                Default Tasks
                            </span>
                            <span className="ml-2 px-2 py-0.5 text-[11px] font-bold rounded-full"
                                style={{ background: `${TEAL}22`, color: TEAL }}>
                                {tasks.filter(t => t.title.trim()).length}
                            </span>
                        </div>
                        <Button variant="gradient" size="sm" icon={<Plus size={13} />} onClick={addTask} type="Button">
                            Add Task
                        </Button>
                    </div>

                    { }
                    <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                        {tasks.length === 0 && (
                            <div className="flex flex-col items-center py-12 gap-3" style={{ color: 'var(--text-muted)' }}>
                                <FileText size={32} strokeWidth={1.2} />
                                <p className="text-sm">No tasks yet. Click "Add Task" to build your template.</p>
                            </div>
                        )}

                        {tasks.map((task, idx) => (
                            <div key={task._key}>
                                { }
                                <div
                                    className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                                    style={{
                                        background: editingKey === task._key ? 'var(--bg-secondary)' : undefined,
                                    }}
                                    onClick={() => setEditingKey(editingKey === task._key ? null : task._key)}
                                >
                                    <GripVertical size={14} className="opacity-30 flex-shrink-0" />
                                    <span className="text-xs font-bold w-6 text-center flex-shrink-0"
                                        style={{ color: 'var(--text-muted)' }}>
                                        {idx + 1}
                                    </span>
                                    {task.title.trim() ? (
                                        <span className="text-sm font-semibold flex-1 truncate"
                                            style={{ color: 'var(--text-primary)' }}>
                                            {task.title}
                                        </span>
                                    ) : (
                                        <span className="text-sm flex-1 italic" style={{ color: 'var(--text-muted)' }}>
                                            Untitled task — click to edit
                                        </span>
                                    )}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {task.estimated_hours && (
                                            <span className="flex items-center gap-1 text-[11px]"
                                                style={{ color: TEAL }}>
                                                <Clock size={11} />{task.estimated_hours}h
                                            </span>
                                        )}
                                        <Button
                                            type="Button"
                                            onClick={e => { e.stopPropagation(); removeTask(task._key); }}
                                            className="p-1 rounded hover:bg-red-500/10 transition-colors"
                                            style={{ color: '#ef4444' }}
                                        >
                                            <Trash2 size={13} />
                                        </Button>
                                    </div>
                                </div>

                                { }
                                {editingKey === task._key && (
                                    <div className="px-4 pb-4">
                                        {taskEditor(task)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                { }
                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={() => navigate('/templates')} type="Button">
                        Cancel
                    </Button>
                    <Button variant="gradient" type="submit" loading={isPending}>
                        Create Template
                    </Button>
                </div>
            </form>
        </PageLayout>
    );
}
