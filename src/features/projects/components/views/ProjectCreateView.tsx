import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDebounce } from '@/hooks/useDebounce';
import { RadioButton } from 'primereact/radioButton';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { classNames } from 'primereact/utils';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { Button } from '@/components/forms/Button';
import { ServerLookupDropdown } from '@/components/core/ServerLookupDropdown';
import ServerSearchDropdown from '@/components/core/ServerSearchDropdown';
import { UserAutocomplete } from '@/components/core/UserAutocomplete';
import { UserMultiSelect } from '@/components/core/UserMultiSelect';
import { useProjectActions } from '../../hooks/useProjectActions';
import { useTemplates } from '../../hooks/useTemplates';

import { projectSchema, type ProjectFormData } from '../../types/project.types';
import {
    FolderKanban, ChevronRight, ChevronLeft, Check, Layers,
    Hash, Building2, User2, Users, Calendar as CalIcon, Briefcase,
    Tag as TagIcon, ClipboardList, AlertCircle
} from 'lucide-react';
import { projectsService } from '@/features/projects/api/projects.api';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { FieldError } from '@/components/forms/FieldError';
import { FormSection } from '@/components/forms/FormSection';
import { PremiumFormHeader } from '@/components/forms/PremiumFormHeader';
import { inputCls } from '@/components/forms/FormStyles';
import { formatLocalDate } from '@/utils/dateHelpers';
import { handleServerError } from '@/utils/errorHelpers';
import { useToast } from '@/providers/ToastContext';

const extractId = (val: any): number | null => {
    const id = val && typeof val === 'object' ? val.id ?? null : val;
    if (id === null || id === undefined || id === '') return null;
    const n = Number(id);
    return (!isNaN(n) && n > 0) ? n : null;
};

const extractString = (val: any): string | null => {
    if (!val) return null;
    if (typeof val === 'string') return val;
    return val.value || val.label || val.name || null;
};

const STEP1_FIELDS = ['project_name', 'account_name', 'customer_name', 'project_id_sync', 'status_id', 'priority_id', 'expected_start_date', 'expected_end_date', 'billing_model', 'project_type', 'tags'] as const;

const STEPS = ['Project Details', 'Template', 'Staffing & Members'];

