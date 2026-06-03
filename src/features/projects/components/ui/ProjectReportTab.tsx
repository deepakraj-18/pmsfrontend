import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import {
  CheckCircle, AlertCircle, Clock, Target,
  Download, RefreshCw, Layers, User,
} from 'lucide-react';
import { reportsService, ProjectReport } from '@/features/reports/api/reports.api';
import { Button } from '@/components/forms/Button';
import { exportToCSV } from '@/utils/export';
import { timelogsService } from '@/features/timelogs/api/timelogs.api';
import { tasksService } from '@/features/tasks/api/tasks.api';
import { issuesService } from '@/features/issues/api/issues.api';

const STATUS_COLORS: Record<string, string> = {
  'Completed': '#10B981',
  'In Progress': '#3B82F6',
  'Planning': '#F59E0B',
  'Open': '#94A3B8',
  'Hold': '#EC4899',
  'Cancelled': '#EF4444',
  'Resolved': '#10B981',
  'Re-Open': '#F97316',
  'Not a defect': '#6B7280',
  'Closed': '#6B7280',
};

const PRIORITY_COLORS: Record<string, string> = {
  'Critical': '#EF4444',
  'High': '#F97316',
  'Medium': '#F59E0B',
  'Low': '#3B82F6',
};

const USER_PALETTE = [
  '#14B8A6', '#8B5CF6', '#3B82F6', '#F59E0B',
  '#EC4899', '#10B981', '#6366F1', '#F97316',
];

function colorFor(key: string, map: Record<string, string>, fallback: string) {
  return map[key] ?? fallback;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl p-3 shadow-2xl text-xs">
      {label && <p className="text-slate-400 font-bold mb-1 uppercase tracking-wider">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-bold" style={{ color: p.color || p.fill || '#fff' }}>
          {p.name}: <span className="text-white">{typeof p.value === 'number' ? p.value.toFixed(p.value % 1 ? 1 : 0) : p.value}</span>
        </p>
      ))}
    </div>
  );
};

