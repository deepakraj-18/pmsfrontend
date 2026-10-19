import React, { useState, useEffect } from 'react';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { FieldError } from '@/components/forms/FieldError';
import { SectionDivider } from '@/components/forms/SectionDivider';
import { PremiumFormHeader } from '@/components/forms/PremiumFormHeader';
import { inputCls } from '@/components/forms/FormStyles';
import { formatLocalDate } from '@/utils/dateHelpers';
import { handleServerError } from '@/utils/errorHelpers';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { Button } from '@/components/forms/Button';
import { classNames } from 'primereact/utils';
import { RadioButton } from 'primereact/radioButton';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import ServerSearchDropdown from '@/components/core/ServerSearchDropdown';
import { ServerLookupDropdown } from '@/components/core/ServerLookupDropdown';
import { UserAutocomplete } from '@/components/core/UserAutocomplete';
import { UserMultiSelect } from '@/components/core/UserMultiSelect';
import { useIssueActions } from '../../hooks/useIssueActions';
import { documentsService } from '@/features/documents/api/documents.api';
import { useToast } from '@/providers/ToastContext';
import { useAuth } from '@/auth/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { projectsService } from '@/features/projects/api/projects.api';
import { AlertTriangle, ImageIcon, UploadCloud, X, AlertCircle, Tag, User2, Users, Calendar as CalIcon, Layers, Lock } from 'lucide-react';

import {
    ISSUE_CLASSIFICATIONS as CLASSIFICATIONS,
    SEVERITY_COLORS,
    BUG_TYPE_OPTIONS,
    REPRO_OPTIONS
} from '@/constants/constants';


