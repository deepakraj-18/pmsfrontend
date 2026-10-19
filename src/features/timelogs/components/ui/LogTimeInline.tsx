import React, { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputText } from 'primereact/inputtext';
import { Button } from '@/components/forms/Button';
import { FormField } from '@/components/forms/FormField';
import { useTimelogActions } from '../../hooks/useTimelogActions';
import { useToast } from '@/providers/ToastContext';
import { ServerLookupDropdown } from '@/components/core/ServerLookupDropdown';
import { timelogsService } from '../../api/timelogs.api';
import { tasksService } from '@/api/services/tasks.service';
import { issuesService } from '@/api/services/issues.service';
import { useAuth } from '@/auth/AuthProvider';
import { Clock, Timer, Zap } from 'lucide-react';
import { formatLocalDate } from '@/utils/dateHelpers';

const addSchema = z.object({
    log_title: z.string().trim().min(1, 'Log title is required'),
    date: z.date(),
    billing_type: z.enum(['Billable', 'Non-Billable', 'Internal']).default('Billable'),
    description: z.string().trim().optional(),
    duration_h: z.coerce.number().min(0).max(23).optional(),
    duration_m: z.coerce.number().min(0).max(59).optional(),
    start_h: z.coerce.number().min(0).max(23).optional(),
    start_m: z.coerce.number().min(0).max(59).optional(),
    start_ampm: z.enum(['am', 'pm']).optional(),
    end_h: z.coerce.number().min(0).max(23).optional(),
    end_m: z.coerce.number().min(0).max(59).optional(),
    end_ampm: z.enum(['am', 'pm']).optional(),
});

type AddFormValues = z.infer<typeof addSchema>;

const pad = (n: number) => String(n).padStart(2, '0');
const hoursOpts = Array.from({ length: 24 }, (_, i) => ({ label: pad(i), value: i }));
const minuteOpts = Array.from({ length: 60 }, (_, i) => ({ label: pad(i), value: i }));
const ampmOpts = [{ label: 'am', value: 'am' }, { label: 'pm', value: 'pm' }];

function toDecimalHours(h: number, m: number, startH: number, startM: number, sa: 'am' | 'pm', endH: number, endM: number, ea: 'am' | 'pm', mode: 'duration' | 'range'): number {
    if (mode === 'duration') return h + m / 60;
    const to24 = (hour: number, ampm: 'am' | 'pm') => {
        if (ampm === 'pm' && hour !== 12) return hour + 12;
        if (ampm === 'am' && hour === 12) return 0;
        return hour;
    };
    const startMin = to24(startH, sa) * 60 + startM;
    const endMin = to24(endH, ea) * 60 + endM;
    const diff = endMin - startMin;
    return diff > 0 ? diff / 60 : 0;
}

interface LogTimeInlineProps {
    projectId: number;
    taskId?: number;
    issueId?: number;
    onSuccess?: () => void;
}

