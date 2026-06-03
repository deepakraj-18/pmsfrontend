import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { Button } from '@/components/forms/Button';
import { FolderKanban, Briefcase, User2, AlignLeft, Settings, Database, Clock, Users, Tag, Building2, Layers, Copy, Trash2, AlertCircle } from 'lucide-react';
import { projectsService } from '@/features/projects/api/projects.api';
import { useProjectActions } from '@/features/projects/hooks/useProjectActions';
import { UserAutocomplete } from '@/components/core/UserAutocomplete';
import { UserMultiSelect } from '@/components/core/UserMultiSelect';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { FieldError } from '@/components/forms/FieldError';
import { SectionDivider } from '@/components/forms/SectionDivider';
import { PremiumFormHeader } from '@/components/forms/PremiumFormHeader';
import { inputCls } from '@/components/forms/FormStyles';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/providers/ToastContext';
import { useDebounce } from '@/hooks/useDebounce';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { confirmDialog } from 'primereact/confirmdialog';
import { ConfirmationModal } from '@/components/core/ConfirmationModal';
import { Checkbox } from 'primereact/checkbox';
import { ServerLookupDropdown } from '@/components/core/ServerLookupDropdown';
import { SectionLoadingIndicator } from '@/components/feedback/Loader/SectionLoadingIndicator';
import { useCloneProjectToTemplate } from '../../hooks/useTemplates';
import { formatLocalDate } from '@/utils/dateHelpers';
import { handleServerError } from '@/utils/errorHelpers';


const extractId = (v: any) => (v && typeof v === 'object' ? v.id : v);
const extractString = (val: any): string | null => {
  if (!val) return null;
  if (typeof val === 'string') return val;
  return val.value || val.label || val.name || null;
};