function CustomStepper({ activeStep }: { activeStep: number }) {
    return (
        <div className="flex items-center mb-6 select-none">
            {STEPS.map((label, i) => {
                const done = i < activeStep;
                const active = i === activeStep;
                return (
                    <React.Fragment key={i}>
                        <div className="flex items-center gap-2 min-w-0">
                            <div className={classNames(
                                'w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-black flex-shrink-0 transition-all duration-300',
                                done ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' :
                                    active ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20 shadow-lg shadow-emerald-500/30' :
                                        'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                            )}>
                                {done ? <Check size={14} strokeWidth={3} /> : i + 1}
                            </div>
                            <span className={classNames(
                                'text-[13px] font-semibold transition-colors whitespace-nowrap',
                                active ? 'text-emerald-600 dark:text-emerald-400' :
                                    done ? 'text-slate-700 dark:text-slate-300' :
                                        'text-slate-400 dark:text-slate-500'
                            )}>{label}</span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={classNames(
                                'flex-1 h-0.5 mx-3 rounded-full transition-all duration-500',
                                done ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                            )} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

export function ProjectCreateView() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [activeStep, setActiveStep] = useState(0);
    const { createProject } = useProjectActions();
    const { data: templates = [], isLoading: templatesLoading } = useTemplates();
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

    const {
        register,
        control,
        handleSubmit,
        trigger,
        watch,
        setError,
        clearErrors,
        formState: { errors, isSubmitting },
    } = useForm<any>({
        resolver: zodResolver(projectSchema) as any,
        mode: 'onChange',
        defaultValues: {
            project_name: '',
            account_name: '',
            customer_name: '',
            client_name: '',
            project_id_sync: '',
            description: '',
            billing_model: 'T&M',
            project_type: 'external',
            is_template: false,
            is_archived: false,
            is_group: false,
            user_emails: [],
            tags: '',
        },
    });

    const billingModel = watch('billing_model' as any);
    const projectType = watch('project_type' as any);

    const projectName = watch('project_name');
    const projectSyncId = watch('project_id_sync');
    const debouncedName = useDebounce(projectName, 500);
    const debouncedSyncId = useDebounce(projectSyncId, 500);

    useEffect(() => {
        if (debouncedName?.trim()) {
            projectsService.checkName(debouncedName.trim()).then(exists => {
                if (exists) {
                    setError('project_name', { type: 'manual', message: `Project Name "${debouncedName.trim()}" already exists. Please choose a unique name.` });
                } else {
                    if (errors.project_name?.type === 'manual') {
                        clearErrors('project_name');
                    }
                }
            }).catch(() => { });
        }
    }, [debouncedName, setError, clearErrors, errors.project_name?.type]);

    useEffect(() => {
        if (debouncedSyncId?.trim()) {
            projectsService.checkSyncId(debouncedSyncId.trim()).then(exists => {
                if (exists) {
                    setError('project_id_sync', { type: 'manual', message: `External Sync ID "${debouncedSyncId.trim()}" is already assigned to another project.` });
                } else {
                    if (errors.project_id_sync?.type === 'manual') {
                        clearErrors('project_id_sync');
                    }
                }
            }).catch(() => { });
        }
    }, [debouncedSyncId, setError, clearErrors, errors.project_id_sync?.type]);

    const advance = async (fields: readonly string[]) => {
        const ok = await trigger(fields as any);
        if (ok) {
            if (fields.includes('project_id_sync') && errors.project_id_sync) return;
            if (fields.includes('project_name') && errors.project_name) return;
            setActiveStep(s => s + 1);
        }
    };

    const onSubmit = async (data: ProjectFormData) => {
        const payload: any = {
            project_name: data.project_name.trim(),
            account_name: data.account_name.trim(),
            customer_name: data.customer_name.trim(),
            client_name: (data as any).client_name?.trim() || null,
            project_id_sync: data.project_id_sync.trim(),
            description: data.description || null,
            billing_model: extractString((data as any).billing_model) || 'T&M',
            project_type: extractString((data as any).project_type) || 'external',
            project_status_external: extractString((data as any).project_status_external) || null,

            ...((extractId((data as any).project_manager) === null || isNaN(Number(extractId((data as any).project_manager))))
                ? { project_manager_email: (data as any).project_manager?.mail || null }
                : { project_manager_id: Number(extractId((data as any).project_manager)) }),

            ...((extractId((data as any).delivery_head) === null || isNaN(Number(extractId((data as any).delivery_head))))
                ? { delivery_head_email: (data as any).delivery_head?.mail || null }
                : { delivery_head_id: Number(extractId((data as any).delivery_head)) }),

            status_id: (data as any).status_id ? (extractId((data as any).status_id) || null) : null,
            priority_id: (data as any).priority_id ? (extractId((data as any).priority_id) || null) : null,
            expected_start_date: formatLocalDate((data as any).expected_start_date),
            expected_end_date: formatLocalDate((data as any).expected_end_date),
            estimated_hours: data.estimated_hours ? Number(data.estimated_hours) : null,
            tags: (data as any).tags?.trim() || null,
            template_id: selectedTemplateId,
            user_emails: data.user_emails ?? [],
        };
        try {
            await createProject.mutateAsync(payload);
            navigate('/projects');
        } catch (err: any) {
            console.error(err);
            handleServerError(err, setError, showToast, 'Project Creation Failed', true);

            const errorDetail = err?.response?.data?.detail;
            if (Array.isArray(errorDetail)) {
                const hasStep1Error = errorDetail.some((d: any) => {
                    const field = d.loc[d.loc.length - 1];
                    return STEP1_FIELDS.includes(field as any) || field === 'public_id' || field === 'id_sync';
                });
                if (hasStep1Error) setActiveStep(0);
            }
        }
    };

    const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

    const calendarInputStyle = { width: '100%' };

    return (
        <PageLayout title="Create New Project" showBackButton onBack={() => navigate(-1)}>
            <div className="max-w-[980px] mx-auto pb-16 px-4">
                {errors.root && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
                        <AlertCircle size={16} />
                        <span>{errors.root.message}</span>
                    </div>
                )}
                <PremiumFormHeader
                    icon={FolderKanban}
                    title="New Project"
                    subtitle="Complete the 3-step wizard to create a fully configured project"
                    color="emerald"
                />

                <div className="rounded-2xl p-6 mb-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <CustomStepper activeStep={activeStep} />

                    <form onSubmit={handleSubmit(onSubmit)} className="overflow-hidden">
                        {errors.root && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium">
                                {errors.root.message}
                            </div>
                        )}

                        {activeStep === 0 && (
                            <div className="py-3 space-y-1">
                                <FormSection title="Identification">
                                    <div className="md:col-span-2">
                                        <FieldLabel label="Project Name" required icon={<FolderKanban size={12} />} />
                                        <InputText
                                            {...register('project_name')}
                                            placeholder="e.g. Acme Platform Redesign"
                                            className={inputCls(!!errors.project_name)}
                                        />
                                        <FieldError message={errors.project_name?.message as string} />
                                    </div>

                                    <div>
                                        <FieldLabel label="External Sync ID (Project ID)" required icon={<Hash size={12} />} />
                                        <InputText
                                            {...register('project_id_sync')}
                                            placeholder="e.g. ZHO-2025-0047"
                                            className={inputCls(!!errors.project_id_sync)}
                                        />
                                        <FieldError message={errors.project_id_sync?.message as string} />
                                    </div>

                                    <div>
                                        <FieldLabel label="Account Name" required icon={<Building2 size={12} />} />
                                        <InputText
                                            {...register('account_name')}
                                            placeholder="e.g. Acme Corp"
                                            className={inputCls(!!errors.account_name)}
                                        />
                                        <FieldError message={errors.account_name?.message as string} />
                                    </div>

                                    <div>
                                        <FieldLabel label="Customer Name" required icon={<User2 size={12} />} />
                                        <InputText
                                            {...register('customer_name')}
                                            placeholder="e.g. Acme Engineering Division"
                                            className={inputCls(!!errors.customer_name)}
                                        />
                                        <FieldError message={errors.customer_name?.message as string} />
                                    </div>

                                    <div>
                                        <FieldLabel label="Client Name" icon={<Briefcase size={12} />} />
                                        <InputText
                                            {...register('client_name' as any)}
                                            placeholder="End client / billing entity"
                                            className={inputCls()}
                                        />
                                    </div>

                                    <div>
                                        <FieldLabel label="Project Status (External)" icon={<TagIcon size={12} />} />
                                        <Controller name={'project_status_external' as any} control={control} render={({ field }) => (
                                            <ServerLookupDropdown
                                                category="ProjectStatus"
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Select status…"
                                            />
                                        )} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <FieldLabel label="Tags" icon={<TagIcon size={12} />} />
                                        <InputText
                                            {...register('tags')}
                                            placeholder="e.g. ecommerce, mobile, phase1"
                                            className={inputCls(false)}
                                        />
                                    </div>
                                </FormSection>

                                <FormSection title="Classification">
                                    <div>
                                        <FieldLabel label="Billing Model" required icon={<ClipboardList size={12} />} />
                                        <Controller name={'billing_model' as any} control={control} render={({ field }) => (
                                            <ServerLookupDropdown
                                                category="ProjectBillingModel"
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Select Billing Model"
                                            />
                                        )} />
                                    </div>

                                    <div>
                                        <FieldLabel label="Project Type" required icon={<Briefcase size={12} />} />
                                        <Controller name={'project_type' as any} control={control} render={({ field }) => (
                                            <ServerLookupDropdown
                                                category="ProjectType"
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Select Project Type"
                                            />
                                        )} />
                                    </div>
                                </FormSection>

                                <FormSection title="Schedule & Planning">
                                    <div>
                                        <FieldLabel label="Expected Start Date" required icon={<CalIcon size={12} />} />
                                        <Controller name={'expected_start_date' as any} control={control} render={({ field }) => (
                                            <Calendar
                                                value={field.value ? new Date(field.value) : null}
                                                onChange={(e) => field.onChange(e.value)}
                                                dateFormat="dd/mm/yy" showIcon showButtonBar
                                                className={classNames('w-full', { 'p-invalid': errors.expected_start_date })}
                                                placeholder="DD/MM/YYYY"
                                                inputStyle={calendarInputStyle}
                                                style={{ width: '100%' }}
                                            />
                                        )} />
                                        <FieldError message={errors.expected_start_date?.message as string} />
                                    </div>

                                    <div>
                                        <FieldLabel label="Expected End Date" required icon={<CalIcon size={12} />} />
                                        <Controller name={'expected_end_date' as any} control={control} render={({ field }) => (
                                            <Calendar
                                                value={field.value ? new Date(field.value) : null}
                                                onChange={(e) => field.onChange(e.value)}
                                                dateFormat="dd/mm/yy" showIcon showButtonBar
                                                className={classNames('w-full', { 'p-invalid': errors.expected_end_date })}
                                                placeholder="DD/MM/YYYY"
                                                inputStyle={calendarInputStyle}
                                                style={{ width: '100%' }}
                                            />
                                        )} />
                                        <FieldError message={errors.expected_end_date?.message as string} />
                                    </div>

                                    <div className="md:col-span-2">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <FieldLabel label="Status" required icon={<TagIcon size={12} />} />
                                                <Controller name="status_id" control={control} render={({ field }) => (
                                                    <ServerLookupDropdown
                                                        category="ProjectStatus"
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        placeholder="Select status…"
                                                        className={errors.status_id ? "p-invalid" : ""}
                                                    />
                                                )} />
                                                <FieldError message={errors.status_id?.message as string} />
                                            </div>
                                            <div>
                                                <FieldLabel label="Priority" required icon={<AlertCircle size={12} />} />
                                                <Controller name="priority_id" control={control} render={({ field }) => (
                                                    <ServerLookupDropdown
                                                        category="TaskPriority"
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        placeholder="Select priority…"
                                                        className={errors.priority_id ? "p-invalid" : ""}
                                                    />
                                                )} />
                                                <FieldError message={errors.priority_id?.message as string} />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <FieldLabel label="Estimated Hours" />
                                        <InputText
                                            type="number" step="0.5" min="0"
                                            {...register('estimated_hours')}
                                            placeholder="0"
                                            className={inputCls()}
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <FieldLabel label="Description" />
                                        <InputTextarea
                                            {...register('description')}
                                            rows={3}
                                            placeholder="Brief project objective, scope, or notes…"
                                            className={inputCls()}
                                        />
                                    </div>
                                </FormSection>

                                <StepActions>
                                    <Button variant="ghost" onClick={() => navigate('/projects')} type="Button">Cancel</Button>
                                    <Button variant="primary" onClick={() => advance(STEP1_FIELDS)} type="Button" className="shadow-brand-teal-500/25">
                                        Next: Template <ChevronRight size={14} className="ml-1" />
                                    </Button>
                                </StepActions>
                            </div>
                        )}


                        {activeStep === 1 && (
                            <div className="py-3">
                                <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                                    Pick a pre-built task template to auto-populate your project, or start from scratch.
                                </p>

                                {templatesLoading ? (
                                    <div className="flex items-center gap-2 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                                        <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                                        Loading templates…
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <TemplateCard
                                            selected={selectedTemplateId === null}
                                            onSelect={() => setSelectedTemplateId(null)}
                                            name="Start Blank"
                                            description="No tasks pre-loaded — build from scratch."
                                            taskCount={0}
                                            isBlank
                                        />
                                        {templates.map((tmpl) => (
                                            <TemplateCard
                                                key={tmpl.id}
                                                selected={selectedTemplateId === tmpl.id}
                                                onSelect={() => setSelectedTemplateId(tmpl.id)}
                                                name={tmpl.name}
                                                description={tmpl.description ?? ''}
                                                taskCount={tmpl.tasks.length}
                                            />
                                        ))}
                                    </div>
                                )}

                                {selectedTemplate && (
                                    <div className="mt-5 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                                        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                                            Tasks that will be created ({selectedTemplate.tasks.length})
                                        </p>
                                        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                            {selectedTemplate.tasks.map((t, i) => (
                                                <div key={i} className="flex items-center gap-3 text-sm py-1.5 px-3 rounded-xl border border-slate-100 dark:border-slate-800" style={{ background: 'var(--bg-card)' }}>
                                                    <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                                                        <Check size={10} className="text-emerald-500" />
                                                    </div>
                                                    <span className="flex-1 text-[13px] font-medium truncate min-w-0" style={{ color: 'var(--text-primary)' }} title={t.title}>
                                                        {t.title}
                                                    </span>
                                                    {t.estimated_hours && (
                                                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold text-[10px] uppercase tracking-wider flex-shrink-0"
                                                            style={{ background: 'hsl(160 60% 45% / 0.1)', color: 'hsl(160 60% 45%)' }}>
                                                            {t.estimated_hours} <span className="opacity-70 font-black">HRS</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <StepActions>
                                    <Button variant="ghost" icon={<ChevronLeft size={14} />} onClick={() => setActiveStep(s => s - 1)} type="Button">Back</Button>
                                    <Button variant="primary" onClick={() => setActiveStep(s => s + 1)} type="Button" className="shadow-brand-teal-500/25">
                                        Next: Members <ChevronRight size={14} className="ml-1" />
                                    </Button>
                                </StepActions>
                            </div>
                        )}


                        {activeStep === 2 && (
                            <div className="py-3 space-y-1">
                                <FormSection title="Project Staffing">
                                    <div>
                                        <FieldLabel label="Project Manager" required icon={<User2 size={12} />} />
                                        <Controller name={'project_manager' as any} control={control} render={({ field }) => (
                                            <UserAutocomplete value={field.value} onChange={field.onChange} placeholder="Search for PM…" />
                                        )} />
                                        <FieldError message={errors.project_manager?.message as string} />
                                        <p className="text-[11px] mt-1 text-slate-500 dark:text-slate-400">
                                            This user will be assigned as the Primary Project Manager.
                                        </p>
                                    </div>

                                    <div>
                                        <FieldLabel label="Delivery Head" required icon={<User2 size={12} />} />
                                        <Controller name={'delivery_head' as any} control={control} render={({ field }) => (
                                            <UserAutocomplete value={field.value} onChange={field.onChange} placeholder="Search for Delivery Head…" />
                                        )} />
                                        <FieldError message={errors.delivery_head?.message as string} />
                                    </div>

                                    <div className="md:col-span-2">
                                        <FieldLabel label="Team Members" required icon={<Users size={12} />} />
                                        <Controller name="user_emails" control={control} render={({ field }) => (
                                            <UserMultiSelect
                                                value={field.value as any}
                                                onChange={(users: any[]) => {
                                                    field.onChange(users.map((u) => u.mail || u.email).filter(Boolean));
                                                }}
                                                placeholder="Search organization users to add…"
                                            />
                                        )} />
                                        <FieldError message={errors.user_emails?.message as string} />
                                        <p className="text-[11px] mt-1 text-slate-500 dark:text-slate-400">
                                            Required: Please add at least one member
                                        </p>
                                    </div>
                                </FormSection>

                                {Object.keys(errors).length > 0 && (
                                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-sm mb-2">
                                            <AlertCircle size={16} />
                                            Please resolve the following errors:
                                        </div>
                                        <ul className="list-disc list-inside space-y-1">
                                            {Object.entries(errors).map(([field, err]: [string, any]) => (
                                                <li key={field} className="text-xs text-amber-700 dark:text-amber-500">
                                                    <span className="font-semibold capitalize">{field.replace(/_/g, ' ')}</span>: {err.message}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <StepActions>
                                    <Button variant="ghost" icon={<ChevronLeft size={14} />} onClick={() => setActiveStep(s => s - 1)} type="Button">Back</Button>
                                    <Button
                                        variant="primary"
                                        type="Button"
                                        onClick={handleSubmit(onSubmit)}
                                        loading={isSubmitting || createProject.isPending}
                                        icon={<Check size={14} />}
                                        className="shadow-brand-teal-500/25"
                                    >
                                        {isSubmitting || createProject.isPending ? 'Creating Project…' : 'Create Project'}
                                    </Button>
                                </StepActions>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </PageLayout>
    );
}

function StepActions({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between pt-5 mt-5"
            style={{ borderTop: '1px solid var(--border-color)' }}>
            {children}
        </div>
    );
}

function TemplateCard({ name, description, taskCount, selected, onSelect, isBlank }: {
    name: string; description: string; taskCount: number;
    selected: boolean; onSelect: () => void; isBlank?: boolean;
}) {
    return (
        <label
            className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all relative group"
            style={{
                background: selected ? 'hsl(160 60% 45% / 0.05)' : 'var(--bg-card)',
                border: `1.5px solid ${selected ? 'hsl(160 60% 45%)' : 'var(--border-color)'}`,
                transform: selected ? 'translateY(-1px)' : 'none',
                boxShadow: selected ? '0 8px 24px hsl(160 60% 45% / 0.12)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
        >
            <div className="flex flex-col gap-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0 w-full">
                    <span className="text-[13px] font-bold truncate flex-1 min-w-0" style={{ color: 'var(--text-primary)' }} title={name}>{name}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isBlank
                            ? <Tag value="Blank" severity="secondary" className="text-[10px] px-1.5" />
                            : <Tag value={`${taskCount} tasks`} severity="info" className="text-[10px] px-1.5" />
                        }
                        {selected && (
                            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/40">
                                <Check size={12} strokeWidth={4} />
                            </div>
                        )}
                    </div>
                </div>
                {description && (
                    <span className="text-xs leading-relaxed" style={{
                        color: 'var(--text-muted)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}>{description}</span>
                )}
            </div>
            <input
                type="radio"
                className="sr-only"
                checked={selected}
                onChange={onSelect}
            />
        </label>
    );
}