export function LogTimeInline({ projectId, taskId, issueId, onSuccess }: LogTimeInlineProps) {
    const { showToast } = useToast();
    const { user } = useAuth();
    const { createTimelog } = useTimelogActions();
    const [timeMode, setTimeMode] = useState<'duration' | 'range'>('duration');
    const [submitting, setSubmitting] = useState(false);

    const { control, register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AddFormValues>({
        resolver: zodResolver(addSchema) as any,
        defaultValues: {
            log_title: '',
            date: new Date(),
            billing_type: 'Billable',
            description: '',
            duration_h: 0,
            duration_m: 30,
            start_h: 9,
            start_m: 0,
            start_ampm: 'am',
            end_h: 10,
            end_m: 0,
            end_ampm: 'am',
        }
    });

    const watched = watch();

    const calculatedDiffMins = useMemo(() => {
        const to24 = (h: number, ampm: 'am' | 'pm') => {
            const hh = Number(h);
            if (ampm === 'pm' && hh !== 12) return hh + 12;
            if (ampm === 'am' && hh === 12) return 0;
            return hh;
        };
        const sm = to24(watched.start_h ?? 9, watched.start_ampm ?? 'am') * 60 + Number(watched.start_m ?? 0);
        const em = to24(watched.end_h ?? 10, watched.end_ampm ?? 'am') * 60 + Number(watched.end_m ?? 0);
        return em - sm;
    }, [watched.start_h, watched.start_m, watched.start_ampm, watched.end_h, watched.end_m, watched.end_ampm]);

    const onSubmit = async (data: AddFormValues) => {
        setSubmitting(true);
        try {
            const totalHours = toDecimalHours(
                data.duration_h ?? 0, data.duration_m ?? 0,
                data.start_h ?? 9, data.start_m ?? 0, data.start_ampm ?? 'am',
                data.end_h ?? 10, data.end_m ?? 0, data.end_ampm ?? 'am',
                timeMode
            );

            if (totalHours <= 0) {
                showToast('error', 'Validation', 'Hours logged must be greater than 0.');
                setSubmitting(false);
                return;
            }

            if (taskId || issueId) {
                let estimated = 0;
                let logged = 0;
                if (issueId) {
                    const issue = await issuesService.getIssue(issueId);
                    estimated = Number(issue.estimated_hours || 0);
                    const logs = await timelogsService.getTimelogs(0, 2000, undefined, undefined, issueId);
                    logged = logs.reduce((sum, l) => sum + Number(l.daily_log_hours || 0), 0);
                } else if (taskId) {
                    const task = await tasksService.getTask(taskId);
                    estimated = Number(task.work_hours || task.estimated_hours || 0);
                    const logs = await timelogsService.getTimelogs(0, 2000, undefined, taskId, undefined);
                    logged = logs.reduce((sum, l) => sum + Number(l.daily_log_hours || 0), 0);
                }

                if (estimated > 0 && logged + totalHours > estimated) {
                    showToast('error', 'Validation', `Limit exceeded. Remaining: ${(estimated - logged).toFixed(1)}h`);
                    setSubmitting(false);
                    return;
                }
            }

            await createTimelog.mutateAsync({
                project_id: projectId,
                task_id: taskId || null,
                issue_id: issueId || null,
                date: formatLocalDate(data.date),
                daily_log_hours: totalHours,
                log_title: data.log_title,
                notes: data.description,
                billing_type: data.billing_type,
                approval_status: 'Pending',
            });

            showToast('success', 'Time Logged', 'Time log has been successfully added.');
            setValue('log_title', '');
            setValue('description', '');
            onSuccess?.();
        } catch (err: any) {
            showToast('error', 'Failed', err.response?.data?.detail || 'Could not log time');
        } finally {
            setSubmitting(false);
        }
    };

    const shellPt = {
        root: { style: { border: '1px solid var(--border-color)', borderRadius: '8px', height: '36px', width: '100%' } },
        input: { className: 'px-2 text-[13px] flex items-center h-full' },
        trigger: { className: 'w-6 text-slate-400' },
        panel: { className: 'rounded-xl shadow-xl border border-slate-100 bg-white dark:bg-slate-900 mt-1' },
        item: { className: 'text-[12px] p-2' }
    };

    return (
        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600">
                    <Clock size={16} />
                </div>
                <h3 className="text-sm font-bold">Quick Log Time</h3>
            </div>

            <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Log Title" required error={errors.log_title?.message}>
                        <InputText {...register('log_title')} placeholder="What did you work on?" className="w-full h-9 text-sm" />
                    </FormField>

                    <FormField label="Date" required error={errors.date?.message as string}>
                        <Controller name="date" control={control} render={({ field }) => (
                            <Calendar value={field.value} onChange={(e) => field.onChange(e.value)} maxDate={new Date()} dateFormat="dd-mm-yy" showIcon className="w-full h-9 text-sm" inputClassName="h-9 text-sm" />
                        )} />
                    </FormField>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black uppercase text-slate-500">Duration Settings</span>
                        <div className="flex p-0.5 rounded-lg bg-slate-200/50 dark:bg-slate-700/50">
                            <button type="button" onClick={() => setTimeMode('duration')} className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${timeMode === 'duration' ? 'bg-white dark:bg-slate-600 shadow-sm text-teal-600' : 'text-slate-500'}`}>Duration</button>
                            <button type="button" onClick={() => setTimeMode('range')} className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${timeMode === 'range' ? 'bg-white dark:bg-slate-600 shadow-sm text-teal-600' : 'text-slate-500'}`}>Range</button>
                        </div>
                    </div>

                    {timeMode === 'duration' ? (
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Controller name="duration_h" control={control} render={({ field }) => (
                                    <Dropdown value={field.value} options={hoursOpts} onChange={(e) => field.onChange(e.value)} pt={shellPt} className="w-20" />
                                )} />
                                <span className="text-[10px] font-bold text-slate-400">HRS</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Controller name="duration_m" control={control} render={({ field }) => (
                                    <Dropdown value={field.value} options={minuteOpts} onChange={(e) => field.onChange(e.value)} pt={shellPt} className="w-20" />
                                )} />
                                <span className="text-[10px] font-bold text-slate-400">MINS</span>
                            </div>
                            <div className="ml-auto px-3 py-1 rounded-lg bg-teal-500/10 text-teal-600 font-black text-sm">
                                {pad(watched.duration_h ?? 0)}:{pad(watched.duration_m ?? 0)}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Controller name="start_h" control={control} render={({ field }) => (
                                    <Dropdown value={field.value} options={Array.from({ length: 12 }, (_, i) => ({ label: pad(i + 1), value: i + 1 }))} onChange={(e) => field.onChange(e.value)} pt={shellPt} className="w-16" />
                                )} />
                                <Controller name="start_m" control={control} render={({ field }) => (
                                    <Dropdown value={field.value} options={minuteOpts} onChange={(e) => field.onChange(e.value)} pt={shellPt} className="w-16" />
                                )} />
                                <Controller name="start_ampm" control={control} render={({ field }) => (
                                    <Dropdown value={field.value} options={ampmOpts} onChange={(e) => field.onChange(e.value)} pt={shellPt} className="w-16" />
                                )} />
                            </div>
                            <div className="text-slate-300">to</div>
                            <div className="flex items-center gap-2">
                                <Controller name="end_h" control={control} render={({ field }) => (
                                    <Dropdown value={field.value} options={Array.from({ length: 12 }, (_, i) => ({ label: pad(i + 1), value: i + 1 }))} onChange={(e) => field.onChange(e.value)} pt={shellPt} className="w-16" />
                                )} />
                                <Controller name="end_m" control={control} render={({ field }) => (
                                    <Dropdown value={field.value} options={minuteOpts} onChange={(e) => field.onChange(e.value)} pt={shellPt} className="w-16" />
                                )} />
                                <Controller name="end_ampm" control={control} render={({ field }) => (
                                    <Dropdown value={field.value} options={ampmOpts} onChange={(e) => field.onChange(e.value)} pt={shellPt} className="w-16" />
                                )} />
                            </div>
                            <div className="ml-auto px-3 py-1 rounded-lg bg-teal-500/10 text-teal-600 font-black text-sm">
                                {calculatedDiffMins <= 0 ? '0:00' : `${Math.floor(calculatedDiffMins / 60)}:${pad(calculatedDiffMins % 60)}`}
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Billing Type">
                        <Controller name="billing_type" control={control} render={({ field }) => (
                            <ServerLookupDropdown category="TaskBillingType" value={field.value} onChange={field.onChange} placeholder="Billing Type" className="h-9" />
                        )} />
                    </FormField>
                    <FormField label="Notes">
                        <InputTextarea {...register('description')} rows={2} placeholder="Description..." className="w-full text-sm p-2 bg-slate-50 dark:bg-slate-800" autoResize />
                    </FormField>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="primary" type="submit" loading={submitting} className="h-9 px-6 text-sm">
                        Log Hours
                    </Button>
                </div>
            </form>
        </div>
    );
}