const projectSchema = z.object({
  project_name: z.string().trim().min(1, 'Project name is required'),
  account_name: z.string().trim().min(1, 'Account name is required'),
  customer_name: z.string().trim().min(1, 'Customer name is required'),
  project_id_sync: z.string().trim().min(1, 'External sync ID is required'),
  description: z.string().trim().optional().nullable(),
  client_name: z.string().trim().optional().nullable(),
  billing_model: z.any().optional(),
  project_type: z.any().optional(),
  manager_email: z.any().refine((val) => val !== null && val !== '', { message: 'Project Manager is required' }),
  status_id: z.any().refine((v) => !!v, { message: 'Status is required' }),
  priority_id: z.any().refine((v) => !!v, { message: 'Priority is required' }),
  tags: z.string().optional().nullable(),

  is_template: z.boolean().optional(),
  is_archived: z.boolean().optional(),
  estimated_hours: z.any().optional().nullable(),
  actual_hours: z.any().optional().nullable(),
  start_date: z.any().refine((v) => !!v, { message: 'Expected Start Date is required' }),
  end_date: z.any().refine((v) => !!v, { message: 'Expected End Date is required' }),
  actual_start_date: z.any().optional().nullable(),
  actual_end_date: z.any().optional().nullable(),
  delivery_head: z.any().refine((val) => val !== null && val !== '', { message: 'Delivery Head is required' }),
  user_ids: z.any().refine((val) => Array.isArray(val) && val.length > 0, { message: 'At least one Team Member is required' }),
}).superRefine((data, ctx) => {
  if (data.start_date && data.end_date) {
    if (new Date(data.end_date) < new Date(data.start_date)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "End date must be after start date", path: ["end_date"] });
    }
  }
  if (data.actual_start_date && data.actual_end_date) {
    if (new Date(data.actual_end_date) < new Date(data.actual_start_date)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Actual end date must be after actual start date", path: ["actual_end_date"] });
    }
  }
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export function ProjectEditView() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { showToast } = useToast();
  const { updateProject, deleteProject } = useProjectActions();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [projectPublicId, setProjectPublicId] = useState('');

  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [cloneName, setCloneName] = useState('');
  const [cloneMilestones, setCloneMilestones] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const cloneToTemplate = useCloneProjectToTemplate();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setError,
    clearErrors,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    mode: 'onChange',
    defaultValues: {
      project_name: '',
      account_name: '',
      customer_name: '',
      project_id_sync: '',
      description: '',
      client_name: '',
      billing_model: 'T&M',
      project_type: 'external',
      manager_email: null,
      status_id: null,
      priority_id: null,

      is_template: false,
      is_archived: false,
      estimated_hours: '',
      actual_hours: '',
      start_date: null,
      end_date: null,
      actual_start_date: null,
      actual_end_date: null,
      delivery_head: null,
      user_ids: [],
      tags: '',
    },
  });

  const projectNameValue = watch('project_name');
  const debouncedName = useDebounce(projectNameValue, 500);

  useEffect(() => {
    if (debouncedName?.trim() && debouncedName !== project?.project_name) {
      projectsService.checkName(debouncedName.trim(), Number(projectId)).then(exists => {
        if (exists) {
          setError('project_name', { type: 'manual', message: `Project Name "${debouncedName.trim()}" already exists. Please choose a unique name.` });
        } else {
          if (errors.project_name?.type === 'manual') {
            clearErrors('project_name');
          }
        }
      }).catch(() => { });
    }
  }, [debouncedName, projectId, setError, clearErrors, errors.project_name?.type, project?.project_name]);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const projectData = await projectsService.getProject(Number(projectId));
      setProject(projectData);
      setProjectPublicId(projectData.public_id);

      const pm = projectData.project_manager;
      const managerForForm = pm
        ? { id: String(pm.id), displayName: pm.display_name || pm.full_name || pm.email || '', mail: pm.email || null }
        : null;

      const dh = projectData.delivery_head;
      const dhForForm = dh
        ? { id: String(dh.id), displayName: dh.display_name || dh.full_name || dh.email || '', mail: dh.email || null }
        : null;

      reset({
        project_name: projectData.project_name ?? '',
        account_name: projectData.account_name ?? '',
        customer_name: projectData.customer_name ?? '',
        project_id_sync: projectData.project_id_sync ?? '',
        description: projectData.description ?? '',
        client_name: projectData.client_name ?? '',
        billing_model: projectData.billing_model ?? 'T&M',
        project_type: projectData.project_type ?? 'external',
        manager_email: managerForForm,
        delivery_head: dhForForm,

        status_id: projectData.status_master || projectData.status_id || null,
        priority_id: projectData.priority_master || projectData.priority_id || null,

        start_date: projectData.expected_start_date ? new Date(projectData.expected_start_date) : null,
        end_date: projectData.expected_end_date ? new Date(projectData.expected_end_date) : null,
        estimated_hours: projectData.estimated_hours?.toString() ?? '',
        actual_start_date: projectData.actual_start_date ? new Date(projectData.actual_start_date) : null,
        actual_end_date: projectData.actual_end_date ? new Date(projectData.actual_end_date) : null,
        actual_hours: projectData.actual_hours?.toString() ?? '',
        is_template: projectData.is_template ?? false,
        is_archived: projectData.is_archived ?? false,
        user_ids: projectData.team_members?.map((m: any) => m.user).filter(Boolean) || [],
        tags: projectData.tags ?? '',
      });
    } catch (err) {
      console.error(err);
      showToast('error', 'Error', 'Failed to load project data.');
    } finally {
      setLoading(false);
    }
  }, [projectId, reset, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onSubmit = async (data: ProjectFormValues) => {
    if (!projectId) return;

    if (!projectId) return;

    try {
      const rawManagerId = (data.manager_email as any)?.id;
      const parsedManagerId = rawManagerId ? Number(rawManagerId) : NaN;
      const managerEmail = (data.manager_email as any)?.mail || null;
      const extractLookupId = (val: any): number | null => {
        if (!val) return null;
        if (typeof val === 'object' && val.id) return Number(val.id);
        const n = Number(val);
        return isNaN(n) ? null : n;
      };

      const payload: any = {
        project_name: data.project_name,
        account_name: data.account_name,
        customer_name: data.customer_name,
        project_id_sync: data.project_id_sync,
        description: data.description || null,
        client_name: data.client_name || null,
        billing_model: extractString(data.billing_model),
        project_type: extractString(data.project_type),
        ...(isNaN(parsedManagerId)
          ? { project_manager_email: managerEmail }
          : { project_manager_id: parsedManagerId }
        ),
        ...((extractId(data.delivery_head) === null || isNaN(Number(extractId(data.delivery_head))))
          ? { delivery_head_email: (data.delivery_head as any)?.mail || (data.delivery_head as any)?.email || null }
          : { delivery_head_id: Number(extractId(data.delivery_head)) }
        ),
        status_id: extractLookupId(data.status_id),
        priority_id: extractLookupId(data.priority_id),
        is_template: data.is_template,
        is_archived: data.is_archived,
        expected_start_date: formatLocalDate(data.start_date),
        expected_end_date: formatLocalDate(data.end_date),
        estimated_hours: (data.estimated_hours !== undefined && data.estimated_hours !== null && data.estimated_hours !== '') ? parseFloat(data.estimated_hours as string) : 0,
        actual_start_date: formatLocalDate(data.actual_start_date),
        actual_end_date: formatLocalDate(data.actual_end_date),
        actual_hours: (data.actual_hours !== undefined && data.actual_hours !== null && data.actual_hours !== '') ? parseFloat(data.actual_hours as string) : 0,
        user_emails: (data.user_ids ?? []).map((u: any) => u.mail || u.email || null).filter(Boolean),
        tags: data.tags || null,
      };

      await updateProject.mutateAsync({ id: Number(projectId), data: payload });
      navigate(`/projects/${projectId}`);
    } catch (err: any) {
      console.error(err);
      handleServerError(err, setError, showToast, 'Update Failed', true);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const onConfirmDelete = async () => {
    try {
      await deleteProject.mutateAsync(Number(projectId));
      navigate('/projects');
    } catch (err) {
      console.error(err);
      showToast('error', 'Error', 'Failed to delete project.');
    } finally {
      setShowDeleteModal(false);
    }
  };

  if (loading) return <SectionLoadingIndicator fullPage label="Loading project data…" />;

  const handleCloneToTemplate = async () => {
    if (!cloneName.trim()) return;
    await cloneToTemplate.mutateAsync({
      projectId: Number(projectId),
      template_name: cloneName.trim(),
      include_milestones: cloneMilestones,
    });
    setShowCloneDialog(false);
  };

  return (
    <>
      <Dialog
        visible={showCloneDialog}
        onHide={() => setShowCloneDialog(false)}
        header={
          <div className="flex items-center gap-2">
            <Copy size={16} style={{ color: 'hsl(160 60% 45%)' }} />
            <span>Save as Template</span>
          </div>
        }
        style={{ width: '420px' }}
        footer={
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCloneDialog(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleCloneToTemplate}
              disabled={!cloneName.trim() || cloneToTemplate.isPending}
            >
              <Copy size={14} />
              {cloneToTemplate.isPending ? 'Saving…' : 'Save Template'}
            </Button>
          </div>
        }
      >
        <div className="space-y-5 py-2">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Template Name <span className="text-red-500">*</span>
            </label>
            <InputText
              value={cloneName}
              onChange={e => setCloneName(e.target.value)}
              placeholder={`${projectPublicId} Template`}
              className="w-full"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              inputId="clone-milestones"
              checked={cloneMilestones}
              onChange={e => setCloneMilestones(e.checked ?? false)}
            />
            <label htmlFor="clone-milestones" className="text-sm font-medium cursor-pointer" style={{ color: 'var(--text-primary)' }}>
              Include milestone tasks
            </label>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Only task names, descriptions, and estimated hours are copied.
            Assignees, statuses, dates, and comments are excluded.
          </p>
        </div>
      </Dialog>

      <ConfirmationModal
        visible={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={onConfirmDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${project?.project_name}"? This action cannot be undone and all associated tasks and defects will be removed.`}
        confirmLabel="Delete Project"
        variant="danger"
        loading={deleteProject.isPending}
      />

      <PageLayout
        title="Edit Project" showBackButton backPath={`/projects/${projectId}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => { setCloneName(`${projectPublicId} Template`); setShowCloneDialog(true); }}
              className="!h-9 !px-4"
              title="Save a copy of this project as a reusable template"
            >
              <Copy size={14} /> Save as Template
            </Button>
            <Button variant="danger" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" />Delete Project</Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-[980px] mx-auto pb-16 px-4">
          {errors.root && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle size={16} />
              <span>{errors.root.message}</span>
            </div>
          )}

          <PremiumFormHeader
            icon={FolderKanban}
            title="Edit Project Details"
            subtitle={`Modifying ${projectPublicId}`}
            color="emerald"
          />

          <div className="rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-premium)' }}>

            <SectionDivider title="Project Information" />

            <div className="md:col-span-2">
              <FieldLabel label="Project Name" required icon={<FolderKanban size={11} />} />
              <InputText {...register('project_name')} placeholder="Enter project name"
                className={inputCls(!!errors.project_name)}
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              <FieldError message={errors.project_name?.message} />
            </div>

            <div>
              <FieldLabel label="External Sync ID (Project ID)" required />
              <InputText {...register('project_id_sync')} placeholder="e.g. ZHO-2025-0047"
                className={inputCls(!!errors.project_id_sync)}
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              <FieldError message={errors.project_id_sync?.message} />
            </div>

            <div>
              <FieldLabel label="Account Name" required icon={<Building2 size={11} />} />
              <InputText {...register('account_name')} placeholder="e.g. Acme Corporation"
                className={inputCls(!!errors.account_name)}
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              <FieldError message={errors.account_name?.message} />
            </div>

            <div>
              <FieldLabel label="Customer Name" required icon={<User2 size={11} />} />
              <InputText {...register('customer_name')} placeholder="e.g. John Doe"
                className={inputCls(!!errors.customer_name)}
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              <FieldError message={errors.customer_name?.message} />
            </div>

            <div>
              <FieldLabel label="Client" icon={<Briefcase size={11} />} />
              <InputText {...register('client_name')} placeholder="e.g. Acme Corp"
                className={inputCls(!!errors.client_name)}
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              <FieldError message={errors.client_name?.message} />
            </div>

            <div>
              <FieldLabel label="Billing Model" required icon={<Database size={11} />} />
              <Controller name="billing_model" control={control} render={({ field }) => (
                <ServerLookupDropdown
                  category="ProjectBillingModel"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select Billing Model"
                />
              )} />
            </div>

            <div>
              <FieldLabel label="Project Type" required icon={<FolderKanban size={11} />} />
              <Controller name="project_type" control={control} render={({ field }) => (
                <ServerLookupDropdown
                  category="ProjectType"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select Project Type"
                />
              )} />
            </div>

            <div className="md:col-span-2">
              <FieldLabel label="Description" icon={<AlignLeft size={11} />} />
              <InputTextarea {...register('description')} rows={3}
                placeholder="Provide a detailed objective or scope…"
                className={inputCls()} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical' }} />
            </div>

            <div className="md:col-span-2">
              <FieldLabel label="Tags" icon={<Tag size={11} />} />
              <InputText {...register('tags')} placeholder="e.g. ecommerce, mobile, phase1"
                className={inputCls()} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            </div>

            <SectionDivider title="Staffing" />

            <div>
              <FieldLabel label="Project Manager" required icon={<User2 size={11} />} />
              <Controller name="manager_email" control={control} render={({ field }) => (
                <UserAutocomplete value={field.value} onChange={field.onChange} placeholder="Search for PM…" />
              )} />
              <FieldError message={errors.manager_email?.message as string} />
            </div>

            <div>
              <FieldLabel label="Delivery Head" required icon={<User2 size={11} />} />
              <Controller name="delivery_head" control={control} render={({ field }) => (
                <UserAutocomplete value={field.value} onChange={field.onChange} placeholder="Search for DH…" />
              )} />
              <FieldError message={errors.delivery_head?.message as string} />
            </div>

            <div className="md:col-span-2">
              <FieldLabel label="Team Members" required icon={<Users size={11} />} />
              <Controller name="user_ids" control={control} render={({ field }) => (
                <UserMultiSelect value={field.value} onChange={field.onChange} placeholder="Search organization users to add…" />
              )} />
              <FieldError message={errors.user_ids?.message as string} />
            </div>

            <SectionDivider title="Triage & Classification" />

            <div>
              <FieldLabel label="Status" required icon={<Tag size={11} />} />
              <Controller name="status_id" control={control} render={({ field }) => (
                <ServerLookupDropdown
                  category="ProjectStatus"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select Status"
                />
              )} />
            </div>

            <div>
              <FieldLabel label="Priority" required />
              <Controller name="priority_id" control={control} render={({ field }) => (
                <ServerLookupDropdown
                  category="TaskPriority"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select Priority"
                />
              )} />
            </div>



            <SectionDivider title="Planning (Expected vs Actual)" />

            <div>
              <FieldLabel label="Expected Start Date" required icon={<Clock size={11} />} />
              <Controller name="start_date" control={control} render={({ field }) => (
                <Calendar value={field.value} onChange={(e) => field.onChange(e.value)}
                  dateFormat="dd/mm/yy" showIcon showButtonBar className="w-full"
                  inputClassName="w-full rounded-xl px-3 py-2.5 text-sm" placeholder="DD/MM/YYYY" />
              )} />
            </div>

            <div>
              <FieldLabel label="Expected End Date" required icon={<Clock size={11} />} />
              <Controller name="end_date" control={control} render={({ field }) => (
                <Calendar value={field.value} onChange={(e) => field.onChange(e.value)}
                  dateFormat="dd/mm/yy" showIcon showButtonBar className="w-full"
                  inputClassName="w-full rounded-xl px-3 py-2.5 text-sm" placeholder="DD/MM/YYYY" />
              )} />
              <FieldError message={errors.end_date?.message as string} />
            </div>

            <div>
              <FieldLabel label="Estimated Hours" />
              <InputText type="number" step="0.5" min="0" {...register('estimated_hours')}
                placeholder="e.g. 120" className={inputCls()}
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            </div>

            <div>
              <FieldLabel label="Actual Start Date" icon={<Database size={11} />} />
              <Controller name="actual_start_date" control={control} render={({ field }) => (
                <Calendar value={field.value} onChange={(e) => field.onChange(e.value)}
                  dateFormat="dd/mm/yy" showIcon showButtonBar className="w-full"
                  inputClassName="w-full rounded-xl px-3 py-2.5 text-sm" placeholder="DD/MM/YYYY" />
              )} />
            </div>

            <div>
              <FieldLabel label="Actual End Date" icon={<Database size={11} />} />
              <Controller name="actual_end_date" control={control} render={({ field }) => (
                <Calendar value={field.value} onChange={(e) => field.onChange(e.value)}
                  dateFormat="dd/mm/yy" showIcon showButtonBar className="w-full"
                  inputClassName="w-full rounded-xl px-3 py-2.5 text-sm" placeholder="DD/MM/YYYY" />
              )} />
              <FieldError message={errors.actual_end_date?.message as string} />
            </div>

            <div>
              <FieldLabel label="Actual Hours" />
              <InputText type="number" step="0.5" min="0" {...register('actual_hours')}
                placeholder="e.g. 95.5" className={inputCls()}
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            </div>
          </div>

          <div className="flex items-center justify-between pt-5 mt-5" style={{ borderTop: '1px solid var(--border-color)' }}>
            <Button variant="ghost" type="Button" onClick={() => navigate(`/projects/${projectId}`)}>Cancel</Button>
            <Button variant="gradient" type="submit" loading={isSubmitting} disabled={!isValid}>
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </PageLayout>
    </>
  );
}