const issueSchema = z.object({
    bug_name: z.string().trim().min(3, 'Minimum 3 characters required').max(250, 'Defect name cannot exceed 250 characters'),
    description: z.string().trim().optional(),
    project_id: z.any().refine(v => !!v, { message: 'Project is required' }),
    milestone_id: z.any().optional(),
    reporter_ref: z.any().refine(v => !!v, { message: 'Reporter is required' }),
    status_ref: z.any().refine(v => !!v, { message: 'Status is required' }),
    severity_ref: z.any().refine(v => !!v, { message: 'Severity is required' }),
    bug_type: z.string().optional(),

    classification: z.any().optional(),
    module: z.string().trim().optional(),
    tags: z.string().trim().optional(),
    estimated_hours: z.string().optional(),
    start_date: z.any().refine(v => !!v, { message: 'Start Date is required' }),
    due_date: z.any().refine(v => !!v, { message: 'Due Date is required' }),
    reproducible_flag: z.boolean().optional(),
    associated_team_id: z.any().optional(),
    assignees: z.array(z.any()).min(1, 'At least one assignee is required'),
    followers: z.array(z.any()).optional(),
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

type IssueFormValues = z.infer<typeof issueSchema>;



const extractId = (v: any) => v && typeof v === 'object' ? v.id : v;
const toDate = (v: any) => formatLocalDate(v);

export function IssueCreateView() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [searchParams] = useSearchParams();
    const presetProjectId = searchParams.get('project_id');
    const { createIssue } = useIssueActions();
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);

    const { data: presetProject } = useQuery({
        queryKey: ['projects', 'detail', Number(presetProjectId)],
        queryFn: () => projectsService.getProject(Number(presetProjectId)),
        enabled: !!presetProjectId,
        staleTime: 5 * 60 * 1000,
    });

    const { control, register, handleSubmit, watch, setValue, setError, formState: { errors, isValid } } =
        useForm<IssueFormValues>({
            resolver: zodResolver(issueSchema),
            mode: 'onChange',
            defaultValues: {
                bug_name: '',
                description: '',
                classification: null,
                module: '',
                tags: '',
                estimated_hours: '',
                reproducible_flag: true,
                bug_type: 'Internal',
                reporter_ref: user ? { mail: user.email, displayName: `${user.first_name} ${user.last_name}`.trim() } : undefined,
                assignees: [],
                followers: []
            },
        });

    useEffect(() => {
        if (presetProject) {
            setValue('project_id', presetProject);
        }
    }, [presetProject, setValue]);

    const watchReproducible = watch('reproducible_flag');
    const watchBugType = watch('bug_type');
    const watchStartDate = watch('start_date');
    const watchProjectId = useWatch({ control, name: 'project_id' });

    const onSubmit = async (data: IssueFormValues) => {
        setUploading(true);
        const pid = extractId(data.project_id);
        try {
            const docIds: number[] = [];
            if (files.length > 0) {
                if (!pid) { showToast('error', 'Validation', 'Select a project before uploading.'); setUploading(false); return; }
                for (const f of files) { const d = await documentsService.createDocument(f, pid, f.name); docIds.push(d.id); }
            }
            const payload = {
                bug_name: data.bug_name,
                description: data.description || null,
                project_id: pid ?? null,
                milestone_id: extractId(data.milestone_id) ?? null,
                associated_team_id: extractId(data.associated_team_id) ?? null,
                reporter_email: (data.reporter_ref as any)?.mail || (data.reporter_ref as any)?.email || null,
                assignee_emails: (data.assignees || []).map((a: any) => a.mail || a.email).filter(Boolean),
                follower_emails: (data.followers || []).map((a: any) => a.mail || a.email).filter(Boolean),
                status_id: extractId(data.status_ref),
                severity_id: extractId(data.severity_ref),
                flag: (data as any).bug_type || 'Internal',
                classification_id: extractId(data.classification),

                module: data.module || null,
                tags: data.tags || null,
                estimated_hours: data.estimated_hours ? parseFloat(data.estimated_hours) : null,
                start_date: toDate(data.start_date),
                due_date: toDate(data.due_date),
                reproducible_flag: data.reproducible_flag ?? true,
                document_ids: docIds,
            };
            await createIssue.mutateAsync(payload);
            if (presetProjectId) {
                navigate(`/projects/${presetProjectId}?tab=Defects`);
            } else {
                navigate(-1);
            }
        } catch (err: any) {
            console.error(err);
            handleServerError(err, setError, showToast, 'Report Failed', true);
        } finally { setUploading(false); }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const sel = Array.from(e.target.files);
        if (files.length + sel.length > 5) { showToast('error', 'Limit', 'Max 5 attachments.'); return; }
        setFiles(p => [...p, ...sel]);
    };

    const isBusy = createIssue.isPending || uploading;

    return (
        <PageLayout title="Report Defect" showBackButton onBack={() => navigate(-1)}>
            <form onSubmit={handleSubmit(onSubmit as any)} className="max-w-[980px] mx-auto pb-16 px-4">
                {(errors as any).root && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
                        <AlertCircle size={16} />
                        <span>{(errors as any).root.message}</span>
                    </div>
                )}

                <PremiumFormHeader
                    icon={AlertTriangle}
                    title="Report Defect"
                    subtitle="Provide detailed information so the team can reproduce and fix this defect"
                    color="red"
                />

                <div className="rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-premium)' }}>

                    <SectionDivider title="Defect Identification" />

                    <div className="lg:col-span-3">
                        <FieldLabel label="Defect Name" required icon={<AlertTriangle size={11} />} />
                        <InputText {...register('bug_name')} placeholder="Brief description of the defect"
                            className={inputCls(!!errors.bug_name)}
                            style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)', height: '44px' }} />
                        <FieldError message={errors.bug_name?.message} />
                    </div>

                    <div>
                        <FieldLabel label="Project" required />
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
                                <ServerSearchDropdown entityType="projects" value={field.value} onChange={(v) => { field.onChange(v); setValue('milestone_id', null); }} placeholder="Select Project" />
                            )} />
                        )}
                        <FieldError message={errors.project_id?.message as string} />
                    </div>

                    <div>
                        <FieldLabel label="Milestone" />
                        <Controller name="milestone_id" control={control} render={({ field }) => (
                            <ServerSearchDropdown
                                entityType="milestones"
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select Milestone"
                                disabled={!watchProjectId}
                                filters={watchProjectId ? { project_id: extractId(watchProjectId) } : {}}
                            />
                        )} />
                    </div>

                    <div>
                        <FieldLabel label="Associated Team" />
                        <Controller name="associated_team_id" control={control} render={({ field }) => (
                            <ServerSearchDropdown entityType="teams" value={field.value} onChange={field.onChange} placeholder="Select Team" />
                        )} />
                    </div>

                    <div>
                        <FieldLabel label="Module" icon={<Layers size={11} />} />
                        <InputText {...register('module')} placeholder="e.g. Authentication, Billing…"
                            className={inputCls()} style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)', height: '44px' }} />
                    </div>

                    <SectionDivider title="Triage" />

                    <div>
                        <FieldLabel label="Status" required icon={<Tag size={11} />} />
                        <Controller name="status_ref" control={control} render={({ field }) => (
                            <ServerLookupDropdown category="IssueStatus" value={field.value} onChange={field.onChange} placeholder="Select Status" />
                        )} />
                        <FieldError message={errors.status_ref?.message as string} />
                    </div>

                    <div>
                        <FieldLabel label="Severity" required />
                        <Controller name="severity_ref" control={control} render={({ field }) => (
                            <ServerLookupDropdown category="IssueSeverity" value={field.value} onChange={field.onChange} placeholder="Select Severity" />
                        )} />
                        <FieldError message={errors.severity_ref?.message as string} />
                    </div>

                    <div>
                        <FieldLabel label="Bug Type" />
                        <div className="flex gap-3 mt-1">
                            {BUG_TYPE_OPTIONS.map(opt => (
                                <label key={opt.value} className="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer border transition-all text-sm font-medium select-none"
                                    style={{
                                        background: watchBugType === opt.value ? 'hsl(220 70% 50% / 0.1)' : 'var(--bg-secondary)',
                                        border: `1.5px solid ${watchBugType === opt.value ? 'hsl(220 70% 50%)' : 'var(--border-color)'}`,
                                        color: watchBugType === opt.value ? 'hsl(220 70% 45%)' : 'var(--text-primary)',
                                    }}>
                                    <Controller name={'bug_type' as any} control={control} render={({ field }) => (
                                        <input
                                            type="radio"
                                            className="sr-only"
                                            value={opt.value}
                                            checked={field.value === opt.value}
                                            onChange={() => field.onChange(opt.value)}
                                        />
                                    )} />
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                    </div>


                    <div>
                        <FieldLabel label="Classification" />
                        <Controller name="classification" control={control} render={({ field }) => (
                            <ServerLookupDropdown category="IssueClassification" value={field.value} onChange={field.onChange} placeholder="Select Classification" />
                        )} />
                    </div>

                    <div>
                        <FieldLabel label="Tags" icon={<Tag size={11} />} />
                        <InputText {...register('tags')} placeholder="e.g. login, crash, api"
                            className={inputCls()} style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)', height: '44px' }} />
                    </div>

                    <div className="lg:col-span-2">
                        <FieldLabel label="Reproducible Flag" />
                        <div className="flex gap-3 mt-1">
                            {REPRO_OPTIONS.map(opt => (
                                <label key={String(opt.value)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer border transition-all text-sm font-medium select-none"
                                    style={{
                                        background: watchReproducible === opt.value ? 'hsl(0 70% 55% / 0.1)' : 'var(--bg-secondary)',
                                        border: `1.5px solid ${watchReproducible === opt.value ? 'hsl(0 70% 55%)' : 'var(--border-color)'}`,
                                        color: watchReproducible === opt.value ? 'hsl(0 70% 50%)' : 'var(--text-primary)',
                                    }}>
                                    <Controller name="reproducible_flag" control={control} render={({ field }) => (
                                        <input
                                            type="radio"
                                            className="sr-only"
                                            value={String(opt.value)}
                                            checked={field.value === opt.value}
                                            onChange={() => field.onChange(opt.value)}
                                        />
                                    )} />
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    <SectionDivider title="Assignment" />

                    <div>
                        <FieldLabel label="Reporter" required icon={<User2 size={11} />} />
                        <Controller name="reporter_ref" control={control} render={({ field }) => (
                            <UserAutocomplete value={field.value} onChange={field.onChange} placeholder="Search reporter…" />
                        )} />
                        <FieldError message={errors.reporter_ref?.message as string} />
                    </div>
                    <div>
                        <FieldLabel label="Assignees" required icon={<Users size={11} />} />
                        <Controller name="assignees" control={control} render={({ field }) => (
                            <UserMultiSelect value={field.value} onChange={field.onChange} placeholder="Search assignees…" />
                        )} />
                        <FieldError message={errors.assignees?.message as string} />
                    </div>

                    <div>
                        <FieldLabel label="Followers" icon={<Users size={11} />} />
                        <Controller name="followers" control={control} render={({ field }) => (
                            <UserMultiSelect value={field.value} onChange={field.onChange} placeholder="Search followers…" />
                        )} />
                    </div>



                    <SectionDivider title="Schedule" />

                    <div>
                        <FieldLabel label="Start Date" required icon={<CalIcon size={11} />} />
                        <Controller name="start_date" control={control} render={({ field }) => (
                            <Calendar value={field.value} onChange={(e) => field.onChange(e.value)}
                                dateFormat="dd/mm/yy" showIcon showButtonBar
                                className={classNames('form-calendar w-full', { 'p-invalid': errors.start_date })}
                                placeholder="DD/MM/YYYY" />
                        )} />
                        <FieldError message={errors.start_date?.message as string} />
                    </div>

                    <div>
                        <FieldLabel label="Due Date" required icon={<CalIcon size={11} />} />
                        <Controller name="due_date" control={control} render={({ field }) => (
                            <Calendar value={field.value} onChange={(e) => field.onChange(e.value)}
                                dateFormat="dd/mm/yy" showIcon showButtonBar
                                className={classNames('form-calendar w-full', { 'p-invalid': errors.due_date })}
                                placeholder="DD/MM/YYYY"
                                minDate={watchStartDate instanceof Date ? watchStartDate : watchStartDate ? new Date(watchStartDate) : undefined} />
                        )} />
                        <FieldError message={errors.due_date?.message as string} />
                    </div>

                    <div>
                        <FieldLabel label="Estimated Hours" />
                        <InputText type="number" step="0.1" min="0" {...register('estimated_hours')}
                            placeholder="e.g. 4.5" className={inputCls()}
                            style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)', height: '44px' }} />
                    </div>

                    <div className="lg:col-span-3">
                        <FieldLabel label="Description / Steps to Reproduce" />
                        <InputTextarea {...register('description')} rows={4}
                            placeholder="Steps to reproduce, expected behavior vs actual behavior…"
                            className={inputCls()} style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)', resize: 'vertical' }} />
                    </div>

                    <div className="lg:col-span-3">
                        <FieldLabel label={`Attachments (${files.length}/5)`} />
                        <div className="rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-all"
                            style={{ border: '2px dashed var(--border-color)', background: 'var(--input-bg)' }}>
                            <UploadCloud size={28} style={{ color: 'hsl(0 70% 55%)' }} />
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                Drag & drop or{' '}
                                <label className="font-bold cursor-pointer" style={{ color: 'hsl(0 70% 55%)' }}>
                                    browse
                                    <input type="file" multiple accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt" className="hidden" onChange={handleFileChange} disabled={isBusy} />
                                </label>
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>PNG, PDF, DOC, ZIP — max 10 MB each, 5 files</p>
                            {files.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2 w-full">
                                    {files.map((f, i) => (
                                        <div key={i} className="relative group rounded-xl border overflow-hidden"
                                            style={{ border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                                            <div className="w-full h-16 flex items-center justify-center">
                                                {f.type.startsWith('image/') ? (
                                                    <img src={URL.createObjectURL(f)} alt={f.name} className="h-full w-full object-cover" />
                                                ) : <ImageIcon size={24} style={{ color: 'var(--text-muted)' }} />}
                                            </div>
                                            <p className="text-[10px] text-center px-1 pb-1 truncate" style={{ color: 'var(--text-muted)' }}>{f.name}</p>
                                            <button
                                                type="button"
                                                onClick={() => setFiles(p => p.filter((_, idx) => idx !== i))}
                                                className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center bg-slate-900/60 hover:bg-red-500 text-white transition-all z-10 shadow-sm"
                                                title="Remove Attachment"
                                            >
                                                <X size={12} strokeWidth={3} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-5 mt-5" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <Button variant="ghost" type="button" onClick={() => navigate(-1)}>Cancel</Button>
                    <Button variant="primary" type="submit" loading={isBusy} className="shadow-brand-teal-500/25">
                        {uploading ? 'Uploading…' : isBusy ? 'Saving…' : 'Report Defect'}
                    </Button>
                </div>
            </form>
        </PageLayout>
    );
}
