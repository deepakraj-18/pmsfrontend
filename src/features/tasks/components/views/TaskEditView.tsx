import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/providers/ToastContext';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { ConfirmationModal } from '@/components/core/ConfirmationModal';
import { Button } from '@/components/forms/Button';
import { SectionLoadingIndicator } from '@/components/feedback/Loader/SectionLoadingIndicator';
import { Trash2, ClipboardEdit, ClipboardList, Layers, Tag, User2, Users, Calendar as CalIcon, Timer, Hash, Briefcase, Milestone as MilestoneIcon, Check, AlertCircle } from 'lucide-react';
import { useTaskActions } from '@/features/tasks/hooks/useTaskActions';
import { tasksService } from '@/features/tasks/api/tasks.api';
import { formatLocalDate } from '@/utils/dateHelpers';
import { handleServerError } from '@/utils/errorHelpers';
import ServerSearchDropdown from '@/components/core/ServerSearchDropdown';
import { ServerLookupDropdown } from '@/components/core/ServerLookupDropdown';
import { UserMultiSelect } from '@/components/core/UserMultiSelect';
import { FilteredStatusSelect } from '@/components/core/FilteredStatusSelect';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { FieldError } from '@/components/forms/FieldError';
import { SectionDivider } from '@/components/forms/SectionDivider';
import { PremiumFormHeader } from '@/components/forms/PremiumFormHeader';
import { inputCls } from '@/components/forms/FormStyles';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { RadioButton } from 'primereact/radioButton';
import { motion } from 'framer-motion';

const BILLING_TYPES = [
  { label: 'Billable', value: 'Billable', icon: '💰' },
  { label: 'Non-Billable', value: 'Non-Billable', icon: '🤝' },
  { label: 'Internal', value: 'Internal', icon: '🏢' },
];

