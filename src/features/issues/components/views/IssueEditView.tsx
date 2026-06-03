import React, { useEffect, useState } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { ConfirmationModal } from '@/components/core/ConfirmationModal';
import { Button } from '@/components/forms/Button';
import { SectionLoadingIndicator } from '@/components/feedback/Loader/SectionLoadingIndicator';
import { AlertTriangle, ImageIcon, Trash2, UploadCloud, X, Tag, User2, Users, Layers, Calendar as CalIcon } from 'lucide-react';
import { RadioButton } from 'primereact/radioButton';
import ServerSearchDropdown from '@/components/core/ServerSearchDropdown';
import { ServerLookupDropdown } from '@/components/core/ServerLookupDropdown';
import { UserAutocomplete } from '@/components/core/UserAutocomplete';
import { UserMultiSelect } from '@/components/core/UserMultiSelect';
import { useIssue } from '../../hooks/useIssues';
import { useIssueActions } from '../../hooks/useIssueActions';
import { documentsService } from '@/features/documents/api/documents.api';
import { useToast } from '@/providers/ToastContext';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { FieldError } from '@/components/forms/FieldError';
import { SectionDivider } from '@/components/forms/SectionDivider';
import { PremiumFormHeader } from '@/components/forms/PremiumFormHeader';
import { inputCls } from '@/components/forms/FormStyles';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { handleServerError } from '@/utils/errorHelpers';
import {
    ISSUE_CLASSIFICATIONS as CLASSIFICATIONS,
    SEVERITY_COLORS,
    BUG_TYPE_OPTIONS,
    REPRO_OPTIONS
} from '@/constants/constants';


