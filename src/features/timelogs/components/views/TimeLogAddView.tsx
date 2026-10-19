import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputText } from 'primereact/inputtext';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { Button } from '@/components/forms/Button';
import { FormField } from '@/components/forms/FormField';
import ServerSearchDropdown from '@/components/core/ServerSearchDropdown';
import { useTimelogActions } from '../../hooks/useTimelogActions';
import { useToast } from '@/providers/ToastContext';
import { ServerLookupDropdown } from '@/components/core/ServerLookupDropdown';
import { timelogsService } from '../../api/timelogs.api';
import { projectsService } from '@/api/services/projects.service';
import { tasksService } from '@/api/services/tasks.service';
import { issuesService } from '@/api/services/issues.service';
import { useAuth } from '@/auth/AuthProvider';
import {
  Clock,
  Timer,
  Zap,
  FolderKanban,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { formatLocalDate } from '@/utils/dateHelpers';

const addSchema = z.object({
  project_id: z.any().refine((v) => !!v, { message: 'Project is required' }),
  work_item: z.any().refine((v) => !!v, { message: 'Task/Bug is required' }),
  log_title: z.string().trim().min(1, 'Log title is required'),
  date: z.string().min(1, 'Date is required'),
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

const extractId = (val: any): number | null =>
  val && typeof val === 'object' ? val.id : val ?? null;

const pad = (n: number) => String(n).padStart(2, '0');

const hoursOpts = Array.from({ length: 24 }, (_, i) => ({ label: pad(i), value: i }));
const minuteOpts = Array.from({ length: 60 }, (_, i) => ({ label: pad(i), value: i }));
const ampmOpts = [{ label: 'am', value: 'am' }, { label: 'pm', value: 'pm' }];


function toDecimalHours(h: number, m: number, startH: number, startM: number, sa: 'am' | 'pm', endH: number, endM: number, ea: 'am' | 'pm', mode: 'duration' | 'range'): number {
  if (mode === 'duration') {
    return h + m / 60;
  }
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

interface CapacityBannerProps {
  projectId: number | null;
  taskId?: number | null;
  issueId?: number | null;
}

function CapacityBanner({ projectId, taskId, issueId }: CapacityBannerProps) {
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsService.getProject(projectId!),
    enabled: !!projectId,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['timelogs', 'project', projectId],
    queryFn: () => timelogsService.getTimelogs(0, 2000, projectId!),
    enabled: !!projectId,
  });

  const { data: task } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => tasksService.getTask(taskId!),
    enabled: !!taskId,
  });

  const { data: taskLogs = [] } = useQuery({
    queryKey: ['timelogs', 'task', taskId],
    queryFn: () => timelogsService.getTimelogs(0, 2000, undefined, taskId!),
    enabled: !!taskId,
  });

  const { data: issue } = useQuery({
    queryKey: ['issue', issueId],
    queryFn: () => issuesService.getIssue(issueId!),
    enabled: !!issueId,
  });

  const { data: issueLogs = [] } = useQuery({
    queryKey: ['timelogs', 'issue', issueId],
    queryFn: () => timelogsService.getTimelogs(0, 2000, undefined, undefined, issueId!),
    enabled: !!issueId,
  });

  if (!projectId || !project) return null;

  const projEst = Number(project.estimated_hours ?? 0);
  const projLogged = logs.reduce((sum, l) => sum + Number(l.daily_log_hours ?? 0), 0);
  const projRemaining = projEst - projLogged;
  const showProjectCapacity = projEst > 0 && projRemaining <= 4;

  // 1. Task Capacity
  if (taskId && task && !showProjectCapacity) {
    const taskEst = Number(task.estimated_hours ?? task.work_hours ?? 0);
    const taskLogged = taskLogs.reduce((sum, l) => sum + Number(l.daily_log_hours ?? 0), 0);
    const taskRemaining = taskEst - taskLogged;
    
    const pct = taskEst > 0 ? Math.min((taskLogged / taskEst) * 100, 100) : 0;
    const status: 'ok' | 'warn' | 'over' = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'ok';
    const statusCfg = {
      ok: { icon: <CheckCircle2 size={16} />, label: 'On Track', bar: 'from-teal-400 to-teal-500' },
      warn: { icon: <AlertTriangle size={16} />, label: 'Near Limit', bar: 'from-amber-400 to-orange-500' },
      over: { icon: <TrendingUp size={16} />, label: 'Exceeded', bar: 'from-red-400 to-red-600' },
    }[status];

    return (
      <div className="rounded-2xl overflow-hidden mb-6" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
        <div className="px-5 py-3 flex items-center gap-2.5" style={{ background: 'linear-gradient(135deg, #B3F57B 0%, #0CD1C3 100%)' }}>
          <Zap size={15} className="text-slate-800" />
          <span className="text-[13px] font-bold text-slate-900 tracking-wide">
            Task Capacity — {task.task_name}
          </span>
          <span className="ml-auto flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.1)', color: '#1e293b' }}>
            {statusCfg.icon}
            {statusCfg.label}
          </span>
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center gap-6 flex-wrap mb-3">
            <StatChip label="Estimated" value={`${taskEst.toFixed(1)}h`} color="var(--text-secondary)" />
            <StatChip label="Logged" value={`${taskLogged.toFixed(1)}h`} color="#14b8a6" />
            <StatChip label="Remaining" value={taskRemaining >= 0 ? `${taskRemaining.toFixed(1)}h` : `−${Math.abs(taskRemaining).toFixed(1)}h`} color={status === 'over' ? '#ef4444' : status === 'warn' ? '#f59e0b' : '#14b8a6'} />
          </div>
          {taskEst > 0 && (
            <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
              <div className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${statusCfg.bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
            </div>
          )}
          {taskEst === 0 && (
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              No estimated hours set for this task.
            </p>
          )}
        </div>
      </div>
    );
  }

  // 2. Issue/Defect Capacity
  if (issueId && issue && !showProjectCapacity) {
    const issueEst = Number(issue.estimated_hours ?? 0);
    const issueLogged = issueLogs.reduce((sum, l) => sum + Number(l.daily_log_hours ?? 0), 0);
    const issueRemaining = issueEst - issueLogged;

    const pct = issueEst > 0 ? Math.min((issueLogged / issueEst) * 100, 100) : 0;
    const status: 'ok' | 'warn' | 'over' = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'ok';
    const statusCfg = {
      ok: { icon: <CheckCircle2 size={16} />, label: 'On Track', bar: 'from-teal-400 to-teal-500' },
      warn: { icon: <AlertTriangle size={16} />, label: 'Near Limit', bar: 'from-amber-400 to-orange-500' },
      over: { icon: <TrendingUp size={16} />, label: 'Exceeded', bar: 'from-red-400 to-red-600' },
    }[status];

    return (
      <div className="rounded-2xl overflow-hidden mb-6" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
        <div className="px-5 py-3 flex items-center gap-2.5" style={{ background: 'linear-gradient(135deg, #B3F57B 0%, #0CD1C3 100%)' }}>
          <Zap size={15} className="text-slate-800" />
          <span className="text-[13px] font-bold text-slate-900 tracking-wide">
            Defect Capacity — {issue.bug_name}
          </span>
          <span className="ml-auto flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.1)', color: '#1e293b' }}>
            {statusCfg.icon}
            {statusCfg.label}
          </span>
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center gap-6 flex-wrap mb-3">
            <StatChip label="Estimated" value={`${issueEst.toFixed(1)}h`} color="var(--text-secondary)" />
            <StatChip label="Logged" value={`${issueLogged.toFixed(1)}h`} color="#14b8a6" />
            <StatChip label="Remaining" value={issueRemaining >= 0 ? `${issueRemaining.toFixed(1)}h` : `−${Math.abs(issueRemaining).toFixed(1)}h`} color={status === 'over' ? '#ef4444' : status === 'warn' ? '#f59e0b' : '#14b8a6'} />
          </div>
          {issueEst > 0 && (
            <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
              <div className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${statusCfg.bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
            </div>
          )}
          {issueEst === 0 && (
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              No estimated hours set for this defect.
            </p>
          )}
        </div>
      </div>
    );
  }

  // 3. Fallback: Project Capacity
  const estimated = Number(project.estimated_hours ?? 0);
  const logged = logs.reduce((sum, l) => sum + Number(l.daily_log_hours ?? 0), 0);
  const remaining = estimated - logged;
  const pct = estimated > 0 ? Math.min((logged / estimated) * 100, 100) : 0;

  const status: 'ok' | 'warn' | 'over' =
    pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'ok';

  const statusCfg = {
    ok: { icon: <CheckCircle2 size={16} />, label: 'On Track', bar: 'from-teal-400 to-teal-500' },
    warn: { icon: <AlertTriangle size={16} />, label: 'Near Limit', bar: 'from-amber-400 to-orange-500' },
    over: { icon: <TrendingUp size={16} />, label: 'Exceeded', bar: 'from-red-400 to-red-600' },
  }[status];

  return (
    <div
      className="rounded-2xl overflow-hidden mb-6"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
      }}
    >
      <div
        className="px-5 py-3 flex items-center gap-2.5"
        style={{ background: 'linear-gradient(135deg, #B3F57B 0%, #0CD1C3 100%)' }}
      >
        <Zap size={15} className="text-slate-800" />
        <span className="text-[13px] font-bold text-slate-900 tracking-wide">
          Project Capacity — {project.project_name}
        </span>
        <span
          className="ml-auto flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(0,0,0,0.1)', color: '#1e293b' }}
        >
          {statusCfg.icon}
          {statusCfg.label}
        </span>
      </div>

      <div className="px-5 py-4">
        <div className="flex items-center gap-6 flex-wrap mb-3">
          <StatChip label="Estimated" value={`${estimated.toFixed(1)}h`} color="var(--text-secondary)" />
          <StatChip label="Logged" value={`${logged.toFixed(1)}h`} color="#14b8a6" />
          <StatChip
            label="Remaining"
            value={remaining >= 0 ? `${remaining.toFixed(1)}h` : `−${Math.abs(remaining).toFixed(1)}h`}
            color={status === 'over' ? '#ef4444' : status === 'warn' ? '#f59e0b' : '#14b8a6'}
          />
        </div>

        {estimated > 0 && (
          <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
            <div
              className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${statusCfg.bar} transition-all duration-700`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
        {estimated === 0 && (
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            No estimated hours set for this project.
          </p>
        )}
      </div>
    </div>
  );
}

function StatChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span className="text-[20px] font-extrabold tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

const shellPt = {
  root: { style: { border: 'none', background: 'transparent', height: '42px', width: '100%' } },
  input: { className: 'px-3 text-slate-900 dark:text-white flex items-center h-full text-[13px] font-medium' },
  trigger: { className: 'w-8 flex items-center justify-center text-slate-400' },
  panel: { className: 'rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 mt-1 overflow-hidden' },
  item: { className: 'text-[13px] p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors' }
};

const billingShellPt = {
  root: { style: { border: 'none', background: 'transparent', height: '44px', width: '100%' } },
  input: { className: 'px-4 text-slate-900 dark:text-white flex items-center h-full text-[13px] font-bold' },
  trigger: { className: 'w-10 flex items-center justify-center text-slate-400' },
  panel: { className: 'rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 mt-1.5 overflow-hidden' },
  item: { className: 'text-[13px] p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors' }
};

export function TimeLogAddView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { logId } = useParams<{ logId: string }>();
  const location = useLocation();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { createTimelog, updateTimelog } = useTimelogActions();
  const isEditMode = !!logId;
  const preselectedProjectId = searchParams.get('project_id') || searchParams.get('projectId');
  const preselectedTaskId = searchParams.get('task_id') || searchParams.get('taskId');
  const preselectedIssueId = searchParams.get('issue_id') || searchParams.get('issueId');

  const [timeMode, setTimeMode] = useState<'duration' | 'range'>('duration');
  const [submitting, setSubmitting] = useState(false);

  const { data: presetProject } = useQuery({
    queryKey: ['projects', 'detail', Number(preselectedProjectId)],
    queryFn: () => projectsService.getProject(Number(preselectedProjectId)),
    enabled: !!preselectedProjectId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: presetTask } = useQuery({
    queryKey: ['tasks', 'detail', Number(preselectedTaskId)],
    queryFn: () => tasksService.getTask(Number(preselectedTaskId)),
    enabled: !!preselectedTaskId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: presetIssue } = useQuery({
    queryKey: ['issues', 'detail', Number(preselectedIssueId)],
    queryFn: () => issuesService.getIssue(Number(preselectedIssueId)),
    enabled: !!preselectedIssueId,
    staleTime: 5 * 60 * 1000,
  });

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<AddFormValues>({
    resolver: zodResolver(addSchema) as any,
    defaultValues: {
      project_id: preselectedProjectId ? Number(preselectedProjectId) : null,
      work_item: null,
      log_title: '',
      date: formatLocalDate(new Date()) || '',
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
    },
  });

  useEffect(() => {
    if (presetProject) {
      setValue('project_id', presetProject);
    }
  }, [presetProject, setValue]);

  useEffect(() => {
    if (presetTask) {
      setValue('work_item', { ...presetTask, name: presetTask.task_name, id: presetTask.id });
    }
  }, [presetTask, setValue]);

  useEffect(() => {
    if (presetIssue) {
      setValue('work_item', { ...presetIssue, name: presetIssue.bug_name, type: 'issue', id: presetIssue.id });
    }
  }, [presetIssue, setValue]);

  const watchedProject = watch('project_id');
  const projectId = extractId(watchedProject);
  const watchedWorkItem = watch('work_item');
  const taskId = watchedWorkItem && watchedWorkItem.type !== 'issue' ? watchedWorkItem.id : null;
  const issueId = watchedWorkItem && watchedWorkItem.type === 'issue' ? watchedWorkItem.id : null;

  const startH = watch('start_h');
  const startM = watch('start_m');
  const startAmPm = watch('start_ampm');
  const endH = watch('end_h');
  const endM = watch('end_m');
  const endAmPm = watch('end_ampm');
  const durationH = watch('duration_h');
  const durationM = watch('duration_m');

  const calculatedDiffMins = useMemo(() => {
    const to24 = (h: number, ampm: 'am' | 'pm') => {
      const hh = Number(h);
      if (ampm === 'pm' && hh !== 12) return hh + 12;
      if (ampm === 'am' && hh === 12) return 0;
      return hh;
    };

    const sH = startH ?? 9;
    const sM = startM ?? 0;
    const sA = startAmPm ?? 'am';
    const eH = endH ?? 10;
    const eM = endM ?? 0;
    const eA = endAmPm ?? 'am';

    const sm = to24(sH, sA) * 60 + Number(sM);
    const em = to24(eH, eA) * 60 + Number(eM);
    return em - sm;
  }, [startH, startM, startAmPm, endH, endM, endAmPm]);


  useEffect(() => {
    if (!logId) return;
    timelogsService.getTimelog(parseInt(logId, 10)).then((log: any) => {
      const h = Math.floor(Number(log.daily_log_hours ?? 0));
      const m = Math.round((Number(log.daily_log_hours ?? 0) - h) * 60);

      const workItem = (log.task ? { ...log.task, name: log.task.task_name || log.task.name, id: log.task.id } : null) ||
        (log.issue ? { ...log.issue, name: log.issue.bug_name || log.issue.name, type: 'issue', id: log.issue.id } : null) ||
        (log.task_id ? { id: log.task_id, name: log.task_name || 'Task' } : null) ||
        (log.issue_id ? { id: log.issue_id, name: log.bug_name || 'Bug', type: 'issue' } : null);

      setValue('project_id', log.project || { id: log.project_id, project_name: log.project_name || 'Project' } || null);
      setValue('work_item', workItem);
      setValue('log_title', log.log_title || '');
      setValue('date', log.date ? log.date.split('T')[0] : formatLocalDate(new Date()) || '');
      setValue('billing_type', log.billing_type || 'Billable');
      setValue('description', log.notes || '');
      setValue('duration_h', h);
      setValue('duration_m', m);
    }).catch(() => showToast('error', 'Error', 'Failed to load time log.'));
  }, [logId]);

  const onSubmit = async (data: AddFormValues) => {
    setSubmitting(true);
    try {
      const pid = extractId(data.project_id);
      let tId: number | null = null;
      let iId: number | null = null;

      if (data.work_item) {
        if ((data.work_item as any).type === 'issue') iId = extractId(data.work_item);
        else tId = extractId(data.work_item);
      }

      const totalHours = toDecimalHours(
        data.duration_h ?? 0,
        data.duration_m ?? 0,
        data.start_h ?? 9,
        data.start_m ?? 0,
        data.start_ampm ?? 'am',
        data.end_h ?? 10,
        data.end_m ?? 0,
        data.end_ampm ?? 'am',
        timeMode,
      );

      if (totalHours <= 0) {
        showToast('error', 'Validation', 'Hours logged must be greater than 0.');
        setSubmitting(false);
        return;
      }

      if (tId || iId) {
        let estimated = 0;
        let logged = 0;
        let name = '';

        if (iId) {
          const issue = await issuesService.getIssue(iId);
          estimated = Number(issue.estimated_hours || 0);
          name = `Issue "${issue.bug_name}"`;
          const logs = await timelogsService.getTimelogs(0, 2000, undefined, undefined, iId);
          logged = logs.reduce((sum, l) => sum + Number(l.daily_log_hours || 0), 0);
        } else if (tId) {
          const task = await tasksService.getTask(tId);
          estimated = Number(task.work_hours || task.estimated_hours || 0);
          name = `Task "${task.task_name}"`;
          const logs = await timelogsService.getTimelogs(0, 2000, undefined, tId, undefined);
          logged = logs.reduce((sum, l) => sum + Number(l.daily_log_hours || 0), 0);
        }

        if (estimated > 0) {
          let oldHours = 0;
          if (isEditMode && logId) {
            const oldLog = await timelogsService.getTimelog(parseInt(logId, 10));
            oldHours = Number(oldLog.daily_log_hours || 0);
          }

          if (logged - oldHours + totalHours > estimated) {
            showToast('error', 'Validation', `Cannot log time. ${name} only has ${Math.max(0, estimated - (logged - oldHours)).toFixed(1)}h remaining.`);
            setSubmitting(false);
            return;
          }
        }
      }

      if (isEditMode && logId) {
        await updateTimelog.mutateAsync({
          id: parseInt(logId, 10),
          data: {
            project_id: pid!,
            task_id: tId,
            issue_id: iId,
            date: data.date,
            daily_log_hours: totalHours,
            log_title: data.log_title,
            notes: data.description,
            billing_type: data.billing_type,
          },
        });
      } else {
        await createTimelog.mutateAsync({
          project_id: pid!,
          task_id: tId,
          issue_id: iId,
          date: data.date,
          daily_log_hours: totalHours,
          log_title: data.log_title,
          notes: data.description,
          billing_type: data.billing_type,
          approval_status: 'Pending',
          general_log: !tId && !iId,
        });
      }
      if (location.state?.from) navigate(location.state.from);
      else if (preselectedTaskId) navigate(`/tasks/${preselectedTaskId}`);
      else if (preselectedIssueId) navigate(`/issues/${preselectedIssueId}`);
      else if (preselectedProjectId) navigate(`/projects/${preselectedProjectId}?tab=Time Logs`);
      else if (window.history.state && window.history.state.idx > 0) navigate(-1);
      else navigate('/time-log');
    } catch (err: any) {
      handleServerError(err, setError, showToast, 'Logging Failed', true);
    } finally {
      setSubmitting(false);
    }
  };

  const isBusy = submitting || createTimelog.isPending || (updateTimelog?.isPending ?? false);

  const getBackPath = () => {
    if (location.state?.from) return location.state.from;
    if (preselectedTaskId) return `/tasks/${preselectedTaskId}`;
    if (preselectedIssueId) return `/issues/${preselectedIssueId}`;
    if (preselectedProjectId) return `/projects/${preselectedProjectId}?tab=Time Logs`;
    return '/time-log';
  };
  const dynamicBackPath = getBackPath();

  return (
    <PageLayout
      title={isEditMode ? 'Edit Time Log' : 'Add Time Log'}
      showBackButton
      backPath={dynamicBackPath}
    >
      <div
        className="max-w-3xl mx-auto rounded-2xl"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
        }}
      >
        {errors.root && (
          <div className="mx-6 mt-6 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle size={16} />
            <span>{errors.root.message}</span>
          </div>
        )}
        <div
          className="px-6 py-4 flex items-center gap-3 rounded-t-2xl"
          style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #B3F57B 0%, #0CD1C3 100%)' }}
          >
            <Clock size={15} className="text-slate-900" />
          </div>
          <div>
            <p className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>New Time Log</p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Time logging is not allowed for future dates and times • Log hours cannot exceed the allotted Task work hours.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit as any)} className="p-6 space-y-5">

          <CapacityBanner projectId={projectId} taskId={taskId} issueId={issueId} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Project" required error={errors.project_id?.message as string}>
              {(presetProject || isEditMode) ? (
                <div
                  className="flex items-center gap-2.5 px-4 rounded-xl h-[44px] text-[13px] font-medium"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <Lock size={13} className="flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                  <span className="truncate">
                    {presetProject?.project_name || (watchedProject as any)?.project_name || (watchedProject as any)?.name || 'Project'}
                  </span>
                </div>
              ) : (
                <Controller
                  name="project_id"
                  control={control}
                  render={({ field }) => (
                    <ServerSearchDropdown
                      entityType="projects"
                      placeholder="Select Project"
                      value={field.value}
                      onChange={(v) => {
                        field.onChange(v);
                        setValue('work_item', null);
                      }}
                      className="w-full"
                    />
                  )}
                />
              )}
            </FormField>

            <Controller
              name="project_id"
              control={control}
              render={({ field: pf }) => {
                const pId = extractId(pf.value);
                return (
                  <FormField label="Task / Bug" required error={errors.work_item?.message as string}>
                    <Controller
                      name="work_item"
                      control={control}
                      render={({ field }) => (
                        <ServerSearchDropdown
                          entityType="workitems"
                          endpoint="/search/work-items"
                          field="name"
                          project_id={pId}
                          disabled={!pId}
                          placeholder="Search task or bug…"
                          value={field.value}
                          onChange={field.onChange}
                          className="w-full"
                        />
                      )}
                    />
                  </FormField>
                );
              }}
            />
          </div>

          <FormField label="Log Title" required error={errors.log_title?.message}>
            <InputText
              {...register('log_title')}
              placeholder="e.g. Client meeting, Sprint planning…"
              className="w-full"
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                height: '44px',
                padding: '0 12px',
                fontSize: '13px',
                width: '100%',
              }}
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Date" required error={errors.date?.message}>
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <div className="form-field-shell w-full">
                    <Calendar
                      value={field.value ? new Date(field.value) : null}
                      onChange={(e) =>
                        field.onChange(
                          e.value
                            ? formatLocalDate(e.value as Date)
                            : '',
                        )
                      }
                      maxDate={new Date()}
                      dateFormat="dd-mm-yy"
                      showIcon
                      showButtonBar
                      placeholder="DD-MM-YYYY"
                      style={{ background: 'transparent', border: 'none', width: '100%' }}
                      inputStyle={{ background: 'transparent', border: 'none', height: '44px', width: '100%', fontSize: '13px', paddingLeft: '12px' }}
                      className="w-full"
                    />
                  </div>
                )}
              />
            </FormField>

            <FormField label="User">
              <InputText
                value={user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email : ''}
                readOnly
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  height: '44px',
                  padding: '0 12px',
                  fontSize: '13px',
                  width: '100%',
                  cursor: 'default',
                }}
              />
            </FormField>
          </div>

          <div
            className="rounded-2xl p-6"
            style={{ border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Time Management
              </span>
              <div
                className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-inner"
              >
                <Button
                  unstyled
                  type="button"
                  onClick={() => setTimeMode('duration')}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all"
                  style={{
                    background: timeMode === 'duration' ? 'linear-gradient(135deg, #B3F57B 0%, #0CD1C3 100%)' : 'transparent',
                    color: timeMode === 'duration' ? '#0f172a' : 'var(--text-muted)',
                    boxShadow: timeMode === 'duration' ? '0 2px 8px rgba(12, 209, 195, 0.25)' : 'none',
                  }}
                >
                  <Clock size={12} /> Duration
                </Button>
                <Button
                  unstyled
                  type="button"
                  onClick={() => setTimeMode('range')}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all"
                  style={{
                    background: timeMode === 'range' ? 'linear-gradient(135deg, #B3F57B 0%, #0CD1C3 100%)' : 'transparent',
                    color: timeMode === 'range' ? '#0f172a' : 'var(--text-muted)',
                    boxShadow: timeMode === 'range' ? '0 2px 8px rgba(12, 209, 195, 0.25)' : 'none',
                  }}
                >
                  <Timer size={12} /> Range
                </Button>
              </div>
            </div>

            {timeMode === 'duration' ? (
              <div className="flex items-center gap-4 h-[44px]">
                <div className="flex items-center gap-2">
                  <div className="form-field-shell shadow-sm" style={{ width: '105px', height: '44px' }}>
                    <Controller name="duration_h" control={control} render={({ field }) => (
                      <Dropdown
                        value={field.value}
                        options={hoursOpts}
                        onChange={(e) => field.onChange(e.value)}
                        pt={shellPt}
                      />
                    )} />
                  </div>
                  <span className="text-[11px] font-black text-slate-400">HRS</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="form-field-shell shadow-sm" style={{ width: '105px', height: '44px' }}>
                    <Controller name="duration_m" control={control} render={({ field }) => (
                      <Dropdown
                        value={field.value}
                        options={minuteOpts}
                        onChange={(e) => field.onChange(e.value)}
                        pt={shellPt}
                      />
                    )} />
                  </div>
                  <span className="text-[11px] font-black text-slate-400">MINS</span>
                </div>
                <div className="hidden sm:block flex-1" />
                <div className="px-5 h-[44px] flex items-center rounded-2xl bg-white dark:bg-slate-900 border-2 border-teal-500/20 shadow-sm whitespace-nowrap">
                  <span className="text-[15px] font-black text-slate-900 dark:text-teal-400 tabular-nums">
                    {pad(durationH ?? 0)}:{pad(durationM ?? 0)} <span className="text-[11px] opacity-60 ml-1 uppercase">Total</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col xl:flex-row xl:items-center gap-5">
                <div className="flex flex-wrap items-center gap-5 flex-1">
                  { }
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase text-slate-400 w-8">Start</span>
                    <div className="flex items-center gap-2">
                      <div className="form-field-shell shadow-sm" style={{ width: '80px', height: '44px' }}>
                        <Controller name="start_h" control={control} render={({ field }) => (
                          <Dropdown value={field.value} options={Array.from({ length: 12 }, (_, i) => ({ label: pad(i + 1), value: i + 1 }))}
                            onChange={(e) => field.onChange(e.value)} pt={shellPt} />
                        )} />
                      </div>
                      <span className="font-bold text-slate-300">:</span>
                      <div className="form-field-shell shadow-sm" style={{ width: '80px', height: '44px' }}>
                        <Controller name="start_m" control={control} render={({ field }) => (
                          <Dropdown value={field.value} options={minuteOpts} onChange={(e) => field.onChange(e.value)}
                            pt={shellPt} />
                        )} />
                      </div>
                      <div className="form-field-shell shadow-sm" style={{ width: '90px', height: '44px' }}>
                        <Controller name="start_ampm" control={control} render={({ field }) => (
                          <Dropdown value={field.value} options={ampmOpts} onChange={(e) => field.onChange(e.value)}
                            pt={shellPt} />
                        )} />
                      </div>
                    </div>
                  </div>

                  <div className="hidden lg:block w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

                  { }
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase text-slate-400 w-8">End</span>
                    <div className="flex items-center gap-2">
                      <div className="form-field-shell shadow-sm" style={{ width: '80px', height: '44px' }}>
                        <Controller name="end_h" control={control} render={({ field }) => (
                          <Dropdown value={field.value} options={Array.from({ length: 12 }, (_, i) => ({ label: pad(i + 1), value: i + 1 }))}
                            onChange={(e) => field.onChange(e.value)} pt={shellPt} />
                        )} />
                      </div>
                      <span className="font-bold text-slate-300">:</span>
                      <div className="form-field-shell shadow-sm" style={{ width: '80px', height: '44px' }}>
                        <Controller name="end_m" control={control} render={({ field }) => (
                          <Dropdown value={field.value} options={minuteOpts} onChange={(e) => field.onChange(e.value)}
                            pt={shellPt} />
                        )} />
                      </div>
                      <div className="form-field-shell shadow-sm" style={{ width: '90px', height: '44px' }}>
                        <Controller name="end_ampm" control={control} render={({ field }) => (
                          <Dropdown value={field.value} options={ampmOpts} onChange={(e) => field.onChange(e.value)}
                            pt={shellPt} />
                        )} />
                      </div>
                    </div>
                  </div>
                </div>

                { }
                <div className="h-[44px] self-start xl:self-center flex items-center px-5 rounded-2xl font-black text-[15px] bg-teal-50 dark:bg-teal-900/10 text-teal-600 dark:text-teal-400 border-2 border-teal-500/20 shadow-sm tabular-nums whitespace-nowrap">
                  {calculatedDiffMins <= 0 ? '0:00' : `${Math.floor(calculatedDiffMins / 60)}:${pad(calculatedDiffMins % 60)}`}
                  <span className="text-[11px] opacity-60 ml-1 uppercase">Total</span>
                </div>
              </div>
            )}
          </div>

          <FormField label="Billing Type" required error={errors.billing_type?.message}>
            <Controller
              name="billing_type"
              control={control}
              render={({ field }) => (
                <ServerLookupDropdown
                  category="TaskBillingType"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select Billing Type"
                />
              )}
            />
          </FormField>

          <FormField label="Notes" error={errors.description?.message}>
            <InputTextarea
              {...register('description')}
              rows={4}
              placeholder="Describe what you worked on… (supports markdown notes)"
              autoResize
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                padding: '10px 12px',
                fontSize: '13px',
                width: '100%',
                resize: 'vertical',
              }}
            />
          </FormField>

          <div
            className="flex items-center justify-between pt-4"
            style={{ borderTop: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>
              <FolderKanban size={13} />
              Logged as <strong style={{ color: 'var(--text-primary)' }}>{user?.email}</strong>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" type="button" onClick={() => navigate(dynamicBackPath)} disabled={isBusy}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isBusy}
                className="!h-[40px] px-5 !rounded-lg"
              >
                <Clock size={15} />
                {isBusy ? 'Saving…' : 'Add'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </PageLayout>
  );
}
