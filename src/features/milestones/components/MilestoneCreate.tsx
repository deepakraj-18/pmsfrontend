import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { Button } from '@/components/forms/Button';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { FieldError } from '@/components/forms/FieldError';
import { SectionDivider } from '@/components/forms/SectionDivider';
import { PremiumFormHeader } from '@/components/forms/PremiumFormHeader';
import { inputCls } from '@/components/forms/FormStyles';
import { formatLocalDate } from '@/utils/dateHelpers';
import { handleServerError } from '@/utils/errorHelpers';
import { useMilestoneActions } from '../hooks/useMilestoneActions';
import { useQuery } from '@tanstack/react-query';
import { projectsService } from '@/features/projects/api/projects.api';
import ServerSearchDropdown from '@/components/core/ServerSearchDropdown';
import { ServerLookupDropdown } from '@/components/core/ServerLookupDropdown';
import { useToast } from '@/providers/ToastContext';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Milestone as MilestoneIcon, Tag, Calendar as CalIcon, Flag, Hash, Lock, AlertCircle } from 'lucide-react';

const FLAG_OPTIONS = ['Internal', 'External'].map(f => ({ label: f, value: f }));

const milestoneSchema = z.object({
    milestone_name: z.string().trim().min(1, 'Milestone name is required'),
    description: z.string().optional(),
    project_id: z.any().refine((v) => !!v, { message: 'Project is required' }),
    status_id: z.any().optional().nullable(),
    priority_id: z.any().optional().nullable(),
    tags: z.string().optional(),
    owner_email: z.string().optional(),
    start_date: z.any().optional(),
    end_date: z.any().optional(),
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

export function MilestoneCreate() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [searchParams] = useSearchParams();
    const presetProjectId = searchParams.get('project_id');
    const { createMilestone } = useMilestoneActions();
    const { data: presetProject } = useQuery({
        queryKey: ['projects', 'detail', Number(presetProjectId)],
        queryFn: () => projectsService.getProject(Number(presetProjectId)),
        enabled: !!presetProjectId,
        staleTime: 5 * 60 * 1000,
    });

    const {
        register, control, handleSubmit, setValue, setError,
        formState: { errors, isSubmitting },
    } = useForm<MilestoneFormData>({
        resolver: zodResolver(milestoneSchema),
        mode: 'onChange',
        defaultValues: {
            milestone_name: '',
            description: '',
            tags: '',
            start_date: new Date(),
        },
    });
    useEffect(() => {
        if (presetProject) {
            setValue('project_id', presetProject);
        }
    }, [presetProject, setValue]);


    const onSubmit = async (data: MilestoneFormData) => {
        try {
            const pObj = data.priority_id;
            const pId = extractId(pObj);
            const pLabel = pObj?.label || pObj?.name || (typeof pObj === 'string' ? pObj : undefined);

            const sObj = data.status_id;
            const sId = extractId(sObj);
            const sLabel = sObj?.label || sObj?.name || (typeof sObj === 'string' ? sObj : undefined);

            await createMilestone.mutateAsync({
                milestone_name: data.milestone_name,
                description: data.description || undefined,
                project_id: extractId(data.project_id),
                status_id: sId,
                status: sLabel,
                priority_id: pId,
                priority: pLabel,
                tags: data.tags || undefined,
                start_date: formatLocalDate(data.start_date) || undefined,
                end_date: formatLocalDate(data.end_date) || undefined,
            } as any);
            if (presetProjectId) {
                navigate(`/projects/${presetProjectId}?tab=Milestones`);
            } else {
                navigate('/milestones');
            }
        } catch (err: any) {
            console.error(err);
            handleServerError(err, setError, showToast, 'Creation Failed', true);
        }
    };

    return (
        <PageLayout title="Create New Milestone" showBackButton backPath="/milestones">
            <form onSubmit={handleSubmit(onSubmit)} className="max-w-[980px] mx-auto pb-16 px-4">
                {errors.root && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
                        <AlertCircle size={16} />
                        <span>{errors.root.message}</span>
                    </div>
                )}

                <PremiumFormHeader
                    icon={MilestoneIcon}
                    title="New Milestone"
                    subtitle="Define a key project checkpoint with dates and ownership"
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
                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', height: '44px' }}
                        />
                        <FieldError message={errors.milestone_name?.message} />
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
                                <ServerSearchDropdown
                                    entityType="projects"
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Select Project"
                                />
                            )} />
                        )}
                        <FieldError message={errors.project_id?.message as string} />
                    </div>

                    <SectionDivider title="Classification" />



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
                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', height: '44px' }}
                        />
                    </div>


                    <div />

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

                    <div />

                    <div className="lg:col-span-3">
                        <FieldLabel label="Description" />
                        <InputTextarea
                            {...register('description')}
                            rows={3}
                            placeholder="Brief milestone description or objective…"
                            className={inputCls()}
                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical' }}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between pt-5 mt-5" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <Button variant="ghost" type="Button" onClick={() => presetProjectId ? navigate(`/projects/${presetProjectId}?tab=Milestones`) : navigate('/milestones')}>Cancel</Button>
                    <Button variant="gradient" type="submit" loading={isSubmitting}>
                        {isSubmitting ? 'Creating…' : 'Create Milestone'}
                    </Button>
                </div>
            </form>
        </PageLayout>
    );
}