function ReportStat({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; accent: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="p-5 relative overflow-hidden group border border-slate-100 dark:border-slate-800/60 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
        <div
          className="absolute top-0 left-0 w-1 h-full rounded-full"
          style={{ background: accent }}
        />
        <div className="flex items-start gap-3 pl-3">
          <div
            className="p-2.5 rounded-xl flex-shrink-0"
            style={{ background: `${accent}18` }}
          >
            <div style={{ color: accent }}>{icon}</div>
          </div>
          <div className="min-w-0">
            <p className="text-[28px] font-black leading-none text-slate-800 dark:text-white tracking-tight">
              {value}
            </p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">{label}</p>
            {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface Props {
  projectId: number;
  project: any;
  tasks: any[];
  timelogs: any[];
  issues: any[];
}

export function ProjectReportTab({ projectId, project, tasks, timelogs, issues }: Props) {
  const [report, setReport] = useState<ProjectReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportsService.getProjectReport(projectId);
      setReport(data);
    } catch (e: any) {
      setError('Failed to load project report. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleExportTasks = () => {
    exportToCSV(
      tasks.map((t: any) => ({
        'ID': t.public_id,
        'Task Name': t.task_name,
        'Status': t.status?.name || 'Unknown',
        'Priority': t.priority?.name ?? 'N/A',
        'Assignee': t.assignee ? `${t.assignee.first_name} ${t.assignee.last_name}` : 'Unassigned',
        'Due Date': t.due_date ?? '',
        'Progress %': t.progress ?? 0,
        'Est. Hours': t.estimated_hours ?? 0,
      })),
      `${project?.name ?? 'project'}_tasks.csv`,
    );
  };

  const handleExportTimelogs = () => {
    exportToCSV(
      timelogs.map((t: any) => ({
        'User': t.user ? `${t.user.first_name} ${t.user.last_name}` : t.user_email,
        'Date': t.date,
        'Hours': t.hours,
        'Task': t.task?.title ?? 'General',
        'Description': t.description ?? '',
        'Billing': t.billing_type ?? '',
      })),
      `${project?.name ?? 'project'}_timelogs.csv`,
    );
  };

  const handleExportIssues = () => {
    exportToCSV(
      issues.map((i: any) => ({
        'Issue ID': i.public_id,
        'Title': i.title,
        'Status': i.status?.name ?? 'N/A',
        'Priority': i.priority?.name ?? 'N/A',
        'Assignee': i.assignee ? `${i.assignee.first_name} ${i.assignee.last_name}` : 'Unassigned',
        'Classification': i.classification ?? '',
        'Due Date': i.due_date ?? '',
      })),
      `${project?.name ?? 'project'}_issues.csv`,
    );
  };

  const completionPct = report && report.total_tasks > 0
    ? Math.min(100, Math.round((report.completed_tasks / report.total_tasks) * 100))
    : 0;

  const hoursUtilPct = project?.estimated_hours && report
    ? Math.min(100, Math.round((report.total_hours_logged / project.estimated_hours) * 100))
    : 0;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-200/50 dark:bg-slate-800/50" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="h-64 rounded-2xl bg-slate-200/50 dark:bg-slate-800/50" />
          <div className="h-64 rounded-2xl bg-slate-200/50 dark:bg-slate-800/50" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <AlertCircle className="w-10 h-10 text-rose-400" />
        <p className="text-slate-500 text-sm">{error}</p>
        <Button variant="secondary" onClick={load}>
          <RefreshCw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="space-y-6 pb-4">

      { }
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
            Project Analytics
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Live snapshot · {report.project_name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" onClick={load} title="Refresh">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button variant="secondary" size="md" onClick={handleExportTasks} title="Export Tasks">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Tasks
          </Button>
          <Button variant="secondary" size="md" onClick={handleExportTimelogs} title="Export Time Logs">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Time
          </Button>
          <Button variant="secondary" size="md" onClick={handleExportIssues} title="Export Defects">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Defects
          </Button>
        </div>
      </div>

      { }
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ReportStat
          icon={<Layers className="w-5 h-5" />}
          label="Total Tasks"
          value={report.total_tasks}
          sub={`${report.completed_tasks} completed`}
          accent="#14B8A6"
        />
        <ReportStat
          icon={<AlertCircle className="w-5 h-5" />}
          label="Open Defects"
          value={report.open_issues}
          sub={`${report.issues_by_priority.reduce((s, r) => s + r.count, 0)} total`}
          accent="#EF4444"
        />
        <ReportStat
          icon={<Clock className="w-5 h-5" />}
          label="Hours Logged"
          value={`${report.total_hours_logged.toFixed(1)}h`}
          sub={project?.estimated_hours ? `of ${project.estimated_hours}h est.` : undefined}
          accent="#8B5CF6"
        />
        <ReportStat
          icon={<Target className="w-5 h-5" />}
          label="Milestones"
          value={report.total_milestones}
          accent="#F59E0B"
        />
      </div>

      { }
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-5 border border-slate-100 dark:border-slate-800/60 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3">Task Completion</p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-black text-slate-800 dark:text-white">{completionPct}%</span>
            <span className="text-xs text-slate-400">{report.completed_tasks} / {report.total_tasks}</span>
          </div>
          <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #14b8a6, #6366f1)' }}
              initial={{ width: 0 }}
              animate={{ width: `${completionPct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="p-5 border border-slate-100 dark:border-slate-800/60 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3">Hours Utilisation</p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-black text-slate-800 dark:text-white">{hoursUtilPct}%</span>
            <span className="text-xs text-slate-400">
              {report.total_hours_logged.toFixed(1)}h {project?.estimated_hours ? `/ ${project.estimated_hours}h` : 'logged'}
            </span>
          </div>
          <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: hoursUtilPct >= 90
                  ? 'linear-gradient(90deg, #f97316, #ef4444)'
                  : 'linear-gradient(90deg, #8b5cf6, #3b82f6)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${hoursUtilPct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      { }
      <div className="grid md:grid-cols-2 gap-5">

        { }
        <div className="p-0 border border-slate-100 dark:border-slate-800/60 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-2.5 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="w-1.5 h-4 bg-teal-500 rounded-full" />
            <h4 className="text-[12px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
              Tasks by Status
            </h4>
          </div>
          <div className="p-5">
            {report.tasks_by_status.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                No task data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={report.tasks_by_status} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#33415510" vertical={false} />
                  <XAxis
                    dataKey="status"
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                    axisLine={false} tickLine={false} dy={8}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fontWeight: 500, fill: '#64748b' }}
                    axisLine={false} tickLine={false} allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100,116,139,0.06)' }} />
                  <Bar dataKey="count" name="Tasks" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {report.tasks_by_status.map((entry, i) => (
                      <Cell key={i} fill={colorFor(entry.status, STATUS_COLORS, '#94A3B8')} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        { }
        <div className="p-0 border border-slate-100 dark:border-slate-800/60 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-2.5 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="w-1.5 h-4 bg-rose-500 rounded-full" />
            <h4 className="text-[12px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
              Defects by Severity
            </h4>
          </div>
          <div className="p-5">
            {report.issues_by_priority.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                No defects logged for this project
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={report.issues_by_priority}
                    dataKey="count"
                    nameKey="priority"
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={85}
                    paddingAngle={4}
                    label={({ priority, percent }) =>
                      percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
                    }
                    labelLine={false}
                    stroke="none"
                  >
                    {report.issues_by_priority.map((entry, i) => (
                      <Cell key={i} fill={colorFor(entry.priority, PRIORITY_COLORS, USER_PALETTE[i % USER_PALETTE.length])} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle" iconSize={8}
                    wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '12px' }}
                    formatter={(value) => <span className="text-slate-600 dark:text-slate-300">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      { }
      {report.hours_by_user.length > 0 && (
        <div className="p-0 border border-slate-100 dark:border-slate-800/60 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-2.5 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="w-1.5 h-4 bg-violet-500 rounded-full" />
            <h4 className="text-[12px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
              Hours Logged per Team Member
            </h4>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={Math.max(160, report.hours_by_user.length * 44)}>
              <BarChart
                data={report.hours_by_user}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#33415510" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fontWeight: 500, fill: '#64748b' }}
                  axisLine={false} tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100,116,139,0.06)' }} />
                <Bar dataKey="hours" name="Hours" radius={[0, 6, 6, 0]} maxBarSize={22}>
                  {report.hours_by_user.map((_, i) => (
                    <Cell key={i} fill={USER_PALETTE[i % USER_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {report.hours_by_user.length === 0 && (
        <div className="p-8 border border-slate-100 dark:border-slate-800/60 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-center">
          <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm text-slate-400 font-medium">No time has been logged for this project yet.</p>
        </div>
      )}
    </div>
  );
}
