import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { Button } from '@/components/forms/Button';
import { SectionLoadingIndicator } from '@/components/feedback/Loader/SectionLoadingIndicator';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { FieldError } from '@/components/forms/FieldError';
import { SectionDivider } from '@/components/forms/SectionDivider';
import { PremiumFormHeader } from '@/components/forms/PremiumFormHeader';
import { inputCls } from '@/components/forms/FormStyles';
import { formatLocalDate } from '@/utils/dateHelpers';
import { useMilestoneActions } from '@/features/milestones/hooks/useMilestoneActions';
import { milestonesService } from '@/api/services/milestones.service';
import ServerSearchDropdown from '@/components/core/ServerSearchDropdown';
import { ServerLookupDropdown } from '@/components/core/ServerLookupDropdown';
import { useToast } from '@/providers/ToastContext';
import { handleServerError } from '@/utils/errorHelpers';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Milestone as MilestoneIcon, Trash2, Tag, Calendar as CalIcon, Flag, Hash, Lock, Briefcase } from 'lucide-react';
import { ConfirmationModal } from '@/components/core/ConfirmationModal';

const milestoneSchema = z.object({
    milestone_name: z.string().trim().min(1, 'Milestone name is required'),
    description: z.string().optional().nullable(),
    project_id: z.any().refine((v) => !!v, { message: 'Project is required' }),
    status_id: z.any().optional().nullable(),
    priority_id: z.any().optional().nullable(),


    tags: z.string().optional().nullable(),
    start_date: z.any().optional().nullable(),
    end_date: z.any().optional().nullable(),
}).superRefine((data, ctx) => {
    if (data.start_date && data.end_date) {
        const start = new Date(data.start_date);
        const end = new Date(data.end_date);
        if (end < start) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "End Date cannot be before Start Date",
                path: ["end_date"]
            });
        }
    }
});

type MilestoneFormData = z.infer<typeof milestoneSchema>;

const extractId = (v: any) => v && typeof v === 'object' ? v.id : v;

