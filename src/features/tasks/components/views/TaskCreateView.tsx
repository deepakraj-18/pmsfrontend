import React, { useState, useEffect } from 'react';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { FieldError } from '@/components/forms/FieldError';
import { SectionDivider } from '@/components/forms/SectionDivider';
import { PremiumFormHeader } from '@/components/forms/PremiumFormHeader';
import { inputCls } from '@/components/forms/FormStyles';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/providers/ToastContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTaskActions } from '@/features/tasks/hooks/useTaskActions';
import { useTaskListActions } from '@/features/tasklists/hooks/useTaskListActions';
import { formatLocalDate } from '@/utils/dateHelpers';
import { handleServerError } from '@/utils/errorHelpers';
import ServerSearchDropdown from '@/components/core/ServerSearchDropdown';
import { ServerLookupDropdown } from '@/components/core/ServerLookupDropdown';
import { FilteredStatusSelect } from '@/components/core/FilteredStatusSelect';
import { useQuery } from '@tanstack/react-query';
import { projectsService } from '@/features/projects/api/projects.api';
import { UserMultiSelect } from '@/components/core/UserMultiSelect';
import { UserAutocomplete } from '@/components/core/UserAutocomplete';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { RadioButton } from 'primereact/radioButton';
import { motion } from 'framer-motion';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { Button } from '@/components/forms/Button';
import { classNames } from 'primereact/utils';
import {
    ClipboardList, Plus, AlertCircle, Hash, User2, Users,
    Calendar as CalIcon, Briefcase, Tag, Timer, ChevronDown, Milestone, Lock, Check
} from 'lucide-react';

const BILLING_TYPES = [
    { label: 'Billable', value: 'Billable', icon: '💰' },
    { label: 'Non-Billable', value: 'Non-Billable', icon: '🔒' },
    { label: 'Internal', value: 'Internal', icon: '🏢' },
];

const PRIORITY_OPTIONS = [
    { label: 'Critical', value: 'Critical', color: '#ef4444' },
    { label: 'High', value: 'High', color: '#f97316' },
    { label: 'Medium', value: 'Medium', color: '#eab308' },
    { label: 'Low', value: 'Low', color: '#22c55e' },
];

const taskSchema = z.object({
    task_name: z.string().trim().min(1, 'Task name is required').max(250, 'Task name cannot exceed 250 characters'),
    project_id: z.any().refine(v => !!v, { message: 'Project is required' }),
    task_list_id: z.any().optional(),
    associated_team_id: z.any().optional(),
    status_id: z.any().refine(v => !!v, { message: 'Status is required' }),
    priority_id: z.any().refine(v => !!v, { message: 'Priority is required' }),

    owners: z.array(z.any()).min(1, 'At least one owner is required'),
    tags: z.string().optional(),
    start_date: z.any().refine(v => !!v, { message: 'Start Date is required' }),
    due_date: z.any().refine(v => !!v, { message: 'Due Date is required' }),
    milestone_id: z.any().optional(),
    duration: z.any().optional(),
    estimated_hours: z.any().optional(),
    work_hours: z.any().optional(),
    billing_type: z.string().optional(),
    description: z.string().optional(),
}).refine(
    (data) => {
        if (data.start_date && data.due_date) {
            const start = data.start_date instanceof Date ? data.start_date : new Date(data.start_date);
            const end = data.due_date instanceof Date ? data.due_date : new Date(data.due_date);
            return end >= start;
        }
        return true;
    },
    { message: 'Due Date cannot be earlier than Start Date', path: ['due_date'] }
);

type TaskFormData = z.infer<typeof taskSchema>;