const issueSchema = z.object({
    bug_name: z.string().trim().min(3, 'Min 3 characters').max(250, 'Defect name cannot exceed 250 characters'),
    description: z.string().trim().optional().nullable(),
    project_id: z.any().refine((v) => !!v, { message: 'Project is required' }),
    milestone_id: z.any().optional(),
    reporter_ref: z.any().refine((v) => !!v, { message: 'Reporter is required' }),
    status_ref: z.any().refine((v) => !!v, { message: 'Status is required' }),
    severity_ref: z.any().refine((v) => !!v, { message: 'Severity is required' }),
    bug_type: z.string().optional(),

    classification: z.any().optional(),
    module: z.string().trim().optional(),
    tags: z.string().trim().optional(),
    estimated_hours: z.string().optional(),
    start_date: z.any().refine((v) => !!v, { message: 'Start Date is required' }),
    due_date: z.any().refine((v) => !!v, { message: 'Due Date is required' }),
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

const extractId = (v: any) => (v && typeof v === 'object' ? v.id : v);
const toDate = (v: any) =>
    v instanceof Date ? v.toISOString().split('T')[0] : v || null;
const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/api\/v1$/, '') ?? '';

export function IssueEditView() {
    const { issueId } = useParams<{ issueId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    const id = parseInt(issueId ?? '0', 10);

    const { data: issue, isLoading } = useIssue(id);
    const { updateIssue, deleteIssue } = useIssueActions();

    const [existingDocs, setExistingDocs] = useState<any[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [dbStatusName, setDbStatusName] = useState('');

    const { control, register, handleSubmit, reset, setValue, watch, setError, formState: { errors } } =
        useForm<IssueFormValues>({
            resolver: zodResolver(issueSchema) as any,
            mode: 'onChange',
        });

    const watchBugType = watch('bug_type');
    const watchReproducible = watch('reproducible_flag');
    const watchStartDate = watch('start_date');
    const watchProjectId = useWatch({ control, name: 'project_id' });

    useEffect(() => {
        if (!issue) return;
        setDbStatusName(issue.status ?? '');
        setExistingDocs(issue.documents || []);
        reset({
            bug_name: issue.bug_name || '',
            description: issue.description || '',

            project_id: issue.project || null,
            milestone_id: issue.milestone || null,

            reporter_ref: issue.reporter || null,
            status_ref: issue.status_id || null,
            severity_ref: issue.severity_id || null,
            bug_type: issue.flag || 'Internal',
            classification: issue.classification_id || null,

            module: issue.module || '',
            tags: issue.tags || '',
            reproducible_flag: issue.reproducible_flag ?? true,
            estimated_hours: issue.estimated_hours?.toString() || '',
            start_date: issue.start_date ? new Date(issue.start_date) : null,
            due_date: issue.due_date ? new Date(issue.due_date) : null,
            assignees: issue.assignees || [],
            followers: issue.followers || [],
        });
    }, [issue, reset]);

    const onSubmit = async (data: IssueFormValues) => {
        setUploading(true);
        const pid = extractId(data.project_id);
        try {
            const newDocIds: number[] = [];
            if (files.length > 0) {
                if (!pid) { showToast('error', 'Validation', 'Select a project before uploading.'); setUploading(false); return; }
                for (const f of files) { const d = await documentsService.createDocument(f, pid, f.name); newDocIds.push(d.id); }
            }
            await updateIssue.mutateAsync({
                id,
                data: {
                    bug_name: data.bug_name, description: data.description || null,
                    project_id: pid ?? null,
                    milestone_id: extractId(data.milestone_id) ?? null,
                    reporter_email: (data.reporter_ref as any)?.mail || (data.reporter_ref as any)?.email || null,
                    assignee_emails: (data.assignees || []).map((a: any) => a.mail || a.email).filter(Boolean),
                    follower_emails: (data.followers || []).map((a: any) => a.mail || a.email).filter(Boolean),
                    status_id: extractId(data.status_ref),
                    severity_id: extractId(data.severity_ref),
                    flag: (data as any).bug_type || 'Internal',
                    classification_id: extractId(data.classification),

                    module: data.module || null, tags: data.tags || null,
                    estimated_hours: data.estimated_hours ? parseFloat(data.estimated_hours) : null,
                    start_date: toDate(data.start_date), due_date: toDate(data.due_date),
                    document_ids: [...existingDocs.map((d: any) => d.id), ...newDocIds],
                },
            });
            if (window.history.state && window.history.state.idx > 0) navigate(-1); else navigate(`/issues/${id}`, { replace: true });
        } catch (err: any) {
            console.error(err);
            handleServerError(err, setError, showToast, 'Update Failed', true);
        } finally { setUploading(false); }
    };

    const handleDelete = () => {
        setShowDeleteModal(true);
    };

    const onConfirmDelete = async () => {
        try {
            await deleteIssue.mutateAsync(id);

            setTimeout(() => {
                const fromPath = (location.state as any)?.from;
                if (fromPath) {
                    navigate(fromPath);
                } else {
                    navigate('/issues');
                }
            }, 500);
        } catch { } finally {
            setShowDeleteModal(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const sel = Array.from(e.target.files);
        if (existingDocs.length + files.length + sel.length > 5) { showToast('error', 'Limit', 'Max 5 images total.'); return; }
        setFiles(p => [...p, ...sel]);
    };

    if (isLoading) return <SectionLoadingIndicator fullPage label="Loading issue…" />;

    const isBusy = updateIssue.isPending || uploading;
    const attachCount = existingDocs.length + files.length;

    return (
        <>
            <ConfirmationModal
                visible={showDeleteModal}
                onHide={() => setShowDeleteModal(false)}
                onConfirm={onConfirmDelete}
                title="Delete Defect"
                message="Are you sure you want to delete this defect? This action cannot be undone."
                confirmLabel="Delete Defect"
                variant="danger"
                loading={deleteIssue.isPending}
            />
            <PageLayout title="Edit Defect" showBackButton onBack={() => { if (window.history.state && window.history.state.idx > 0) navigate(-1); else navigate(`/issues/${id}`, { replace: true }); }} actions={
                <Button variant="danger" type="Button" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" />Delete Defect</Button>
            }>
                <form onSubmit={handleSubmit(onSubmit as any)} className="max-w-[980px] mx-auto pb-16 px-4">
                    {errors.root && (
                        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
                            <AlertCircle size={16} />
                            <span>{errors.root.message}</span>
                        </div>
                    )}
                    <PremiumFormHeader
                        icon={AlertTriangle}
                        title="Edit Defect Details"
                        subtitle={`Modifying ${issue?.public_id || `DEF-${id}`}`}
                        color="red"
                    />

                    <div className="rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-premium)' }}>

                        <SectionDivider title="Defect Identification" />

                        <div className="lg:col-span-3">
                            <FieldLabel label="Defect Name" required icon={<AlertTriangle size={11} />} />
                            <InputText {...register('bug_name')} placeholder="Brief description of the defect"
                                className={inputCls(!!errors.bug_name)} />
                            <FieldError message={errors.bug_name?.message} />
                        </div>

                        <div>
                            <FieldLabel label="Project" required />
                            <Controller name="project_id" control={control} render={({ field }) => (
                                <ServerSearchDropdown
                                    entityType="projects"
                                    value={field.value}
                                    onChange={(v) => { field.onChange(v); setValue('milestone_id', null); }}
                                    placeholder="Search Projects…"
                                />
                            )} />
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
                            <FieldLabel label="Module" icon={<Layers size={11} />} />
                            <InputText {...register('module')} placeholder="e.g. Authentication, Billing…"
                                className={inputCls()} />
                        </div>

                        <div />

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
                                className={inputCls()} />
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
                                    dateFormat="dd/mm/yy" showIcon showButtonBar className="w-full"
                                    inputClassName="w-full rounded-xl px-3 py-2.5 text-sm" placeholder="DD/MM/YYYY" />
                            )} />
                        </div>

                        <div>
                            <FieldLabel label="Target Due Date" required icon={<CalIcon size={11} />} />
                            <Controller name="due_date" control={control} render={({ field }) => (
                                <Calendar value={field.value} onChange={(e) => field.onChange(e.value)}
                                    dateFormat="dd/mm/yy" showIcon showButtonBar className="w-full"
                                    inputClassName="w-full rounded-xl px-3 py-2.5 text-sm" placeholder="DD/MM/YYYY"
                                    minDate={watchStartDate instanceof Date ? watchStartDate : watchStartDate ? new Date(watchStartDate) : undefined} />
                            )} />
                            <FieldError message={errors.due_date?.message as string} />
                        </div>

                        <div>
                            <FieldLabel label="Estimated Hours" />
                            <InputText type="number" step="0.1" min="0" {...register('estimated_hours')}
                                placeholder="e.g. 4.5" className={inputCls()} />
                        </div>

                        <div className="lg:col-span-3">
                            <FieldLabel label="Description / Steps to Reproduce" />
                            <InputTextarea {...register('description')} rows={4}
                                placeholder="Steps to reproduce, expected behavior vs actual behavior…"
                                className={inputCls()} style={{ resize: 'vertical' }} />
                        </div>

                        <div className="lg:col-span-3">
                            <FieldLabel label={`Attachments (${attachCount}/5)`} />
                            <div className="rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-all"
                                style={{ border: '2px dashed var(--border-color)', background: 'var(--bg-secondary)' }}>
                                <UploadCloud size={28} style={{ color: 'hsl(0 70% 55%)' }} />
                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                    Drag & drop or{' '}
                                    <label className="font-bold cursor-pointer" style={{ color: 'hsl(0 70% 55%)' }}>
                                        browse
                                        <input type="file" multiple accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt" className="hidden" onChange={handleFileChange} disabled={isBusy} />
                                    </label>
                                </p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>PNG, PDF, DOC, ZIP — max 10 MB each, 5 files</p>
                                {(existingDocs.length > 0 || files.length > 0) && (
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2 w-full">
                                        {existingDocs.map((doc: any) => (
                                            <div key={`doc-${doc.id}`} className="relative group rounded-xl border overflow-hidden"
                                                style={{ border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                                                <div className="w-full h-16 flex items-center justify-center">
                                                    {(doc.file_type?.startsWith('image/') || doc.file_url?.match(/\.(jpeg|jpg|gif|png)$/i)) ? (
                                                        <img src={`${API_BASE}/api/v1/documents/${doc.id}/download?inline=true&token=${localStorage.getItem('pms_token')}`} alt={doc.title} className="h-full w-full object-cover" />
                                                    ) : <ImageIcon size={24} style={{ color: 'var(--text-muted)' }} />}
                                                </div>
                                                <p className="text-[10px] text-center px-1 pb-1 truncate" style={{ color: 'var(--text-muted)' }}>{doc.title}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setExistingDocs(p => p.filter(d => d.id !== doc.id))}
                                                    className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center bg-slate-900/60 hover:bg-red-500 text-white transition-all z-10 shadow-sm"
                                                    title="Remove Attachment"
                                                >
                                                    <X size={12} strokeWidth={3} />
                                                </button>
                                            </div>
                                        ))}
                                        {files.map((f, i) => (
                                            <div key={`file-${i}`} className="relative group rounded-xl border overflow-hidden"
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
                        <Button variant="ghost" type="Button" onClick={() => { if (window.history.state && window.history.state.idx > 0) navigate(-1); else navigate(`/issues/${id}`, { replace: true }); }}>Cancel</Button>
                        <Button variant="primary" type="submit" loading={isBusy} className="shadow-brand-teal-500/25">
                            {uploading ? 'Uploading…' : isBusy ? 'Saving…' : 'Save Defect'}
                        </Button>
                    </div>
                </form>
            </PageLayout>
        </>
    );
}