export function MilestoneEditView() {
    const { milestoneId } = useParams<{ milestoneId: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { updateMilestone, deleteMilestone } = useMilestoneActions();

    const [loading, setLoading] = useState(true);
    const [publicId, setPublicId] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const {
        register, control, handleSubmit, reset, setError, watch,
        formState: { errors, isSubmitting },
    } = useForm<MilestoneFormData>({
        resolver: zodResolver(milestoneSchema),
        mode: 'onChange',
    });

    const watchProjectId = watch('project_id');

    useEffect(() => {
        if (!milestoneId) return;
        (async () => {
            try {
                const ms = await milestonesService.getMilestone(Number(milestoneId));
                setPublicId(ms.public_id);
                reset({
                    milestone_name: ms.milestone_name || (ms as any).title || '',
                    description: ms.description || '',
                    project_id: ms.project || (ms.project_id ? { id: ms.project_id, project_name: (ms as any).project_name || 'Project' } : null),
                    status_id: ms.status_master || ms.status_id || null,
                    priority_id: ms.priority_master || ms.priority_id || null,
                    tags: ms.tags || '',
                    start_date: ms.start_date ? new Date(ms.start_date) : null,
                    end_date: ms.end_date ? new Date(ms.end_date) : null,
                });
            } catch (err) {
                showToast('error', 'Error', 'Failed to load milestone data.');
            } finally {
                setLoading(false);
            }
        })();
    }, [milestoneId, reset, showToast]);

    const onSubmit = async (data: MilestoneFormData) => {
        if (!milestoneId) return;
        try {
            const pObj = data.priority_id;
            const pId = extractId(pObj);
            const pLabel = pObj?.label || pObj?.name || (typeof pObj === 'string' ? pObj : undefined);

            const sObj = data.status_id;
            const sId = extractId(sObj);
            const sLabel = sObj?.label || sObj?.name || (typeof sObj === 'string' ? sObj : undefined);

            await updateMilestone.mutateAsync({
                id: Number(milestoneId), data: {
                    milestone_name: data.milestone_name,
                    description: data.description || undefined,
                    project_id: extractId(data.project_id) || undefined,
                    status_id: sId,
                    status: sLabel,
                    priority_id: pId,
                    priority: pLabel,
                    tags: data.tags || undefined,
                    start_date: formatLocalDate(data.start_date) || undefined,
                    end_date: formatLocalDate(data.end_date) || undefined,
                } as any
            });
            navigate(-1);
        } catch (err: any) {
            console.error(err);
            handleServerError(err, setError, showToast, 'Update Failed', true);
        }
    };

    const handleDelete = () => setShowDeleteModal(true);

    const onConfirmDelete = async () => {
        if (!milestoneId) return;
        try {
            await deleteMilestone.mutateAsync(Number(milestoneId));
            const pid = extractId(watchProjectId);
            if (pid) {
                navigate(`/projects/${pid}?tab=Milestones`);
            } else {
                navigate('/milestones');
            }
        } catch { } finally {
            setShowDeleteModal(false);
        }
    };

    if (loading) return <SectionLoadingIndicator fullPage label="Loading milestone…" />;

    return (
        <PageLayout
            title="Edit Milestone"
            showBackButton onBack={() => navigate(-1)}
            actions={<Button variant="danger" type="button" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" />Delete</Button>}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="max-w-[980px] mx-auto pb-16 px-4">
                {errors.root && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
                        <AlertCircle size={16} />
                        <span>{errors.root.message}</span>
                    </div>
                )}

                <PremiumFormHeader
                    icon={MilestoneIcon}
                    title="Edit Milestone"
                    subtitle={`Modifying ${publicId}`}
                    color="violet"
                />

                <div
                    className="rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}
                >
                    <SectionDivider title="Milestone Identity" />

                    <div className="lg:col-span-2">
                        <FieldLabel label="Milestone Name" required icon={<MilestoneIcon size={11} />} />
                        <InputText
                            {...register('milestone_name')}
                            placeholder="e.g. Phase 1 Complete"
                            className={inputCls(!!errors.milestone_name)}
                            style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)', height: '44px' }}
                        />
                        <FieldError message={errors.milestone_name?.message} />
                    </div>

                    <div>
                        <FieldLabel label="Project" icon={<Briefcase size={11} />} />
                        <div
                            className="flex items-center gap-2.5 px-4 rounded-xl h-[44px] text-[13px] font-medium"
                            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        >
                            <Lock size={13} className="flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                            <span className="truncate">{(watchProjectId as any)?.project_name || (watchProjectId as any)?.name || 'Project'}</span>
                        </div>
                    </div>

                    <SectionDivider title="Status & Classification" />

                    <div>
                        <FieldLabel label="Status" icon={<Tag size={11} />} />
                        <Controller name="status_id" control={control} render={({ field }) => (
                            <ServerLookupDropdown
                                category="ProjectStatus"
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select status…"
                            />
                        )} />
                    </div>

                    <div>
                        <FieldLabel label="Priority" icon={<Flag size={11} />} />
                        <Controller name="priority_id" control={control} render={({ field }) => (
                            <ServerLookupDropdown
                                category="TaskPriority"
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select priority…"
                            />
                        )} />
                    </div>




                    <div>
                        <FieldLabel label="Tags" icon={<Hash size={11} />} />
                        <InputText
                            {...register('tags')}
                            placeholder="e.g. v2, release, critical"
                            className={inputCls()}
                            style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)', height: '44px' }}
                        />
                    </div>

                    <SectionDivider title="Schedule" />

                    <div>
                        <FieldLabel label="Start Date" icon={<CalIcon size={11} />} />
                        <Controller name="start_date" control={control} render={({ field }) => (
                            <Calendar
                                value={field.value}
                                onChange={(e) => field.onChange(e.value)}
                                dateFormat="dd/mm/yy" showIcon showButtonBar
                                className="form-calendar w-full"
                                placeholder="DD/MM/YYYY"
                            />
                        )} />
                    </div>

                    <div>
                        <FieldLabel label="End Date" icon={<CalIcon size={11} />} />
                        <Controller name="end_date" control={control} render={({ field }) => (
                            <Calendar
                                value={field.value}
                                onChange={(e) => field.onChange(e.value)}
                                dateFormat="dd/mm/yy" showIcon showButtonBar
                                className="form-calendar w-full"
                                inputClassName={errors.end_date ? "p-invalid" : ""}
                                placeholder="DD/MM/YYYY"
                            />
                        )} />
                        <FieldError message={errors.end_date?.message as string} />
                    </div>

                    <div className="lg:col-span-3">
                        <FieldLabel label="Description" />
                        <InputTextarea
                            {...register('description')}
                            rows={3}
                            placeholder="Brief milestone description…"
                            className={inputCls()}
                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical' }}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between pt-5 mt-5" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
                        Cancel
                    </Button>
                    <Button variant="gradient" type="submit" loading={isSubmitting}>
                        {isSubmitting ? 'Saving…' : 'Save Changes'}
                    </Button>
                </div>
            </form>
            <ConfirmationModal
                visible={showDeleteModal}
                onHide={() => setShowDeleteModal(false)}
                onConfirm={onConfirmDelete}
                title="Delete Milestone"
                message={`Are you sure you want to delete "${publicId}"? This action cannot be undone.`}
                confirmLabel="Delete Milestone"
                loading={deleteMilestone.isPending}
            />
        </PageLayout>
    );
}