export function TaskCreateView() {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const presetProjectId = searchParams.get('project_id');

    const { createTask } = useTaskActions();
    const { createTaskList: addTaskList } = useTaskListActions();
    const [newTaskListName, setNewTaskListName] = useState('');
    const [showTaskListInput, setShowTaskListInput] = useState(false);
    const [creatingTaskList, setCreatingTaskList] = useState(false);
    const [showMilestoneHint, setShowMilestoneHint] = useState(false);

    const { data: presetProject } = useQuery({
        queryKey: ['projects', 'detail', Number(presetProjectId)],
        queryFn: () => projectsService.getProject(Number(presetProjectId)),
        enabled: !!presetProjectId,
        staleTime: 5 * 60 * 1000,
    });

    const { control, handleSubmit, watch, setValue, register, setError, formState: { errors, isSubmitting } } = useForm<TaskFormData>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            task_name: '',
            billing_type: 'Billable',

            owners: [],
            start_date: new Date(),
        }
    });

    useEffect(() => {
        if (presetProject) {
            setValue('project_id', presetProject);
        }
    }, [presetProject, setValue]);

    const watchProjectId = watch('project_id');
    const watchTaskListId = watch('task_list_id');
    const watchBilling = watch('billing_type');
    const watchStartDate = watch('start_date');

    const extractId = (val: any) => val && typeof val === 'object' ? val.id : val;

    const handleCreateTaskList = async () => {
        if (!newTaskListName.trim() || !watchProjectId) return;
        setCreatingTaskList(true);
        try {
            const result = await addTaskList.mutateAsync({ name: newTaskListName.trim(), project_id: extractId(watchProjectId) });
            setValue('task_list_id', result);
            setNewTaskListName('');
            setShowTaskListInput(false);
        } catch (err) {
        } finally {
            setCreatingTaskList(false);
        }
    };

    const onSubmit = async (data: any) => {
        try {
            const payload = {
                task_name: data.task_name,
                description: data.description,
                project_id: extractId(data.project_id),
                milestone_id: extractId(data.milestone_id),
                task_list_id: extractId(data.task_list_id),
                associated_team_id: extractId(data.associated_team_id),
                status_id: extractId(data.status_id),
                priority_id: extractId(data.priority_id),
                owner_emails: (data.owners || []).map((o: any) => o.mail || o.email).filter(Boolean),
                assignee_emails: (data.owners || []).map((o: any) => o.mail || o.email).filter(Boolean),
                tags: data.tags || null,
                estimated_hours: data.estimated_hours ? parseFloat(data.estimated_hours) : null,
                work_hours: data.work_hours ? parseFloat(data.work_hours) : null,
                start_date: formatLocalDate(data.start_date),
                due_date: formatLocalDate(data.due_date),
                duration: data.duration || null,
                billing_type: data.billing_type || 'Billable',
            };
            await createTask.mutateAsync(payload);
            if (presetProjectId) {
                navigate(`/projects/${presetProjectId}?tab=Tasks`);
            } else {
                navigate(-1);
            }
        } catch (err: any) {
            console.error(err);
            handleServerError(err, setError, showToast, 'Task Creation Failed', true);
        }
    };

    return (
        <PageLayout title="Create New Task" showBackButton backPath={watchProjectId ? `/projects/${extractId(watchProjectId)}?tab=Tasks` : "/tasks"}>
            <form onSubmit={handleSubmit(onSubmit)} className="max-w-[980px] mx-auto pb-16 px-4 overflow-hidden">
                {errors.root && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
                        <AlertCircle size={16} />
                        <span>{errors.root.message}</span>
                    </div>
                )}

                <PremiumFormHeader
                    icon={ClipboardList}
                    title="Create Task"
                    subtitle="Fill in task details, assign members, and set deadlines"
                    color="cyan"
                />

                <div className="rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-premium)' }}>

                    <SectionDivider title="Core Information" />

                    <div className="lg:col-span-3">
                        <FieldLabel label="Task Name" required icon={<ClipboardList size={11} />} />
                        <InputText
                            {...register('task_name')}
                            placeholder="e.g. Implement login API"
                            className={inputCls(!!errors.task_name)}
                            style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)', height: '44px' }}
                        />
                        <FieldError message={errors.task_name?.message} />
                    </div>

                    <div>
                        <FieldLabel label="Project" required icon={<Briefcase size={11} />} />
                        {presetProject ? (
                            <div
                                className="flex items-center gap-2.5 px-4 rounded-xl h-[44px] text-[13px] font-medium"
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                            >
                                <Lock size={13} className="flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                                <span className="truncate">{presetProject.project_name}</span>
                            </div>
                        ) : (
                            <Controller name="project_id" control={control} render={({ field }) => (
                                <ServerSearchDropdown entityType="projects" value={field.value}
                                    onChange={(v) => { field.onChange(v); setValue('task_list_id', null); }}
                                    placeholder="Select Project" />
                            )} />
                        )}
                        <FieldError message={errors.project_id?.message as string} />
                    </div>

                    <div>
                        <FieldLabel label="Task List" />
                        {showTaskListInput ? (
                            <div className="flex gap-2">
                                <InputText value={newTaskListName}
                                    onChange={(e) => setNewTaskListName(e.target.value)}
                                    placeholder="New task list name…"
                                    className={inputCls()}
                                    style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)', height: '44px' }}
                                    autoFocus
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateTaskList(); } }}
                                />
                                <Button type="button" onClick={handleCreateTaskList} loading={creatingTaskList} size="sm"
                                    className="!text-[10px] !px-3 !h-8 !rounded-lg !bg-[hsl(160,60%,45%)] !border-none !text-white">
                                    Save
                                </Button>
                                <Button type="button" onClick={() => setShowTaskListInput(false)} variant="outline" size="sm"
                                    className="!w-8 !h-8 !p-0 !rounded-lg !border-[var(--border-color)] !text-[var(--text-muted)]">
                                    ✕
                                </Button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Controller name="task_list_id" control={control} render={({ field }) => (
                                        <ServerSearchDropdown entityType="tasklists" value={field.value} onChange={field.onChange}
                                            placeholder="Select Task List" disabled={!watchProjectId}
                                            filters={watchProjectId ? { project_id: extractId(watchProjectId) } : {}} />
                                    )} />
                                </div>
                                <Button type="button" disabled={!watchProjectId} onClick={() => setShowTaskListInput(true)} variant="outline" size="sm"
                                    className="!h-10 !px-4 !rounded-xl !border-[hsl(160,60%,45%)] !text-[hsl(160,60%,45%)]">
                                    <Plus size={11} className="mr-1" /> New
                                </Button>
                            </div>
                        )}
                    </div>

                    <div>
                        <FieldLabel label="Associated Team" />
                        <Controller name="associated_team_id" control={control} render={({ field }) => (
                            <ServerSearchDropdown entityType="teams" value={field.value} onChange={field.onChange} placeholder="Select Team" />
                        )} />
                    </div>

                    <div 
                        onMouseEnter={() => setShowMilestoneHint(true)} 
                        onMouseLeave={() => setShowMilestoneHint(false)}
                        className="relative"
                    >
                        <FieldLabel label="Milestone" icon={<Milestone size={11} />} />
                        <Controller name="milestone_id" control={control} render={({ field }) => (
                            <ServerSearchDropdown
                                entityType="milestones"
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select Milestone"
                                disabled={!watchProjectId || !watchTaskListId}
                                filters={watchProjectId ? { project_id: extractId(watchProjectId) } : {}}
                            />
                        )} />
                        {showMilestoneHint && !watchTaskListId && watchProjectId && (
                            <motion.p 
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[10px] mt-1.5 font-bold uppercase tracking-tight text-amber-600 dark:text-amber-500 flex items-center gap-1 absolute top-full left-0 z-10 bg-[var(--bg-card)] py-1 px-2 rounded-md shadow-sm border border-amber-200 dark:border-amber-900/50"
                            >
                                <AlertCircle size={10} /> Select Task List First
                            </motion.p>
                        )}
                    </div>

                    <SectionDivider title="Status & Priority" />

                    <div>
                        <FieldLabel label="Status" required icon={<Tag size={11} />} />
                        <Controller name="status_id" control={control} render={({ field }) => (
                            <ServerLookupDropdown category="TaskStatus" value={field.value} onChange={field.onChange} placeholder="Select Status" />
                        )} />
                        <FieldError message={errors.status_id?.message as string} />
                    </div>

                    <div>
                        <FieldLabel label="Priority" required icon={<Tag size={11} />} />
                        <Controller name="priority_id" control={control} render={({ field }) => (
                            <ServerLookupDropdown category="TaskPriority" value={field.value} onChange={field.onChange} placeholder="Select Priority" />
                        )} />
                        <FieldError message={errors.priority_id?.message as string} />
                    </div>

                    <div>
                        <FieldLabel label="Tags" icon={<Tag size={11} />} />
                        <InputText {...register('tags')} placeholder="e.g. api, frontend, urgent"
                            className={inputCls()} style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)', height: '44px' }} />
                    </div>



                    <SectionDivider title="Owners" />

                    <div className="lg:col-span-3">
                        <FieldLabel label="Task Owner" required icon={<User2 size={11} />} />
                        <Controller name="owners" control={control} render={({ field }) => (
                            <UserMultiSelect value={field.value} onChange={field.onChange} placeholder="Search owners…" />
                        )} />
                        <FieldError message={errors.owners?.message as string} />
                    </div>

                    <SectionDivider title="Schedule" />

                    <div>
                        <FieldLabel label="Start Date" required icon={<CalIcon size={11} />} />
                        <Controller name="start_date" control={control} render={({ field }) => (
                            <Calendar value={field.value} onChange={(e) => field.onChange(e.value)}
                                dateFormat="dd/mm/yy" showIcon showButtonBar
                                className="form-calendar w-full"
                                placeholder="DD/MM/YYYY" />
                        )} />
                        <FieldError message={errors.start_date?.message as string} />
                    </div>

                    <div>
                        <FieldLabel label="Due Date" required icon={<CalIcon size={11} />} />
                        <Controller name="due_date" control={control} render={({ field }) => (
                            <Calendar value={field.value} onChange={(e) => field.onChange(e.value)}
                                dateFormat="dd/mm/yy" showIcon showButtonBar
                                className="form-calendar w-full"
                                placeholder="DD/MM/YYYY"
                                minDate={watchStartDate instanceof Date ? watchStartDate : watchStartDate ? new Date(watchStartDate) : undefined} />
                        )} />
                        <FieldError message={errors.due_date?.message as string} />
                    </div>

                    <div>
                        <FieldLabel label="Duration (days)" />
                        <InputText type="number" min="0" {...register('duration')}
                            placeholder="Auto-calc from dates"
                            className={inputCls()} style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)', height: '44px' }} />
                    </div>

                    <SectionDivider title="Hours & Billing" />

                    <div>
                        <FieldLabel label="Work Hours (Planned)" icon={<Timer size={11} />} />
                        <InputText type="number" step="0.5" min="0" {...register('estimated_hours')}
                            placeholder="e.g. 40" className={inputCls()}
                            style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)', height: '44px' }} />
                    </div>

                    <div>
                        <FieldLabel label="Actual Work Hours" icon={<Timer size={11} />} />
                        <InputText type="number" step="0.5" min="0" {...register('work_hours')}
                            placeholder="e.g. 32.5" className={inputCls()}
                            style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)', height: '44px' }} />
                    </div>



                    <div className="lg:col-span-3">
                        <FieldLabel label="Billing Type" />
                        <div className="flex gap-3 flex-wrap mt-1">
                            {BILLING_TYPES.map(opt => {
                                const isSelected = watchBilling === opt.value;
                                return (
                                    <label key={opt.value} className="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer border transition-all text-sm font-medium select-none group relative overflow-hidden"
                                        style={{
                                            background: isSelected ? 'hsl(160 60% 45% / 0.12)' : 'var(--bg-secondary)',
                                            border: `1.5px solid ${isSelected ? 'hsl(160 60% 45%)' : 'var(--border-color)'}`,
                                            color: isSelected ? 'hsl(160 60% 40%)' : 'var(--text-primary)',
                                        }}>
                                        <Controller name="billing_type" control={control} render={({ field }) => (
                                            <input
                                                type="radio"
                                                className="sr-only"
                                                value={opt.value}
                                                checked={field.value === opt.value}
                                                onChange={() => field.onChange(opt.value)}
                                            />
                                        )} />
                                        <span className="flex-shrink-0">{opt.icon}</span>
                                        <span className="flex-1">{opt.label}</span>

                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div className="lg:col-span-3">
                        <FieldLabel label="Description" />
                        <InputTextarea {...register('description')} rows={3}
                            placeholder="Detailed description, acceptance criteria, or notes…"
                            className={inputCls()} style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)', resize: 'vertical' }} />
                    </div>
                </div>

                <div className="flex items-center justify-between pt-5 mt-5" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <Button variant="ghost" type="button" onClick={() => navigate(watchProjectId ? `/projects/${extractId(watchProjectId)}?tab=Tasks` : '/tasks')}>Cancel</Button>
                    <Button variant="gradient" type="submit" loading={createTask.isPending || isSubmitting}>
                        {createTask.isPending ? 'Creating…' : 'Create Task'}
                    </Button>
                </div>
            </form>
        </PageLayout>
    );
}