const taskSchema = z.object({
  task_name: z.string().trim().min(1, 'Task name is required').max(250, 'Task name cannot exceed 250 characters'),
  project_id: z.any().refine((v) => !!v, { message: 'Project is required' }),
  task_list_id: z.any().optional(),
  milestone_id: z.any().optional(),
  associated_team_id: z.any().optional(),
  status_id: z.any().refine((v) => !!v, { message: 'Status is required' }),
  priority_id: z.any().refine((v) => !!v, { message: 'Priority is required' }),

  owners: z.array(z.any()).min(1, 'At least one owner is required'),
  estimated_hours: z.string().or(z.number()).optional(),
  work_hours: z.string().or(z.number()).optional(),
  duration: z.string().or(z.number()).optional(),
  start_date: z.any().refine((v) => !!v, { message: 'Start Date is required' }),
  due_date: z.any().refine((v) => !!v, { message: 'Due Date is required' }),
  completion_date: z.any().optional().nullable(),
  tags: z.string().optional().nullable(),
  billing_type: z.string().optional(),
  description: z.string().optional().nullable()
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

const extractId = (val: any) => (val && typeof val === 'object' ? val.id : val);

export function TaskEditView() {
  const { showToast } = useToast();
  const { taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { updateTask, deleteTask } = useTaskActions();

  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [taskPublicId, setTaskPublicId] = useState('');
  const [dbStatusName, setDbStatusName] = useState('');
  const [showMilestoneHint, setShowMilestoneHint] = useState(false);

  const { control, register, handleSubmit, watch, setValue, reset, formState: { errors, isValid } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    mode: 'onChange',
    defaultValues: {
      task_name: '',

      owners: [],
    }
  });

  const watchProjectId = watch('project_id');
  const watchTaskListId = watch('task_list_id');

  const watchOwners = watch('owners') || [];
  const watchStartDate = watch('start_date');
  const watchDueDate = watch('due_date');
  const watchBilling = watch('billing_type');

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!taskId) return;
        const task: any = await tasksService.getTask(parseInt(taskId, 10));
        setTaskPublicId(task.public_id || `TSK-${task.id}`);
        setDbStatusName(task.status?.name || task.status || '');

        reset({
          task_name: task.task_name || '',
          description: task.description || '',
          project_id: task.project || task.project_id || null,
          task_list_id: task.task_list || task.task_list_id || null,
          milestone_id: task.milestone || task.milestone_id || null,
          associated_team_id: task.associated_team || task.associated_team_id || null,
          status_id: task.status_id || null,
          priority_id: task.priority_id || null,

          owners: task.owners || [],
          start_date: task.start_date ? new Date(task.start_date) : null,
          due_date: task.due_date ? new Date(task.due_date) : null,
          completion_date: task.completion_date ? new Date(task.completion_date) : null,
          estimated_hours: task.estimated_hours?.toString() || '',
          work_hours: task.work_hours?.toString() || '',
          duration: task.duration?.toString() || '',
          tags: task.tags || '',
          billing_type: task.billing_type || 'Billable',
        });
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [taskId, reset]);

  const onSubmit = async (data: any) => {
    if (!taskId) return;
    setSubmitting(true);
    try {
      const payload = {
        task_name: data.task_name,
        description: data.description || null,
        project_id: extractId(data.project_id),
        task_list_id: extractId(data.task_list_id),
        milestone_id: extractId(data.milestone_id) || null,
        associated_team_id: extractId(data.associated_team_id) || null,
        status_id: extractId(data.status_id),
        priority_id: extractId(data.priority_id),
        owner_emails: (data.owners || []).map((o: any) => o.mail || o.email).filter(Boolean),
        assignee_emails: (data.owners || []).map((o: any) => o.mail || o.email).filter(Boolean),
        estimated_hours: data.estimated_hours ? parseFloat(data.estimated_hours as string) : null,
        work_hours: data.work_hours ? parseFloat(data.work_hours as string) : null,
        duration: data.duration ? parseInt(data.duration as string, 10) : null,
        start_date: formatLocalDate(data.start_date),
        due_date: formatLocalDate(data.due_date),
        completion_date: formatLocalDate(data.completion_date),
        tags: data.tags || null,
        billing_type: data.billing_type || 'Billable',
      };

      await updateTask.mutateAsync({ id: parseInt(taskId, 10), data: payload });
      if (window.history.state && window.history.state.idx > 0) navigate(-1); else navigate(`/tasks/${taskId}`, { replace: true });
    } catch (error: any) {
      console.error('Failed to update task:', error);
      handleServerError(error, setError, showToast, 'Update Failed', true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const onConfirmDelete = async () => {
    try {
      if (taskId) {
        await deleteTask.mutateAsync(parseInt(taskId, 10));

        setTimeout(() => {
          const fromPath = (location.state as any)?.from;
          if (fromPath) {
            navigate(fromPath);
          } else {
            navigate('/tasks');
          }
        }, 500);
      }
    } catch { } finally {
      setShowDeleteModal(false);
    }
  };

  if (loading) return <SectionLoadingIndicator fullPage label="Loading task data…" />;

  return (
    <>
      <ConfirmationModal
        visible={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={onConfirmDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete Task"
        variant="danger"
        loading={deleteTask.isPending}
      />
      <PageLayout
        title="Edit Task"
        showBackButton onBack={() => { if (window.history.state && window.history.state.idx > 0) navigate(-1); else navigate(`/tasks/${taskId}`, { replace: true }); }}
        actions={<Button variant="danger" type="button" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" />Delete Task</Button>}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-[980px] mx-auto pb-16 px-4 overflow-hidden">
          {errors.root && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle size={16} />
              <span>{errors.root.message}</span>
            </div>
          )}

          <PremiumFormHeader
            icon={ClipboardEdit}
            title="Edit Task Details"
            subtitle={`Modifying ${taskPublicId}`}
            color="cyan"
          />

          <div className="rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-premium)' }}>

            <SectionDivider title="Task Identification" />

            <div className="lg:col-span-3">
              <FieldLabel label="Task Title" required icon={<ClipboardList size={11} />} />
              <InputText {...register('task_name')} placeholder="Brief title of the task"
                className={inputCls(!!errors.task_name)}
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              <FieldError message={errors.task_name?.message} />
            </div>

            <div>
              <FieldLabel label="Project" required />
              <Controller name="project_id" control={control} render={({ field }) => (
                <ServerSearchDropdown entityType="projects" value={field.value} onChange={(v) => { field.onChange(v); setValue('task_list_id', null); }} placeholder="Select Project" />
              )} />
            </div>

            <div>
              <FieldLabel label="Task List" icon={<Layers size={11} />} />
              <Controller name="task_list_id" control={control} render={({ field }) => (
                <ServerSearchDropdown
                  entityType="tasklists"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select Task List"
                  filters={watchProjectId ? { project_id: extractId(watchProjectId) } : {}}
                  disabled={!watchProjectId}
                />
              )} />
            </div>

            <div 
              onMouseEnter={() => setShowMilestoneHint(true)} 
              onMouseLeave={() => setShowMilestoneHint(false)}
              className="relative"
            >
              <FieldLabel label="Milestone" icon={<MilestoneIcon size={11} />} />
              <Controller name="milestone_id" control={control} render={({ field }) => (
                <ServerSearchDropdown
                  entityType="milestones"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select Milestone"
                  filters={watchProjectId ? { project_id: extractId(watchProjectId) } : {}}
                  disabled={!watchProjectId || !watchTaskListId}
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

            <div>
              <FieldLabel label="Associated Team" icon={<Briefcase size={11} />} />
              <Controller name="associated_team_id" control={control} render={({ field }) => (
                <ServerSearchDropdown
                  entityType="teams"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select Team"
                />
              )} />
            </div>

            <SectionDivider title="Triage & Status" />

            <div>
              <FieldLabel label="Status" required icon={<Tag size={11} />} />
              <Controller name="status_id" control={control} render={({ field }) => (
                <ServerLookupDropdown category="TaskStatus" value={field.value} onChange={field.onChange} placeholder="Select Status" />
              )} />
            </div>

            <div>
              <FieldLabel label="Priority" required />
              <Controller name="priority_id" control={control} render={({ field }) => (
                <ServerLookupDropdown category="TaskPriority" value={field.value} onChange={field.onChange} placeholder="Select Priority" />
              )} />
            </div>


            <div>
              <FieldLabel label="Tags" icon={<Hash size={11} />} />
              <InputText {...register('tags')}
                placeholder="e.g. frontend, critical, sprint-1"
                className={inputCls()}
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            </div>

            <SectionDivider title="Assignment" />

            <div>
              <FieldLabel label="Task Owner" required icon={<User2 size={11} />} />
              <UserMultiSelect value={watchOwners} onChange={(users) => setValue('owners', users, { shouldDirty: true })} placeholder="Search owners…" />
              <FieldError message={errors.owners?.message as string} />
            </div>



            <div />

            <SectionDivider title="Time & Schedule" />

            <div>
              <FieldLabel label="Start Date" required icon={<CalIcon size={11} />} />
              <Controller name="start_date" control={control} render={({ field }) => (
                <Calendar value={field.value} onChange={(e) => field.onChange(e.value)}
                  dateFormat="dd/mm/yy" showIcon showButtonBar className="w-full"
                  inputClassName="w-full rounded-xl px-3 py-2.5 text-sm" placeholder="DD/MM/YYYY" />
              )} />
            </div>

            <div>
              <FieldLabel label="Due Date" required icon={<CalIcon size={11} />} />
              <Controller name="due_date" control={control} render={({ field }) => (
                <Calendar value={field.value} onChange={(e) => field.onChange(e.value)}
                  dateFormat="dd/mm/yy" showIcon showButtonBar className="w-full"
                  inputClassName="w-full rounded-xl px-3 py-2.5 text-sm" placeholder="DD/MM/YYYY"
                  minDate={watchStartDate instanceof Date ? watchStartDate : watchStartDate ? new Date(watchStartDate) : undefined} />
              )} />
              <FieldError message={errors.due_date?.message as string} />
            </div>

            <div>
              <FieldLabel label="Completion Date" icon={<CalIcon size={11} />} />
              <Controller name="completion_date" control={control} render={({ field }) => (
                <Calendar value={field.value} onChange={(e) => field.onChange(e.value)}
                  dateFormat="dd/mm/yy" showIcon showButtonBar className="w-full"
                  inputClassName="w-full rounded-xl px-3 py-2.5 text-sm" placeholder="DD/MM/YYYY" />
              )} />
            </div>

            <div>
              <FieldLabel label="Duration (days)" />
              <InputText type="number" min="0" {...register('duration')}
                placeholder="Auto-calc from dates" className={inputCls(!!errors.duration)}
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', height: '44px' }} />
            </div>

            <SectionDivider title="Hours & Billing" />

            <div>
              <FieldLabel label="Estimated Hours" icon={<Timer size={11} />} />
              <InputText type="number" step="0.1" min="0" {...register('estimated_hours')}
                placeholder="e.g. 4.5" className={inputCls(!!errors.estimated_hours)}
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            </div>

            <div>
              <FieldLabel label="Actual Work Hours" icon={<Timer size={11} />} />
              <InputText type="number" step="0.5" min="0" {...register('work_hours')}
                placeholder="e.g. 32.5" className={inputCls(!!errors.work_hours)}
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
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

            <SectionDivider title="Details" />

            <div className="lg:col-span-3">
              <FieldLabel label="Description" />
              <InputTextarea {...register('description')} rows={5}
                placeholder="Provide a detailed description of this task…"
                className={inputCls(!!errors.description)} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical' }} />
            </div>
          </div>

          <div className="flex items-center justify-between pt-5 mt-5" style={{ borderTop: '1px solid var(--border-color)' }}>
            <Button variant="ghost" type="button" onClick={() => { if (window.history.state && window.history.state.idx > 0) navigate(-1); else navigate(`/tasks/${taskId}`, { replace: true }); }}>Cancel</Button>
            <Button variant="gradient" type="submit" loading={submitting}>
              {submitting ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </PageLayout>
    </>
  );
}
