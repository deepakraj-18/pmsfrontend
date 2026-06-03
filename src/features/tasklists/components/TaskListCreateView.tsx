import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { Button } from '@/components/forms/Button';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { FieldError } from '@/components/forms/FieldError';
import { SectionDivider } from '@/components/forms/SectionDivider';
import { PremiumFormHeader } from '@/components/forms/PremiumFormHeader';
import { inputCls } from '@/components/forms/FormStyles';
import { tasklistsService } from '@/api/services/tasklists.service';
import ServerSearchDropdown from '@/components/core/ServerSearchDropdown';
import { useToast } from '@/providers/ToastContext';
import { useQuery } from '@tanstack/react-query';
import { projectsService } from '@/features/projects/api/projects.api';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Layers, FolderKanban, Milestone, Lock, Info } from 'lucide-react';
import { milestonesService } from '@/api/services/milestones.service';
import { useTaskListActions } from '@/features/tasklists/hooks/useTaskListActions';
import { handleServerError } from '@/utils/errorHelpers';

const schema = z.object({
    name: z.string().trim().min(1, 'Task list name is required'),
    description: z.string().optional(),
    project_id: z.any().refine((v) => !!v, { message: 'Project is required' }),
    milestone_id: z.any().optional(),
});

type FormData = z.infer<typeof schema>;

const extractId = (v: any) => (v && typeof v === 'object' ? v.id : v);

export function TaskListCreateView() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [searchParams] = useSearchParams();
    const presetProjectId = searchParams.get('project_id');
    const { createTaskList } = useTaskListActions();

    const { data: presetProject } = useQuery({
        queryKey: ['projects', 'detail', Number(presetProjectId)],
        queryFn: () => projectsService.getProject(Number(presetProjectId)),
        enabled: !!presetProjectId,
        staleTime: 5 * 60 * 1000,
    });

    const {
        register, control, handleSubmit, setValue,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        defaultValues: { name: '', description: '' },
    });
    useEffect(() => {
        if (presetProject) {
            setValue('project_id', presetProject);
        }
    }, [presetProject, setValue]);

    const selectedProject = useWatch({ control, name: 'project_id' });
    const projectId = extractId(selectedProject);
    const { data: milestonesRes, isLoading: loadingMilestones } = useQuery({
        queryKey: ['milestones', 'list', { project_id: projectId }],
        queryFn: () => milestonesService.getMilestones(projectId),
        enabled: !!projectId,
    });

    const milestones = Array.isArray(milestonesRes) ? milestonesRes : (milestonesRes as any)?.items || [];
    const noMilestones = !!projectId && !loadingMilestones && milestones.length === 0;

    const { data: existingListsRes } = useQuery({
        queryKey: ['tasklists', 'list', { project_id: projectId }],
        queryFn: () => tasklistsService.getTaskLists(projectId),
        enabled: !!projectId,
    });
    const existingLists = Array.isArray(existingListsRes) ? existingListsRes : (existingListsRes as any)?.items || [];

    const onSubmit = async (data: FormData) => {
        const isDuplicate = existingLists.some(
            (tl: any) => tl.name.toLowerCase().trim() === data.name.toLowerCase().trim()
        );

        if (isDuplicate) {
            showToast('error', 'Duplicate Name', `A task list named "${data.name}" already exists in this project.`);
            return;
        }

        try {
            await createTaskList.mutateAsync({
                name: data.name,
                description: data.description || undefined,
                project_id: extractId(data.project_id),
                milestone_id: extractId(data.milestone_id) || undefined,
            });
            if (presetProjectId) {
                navigate(`/projects/${presetProjectId}?tab=Tasks`);
            } else {
                navigate('/tasks');
            }
        } catch (err: any) {
            handleServerError(err, (null as any), showToast, 'Creation Failed');
        }
    };

    return (
        <PageLayout title="Create Task List" showBackButton backPath="/tasks">
            <form onSubmit={handleSubmit(onSubmit)} className="max-w-[760px] mx-auto pb-16 px-4 overflow-hidden min-w-0">

                <PremiumFormHeader
                    icon={Layers}
                    title="New Task List"
                    subtitle="Organise tasks within a project under a named list"
                    color="teal"
                />

                <div
                    className="rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-5"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-premium)' }}
                >
                    <SectionDivider title="List Details" />

                    <div className="md:col-span-2">
                        <FieldLabel label="Task List Name" required icon={<Layers size={11} />} />
                        <InputText
                            {...register('name')}
                            placeholder="e.g. First Release, Sprint 1, Design Phase"
                            className={`${inputCls(!!errors.name)} w-full break-words min-w-0`}
                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', height: '44px' }}
                        />
                        <FieldError message={errors.name?.message} />
                    </div>

                    <div>
                        <FieldLabel label="Project" required icon={<FolderKanban size={11} />} />
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

                    <div>
                        <FieldLabel label="Milestone" icon={<Milestone size={11} />} />
                        {noMilestones ? (
                            <div
                                className="flex items-center gap-2.5 px-4 rounded-xl h-[44px] text-[13px] font-medium text-slate-400 bg-slate-50/50 dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800"
                            >
                                <Info size={13} className="text-slate-400" />
                                <span>No milestones available</span>
                            </div>
                        ) : (
                            <Controller name="milestone_id" control={control} render={({ field }) => (
                                <ServerSearchDropdown
                                    entityType="milestones"
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Select Milestone"
                                    disabled={!projectId || loadingMilestones}
                                    filters={projectId ? { project_id: projectId } : {}}
                                />
                            )} />
                        )}
                        <FieldError message={errors.milestone_id?.message as string} />
                    </div>

                    <div className="md:col-span-2">
                        <FieldLabel label="Description" />
                        <InputTextarea
                            {...register('description')}
                            rows={3}
                            placeholder="Optional description for this task list…"
                            className={`${inputCls()} w-full break-words min-w-0`}
                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical' }}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between pt-5 mt-5" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <Button variant="ghost" type="Button" onClick={() => presetProjectId ? navigate(`/projects/${presetProjectId}?tab=Tasks`) : navigate('/tasks')}>Cancel</Button>
                    <Button variant="gradient" type="submit" loading={isSubmitting}>
                        {isSubmitting ? 'Creating…' : 'Create Task List'}
                    </Button>
                </div>
            </form>
        </PageLayout>
    );
}
