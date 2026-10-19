import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { Button } from '@/components/forms/Button';
import { WeeklyMatrixForm } from '../ui/WeeklyMatrixForm';
import { useTimelogActions } from '../../hooks/useTimelogActions';
import { useToast } from '@/providers/ToastContext';
import { tasksService } from '@/api/services/tasks.service';
import { issuesService } from '@/api/services/issues.service';
import { timelogsService } from '../../api/timelogs.api';

const rowSchema = z.object({
  project: z.any().refine(val => !!val, { message: 'Project is required' }),
  task: z.any().refine(val => !!val, { message: 'Task/Bug is required' }),
  hours: z.array(z.coerce.number().min(0).max(24, 'Max 24h/day')),
});

const weeklySchema = z.object({
  logs: z.array(rowSchema).min(1, 'At least one row required'),
});

type WeeklyFormValues = z.infer<typeof weeklySchema>;

const extractId = (val: any) => (val && typeof val === 'object' ? val.id : val);

export function WeeklyTimeLogAddView() {
  const navigate = useNavigate();
  const { bulkCreateTimelogs } = useTimelogActions();
  const { showToast } = useToast();
  const [dateReference, setDateReference] = useState(new Date());
  const [validating, setValidating] = useState(false);

  const weekDays = useMemo(() => {
    const dates = [];
    const dt = new Date(dateReference);
    const day = dt.getDay();
    dt.setDate(dt.getDate() - day);
    for (let i = 0; i < 7; i++) {
      const nd = new Date(dt);
      nd.setDate(nd.getDate() + i);
      dates.push(nd);
    }
    return dates;
  }, [dateReference]);

  const { control, register, handleSubmit, setValue, formState: { errors } } = useForm<WeeklyFormValues>({
    resolver: zodResolver(weeklySchema) as any,
    defaultValues: {
      logs: [{ project: null, task: null, hours: [0, 0, 0, 0, 0, 0, 0] }],
    },
  });

  const handleDateShift = (direction: 'prev' | 'next') => {
    setDateReference(prev => {
      const nd = new Date(prev);
      nd.setDate(nd.getDate() + (direction === 'next' ? 7 : -7));
      return nd;
    });
  };

  const onSubmit = async (data: WeeklyFormValues) => {
    const payloads: any[] = [];
    let hasHours = false;

    for (const row of data.logs) {
      const projectId = extractId(row.project);
      if (!projectId) continue;

      let tId = null, iId = null;
      if (row.task) {
        if (row.task.type === 'issue') iId = extractId(row.task);
        else tId = extractId(row.task);
      }

      for (let i = 0; i < 7; i++) {
        if (row.hours[i] && row.hours[i] > 0) {
          hasHours = true;
          const logDate = new Date(weekDays[i]);
          const dateStr = [
            logDate.getFullYear(),
            String(logDate.getMonth() + 1).padStart(2, '0'),
            String(logDate.getDate()).padStart(2, '0')
          ].join('-');

          payloads.push({
            project_id: projectId,
            task_id: tId,
            issue_id: iId,
            date: dateStr,
            daily_log_hours: row.hours[i],
            billing_type: 'Billable',
            approval_status: 'Pending',
            general_log: !tId && !iId,
            notes: '',
            log_title: ''
          });
        }
      }
    }

    if (!hasHours) {
      showToast('error', 'Validation', 'No hours entered on any filled rows.');
      return;
    }

    setValidating(true);
    try {
      const taskHoursMap = new Map<string, { totalHours: number; tId?: number; iId?: number }>();
      for (const row of data.logs) {
        if (!row.task) continue;
        let tId = null, iId = null;
        if (row.task.type === 'issue') iId = extractId(row.task);
        else tId = extractId(row.task);
        const key = iId ? `issue_${iId}` : `task_${tId}`;
        let rowTotal = 0;
        for (let i = 0; i < 7; i++) {
          if (row.hours[i] && row.hours[i] > 0) rowTotal += row.hours[i];
        }
        if (rowTotal > 0) {
          const existing = taskHoursMap.get(key) || { totalHours: 0, tId: tId as number, iId: iId as number };
          existing.totalHours += rowTotal;
          taskHoursMap.set(key, existing);
        }
      }

      for (const [key, info] of taskHoursMap.entries()) {
        let estimated = 0;
        let logged = 0;
        let name = '';

        if (info.iId) {
          const issue = await issuesService.getIssue(info.iId);
          estimated = Number(issue.estimated_hours || 0);
          name = `Issue "${issue.bug_name}"`;
          const logs = await timelogsService.getTimelogs(0, 2000, undefined, undefined, info.iId);
          logged = logs.reduce((sum, l) => sum + Number(l.daily_log_hours || 0), 0);
        } else if (info.tId) {
          const task = await tasksService.getTask(info.tId);
          estimated = Number(task.work_hours || task.estimated_hours || 0);
          name = `Task "${task.task_name}"`;
          const logs = await timelogsService.getTimelogs(0, 2000, undefined, info.tId, undefined);
          logged = logs.reduce((sum, l) => sum + Number(l.daily_log_hours || 0), 0);
        }

        if (estimated > 0 && (logged + info.totalHours > estimated)) {
          showToast('error', 'Validation', `Cannot log time. ${name} only has ${Math.max(0, estimated - logged).toFixed(1)}h remaining.`);
          setValidating(false);
          return;
        }
      }

      await bulkCreateTimelogs.mutateAsync({ logs: payloads });
      navigate('/time-log');
    } catch (err: any) {
      showToast('error', 'Error', err?.message || 'Failed to save periodic time logs.');
    } finally {
      setValidating(false);
    }
  };

  const isBusy = bulkCreateTimelogs.isPending || validating;

  return (
    <PageLayout
      title="Weekly Time Log"
      showBackButton
      backPath="/time-log"
      actions={
        <div className="flex gap-3">
          {/* <Button variant="secondary" onClick={() => navigate('/time-log')} disabled={isBusy}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={isBusy}
            onClick={handleSubmit(onSubmit as any)}
            className="!h-10 px-5 !rounded-lg"
          >
            {isBusy ? 'Saving…' : 'Save Logs'}
          </Button> */}
        </div>
      }
    >
      <div
        className="max-w-[1400px] mx-auto rounded-2xl"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
        }}
      >
        <div
          className="px-6 py-4 flex items-center gap-3 rounded-t-2xl"
          style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #B3F57B 0%, #0CD1C3 100%)' }}
          >
            <span className="font-bold text-slate-900 text-[14px]">W</span>
          </div>
          <div>
            <p className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>Weekly Time Matrix</p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Log hours across multiple projects and tasks for the entire week.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit as any)} className="p-6">
          <WeeklyMatrixForm
            control={control}
            register={register}
            setValue={setValue}
            days={weekDays}
            onDateShift={handleDateShift}
            errors={errors}
          />

          <div
            className="flex items-center justify-end mt-6 pt-5"
            style={{ borderTop: '1px solid var(--border-color)' }}
          >
            <div className="flex gap-3">
              <Button variant="secondary" type="button" onClick={() => navigate('/time-log')} disabled={isBusy}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isBusy}
                className="!h-10 px-5 !rounded-lg"
              >
                {isBusy ? 'Saving…' : 'Save Matrix'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </PageLayout>
  );
}
