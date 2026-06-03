import React, { useState, useEffect, useMemo } from 'react';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { Card } from '@/components/layout/Card';
import { Button } from '@/components/forms/Button';
import { DataTable as PrimeDataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { StatCard, StatCardProps } from '@/components/data-display/StatCard';
import { SectionLoadingIndicator } from '@/components/feedback/Loader/SectionLoadingIndicator';
import { FileText, Download, Calendar, TrendingUp, Layers, AlertCircle, Clock, CheckCircle, ArrowLeft, Search } from 'lucide-react';
import { reportsService, ReportSummary } from '@/features/reports/api/reports.api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/providers/ToastContext';
import { exportToCSV } from '@/utils/export';
import { projectsService } from '@/features/projects/api/projects.api';
import { timelogsService } from '@/features/timelogs/api/timelogs.api';
import { issuesService } from '@/features/issues/api/issues.api';
import { tasksService } from '@/api/services/tasks.service';
import { motion, AnimatePresence } from 'framer-motion';

const getArrayData = (res: any) => {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.items)) return res.items;
  return [];
};

const reportTypes = [
  {
    id: 1,
    title: 'Project Status Report',
    description: 'Comprehensive overview of all active projects, their progress, and key metrics.',
    icon: <FileText className="w-6 h-6" />,
    frequency: 'Weekly',
    gradient: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
  },
  {
    id: 2,
    title: 'Time Tracking Report',
    description: 'Detailed breakdown of time logged by team members across projects and tasks.',
    icon: <Calendar className="w-6 h-6" />,
    frequency: 'Monthly',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
  },
  {
    id: 3,
    title: 'Defect Analysis Report',
    description: 'Analysis of defects by severity, status, and resolution time logic.',
    icon: <TrendingUp className="w-6 h-6" />,
    frequency: 'Bi-weekly',
    gradient: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
  },
  {
    id: 4,
    title: 'Overdue Tasks by User Report',
    description: 'Lists all overdue tasks across all projects mapped to their assignees.',
    icon: <AlertCircle className="w-6 h-6" />,
    frequency: 'Daily',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
  }
];

export function Reports() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeReport, setActiveReport] = useState<number | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await reportsService.getSummary();
        setSummary(data);
      } catch (error) {
        console.error('Failed to fetch report summary:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const getReportMappedData = async (id: number) => {
    if (id === 1) {
      const res = await projectsService.getProjects({ skip: 0, limit: 500 });
      const projects = getArrayData(res);
      return projects.map((p: any, index: number) => ({
        id: p.id || index,
        'Project ID':       p.public_id ?? '',
        'Project Name':     p.project_name ?? '',
        'Customer Name':    p.customer_name ?? '',
        'Client Name':      p.client_name ?? '',
        'Billing Model':    p.billing_model ?? '',
        'Project Type':     p.project_type ?? '',
        'Status':           p.status_master?.label ?? p.status?.label ?? 'N/A',
        'Priority':         p.priority_master?.label ?? p.priority?.label ?? 'N/A',
        'Owner':            p.owner ? [p.owner.first_name, p.owner.last_name].filter(Boolean).join(' ') : 'N/A',
        'Project Manager':  p.project_manager ? [p.project_manager.first_name, p.project_manager.last_name].filter(Boolean).join(' ') : 'N/A',
        'Expected Start':   p.expected_start_date ?? 'N/A',
        'Expected End':     p.expected_end_date ?? 'N/A',
        'Estimated Hours':  p.estimated_hours ?? '',
        'Actual Hours':     p.actual_hours ?? '',
        'Tags':             p.tags ?? '',
      }));
    } else if (id === 2) {
      const res = await timelogsService.getTimelogs(0, 500);
      const timelogs = getArrayData(res);
      return timelogs.map((t: any, index: number) => ({
        id: t.id || index,
        'Log ID':          t.public_id ?? t.id ?? '',
        'Log Title':       t.log_title ?? '',
        'Date':            t.date ? String(t.date).split('T')[0] : 'N/A',
        'Project':         t.project?.project_name ?? t.task?.project?.project_name ?? 'N/A',
        'Task':            t.task?.task_name ?? 'N/A',
        'Issue':           t.issue?.bug_name ?? 'N/A',
        'User':            t.user ? [t.user.first_name, t.user.last_name].filter(Boolean).join(' ') : 'N/A',
        'Hours':           Number(t.daily_log_hours ?? 0).toFixed(2),
        'Billing Type':    t.billing_type ?? 'N/A',
        'Approval Status': t.approval_status_master?.label ?? t.approval_status?.label ?? 'N/A',
        'Notes':           t.notes ?? '',
      }));
    } else if (id === 3) {
      try {
        const res = await issuesService.getIssues({ skip: 0, limit: 500 });
        const issues = getArrayData(res);
        return issues.map((i: any, index: number) => ({
          id: i.id || index,
          'Issue ID':       i.public_id ?? '',
          'Title':          i.bug_name ?? 'N/A',
          'Description':    i.description ?? '',
          'Project':        i.project?.project_name ?? 'N/A',
          'Status':         i.status_master?.label ?? i.status?.label ?? 'N/A',
          'Priority':       i.priority_master?.label ?? i.priority?.label ?? 'N/A',
          'Severity':       i.severity_master?.label ?? i.severity?.label ?? 'N/A',
          'Classification': i.classification_master?.label ?? i.classification?.label ?? 'N/A',
          'Reporter':       i.reporter ? [i.reporter.first_name, i.reporter.last_name].filter(Boolean).join(' ') : 'N/A',
          'Assignee':       i.assignee ? [i.assignee.first_name, i.assignee.last_name].filter(Boolean).join(' ') : 'Unassigned',
          'Start Date':     i.start_date ?? 'N/A',
          'Due Date':       i.due_date ?? 'N/A',
          'Estimated Hours':i.estimated_hours ?? '',
          'Module':         i.module ?? '',
          'Tags':           i.tags ?? '',
          'Created At':     i.created_at ? String(i.created_at).split('T')[0] : '',
        }));
      } catch (err) {
        console.error('Failed to fetch issues for report:', err);
        return [];
      }
    } else if (id === 4) {
      try {
        const res = await tasksService.getTasks({ skip: 0, limit: 1000 });
        const allTasks = getArrayData(res);
        const overdueTasks = allTasks.filter((t: any) => {
            if (!t.due_date) return false;
            const s = (t.status_master?.label ?? t.status_master?.name ?? t.status ?? '').toLowerCase();
            const isDone = s === 'completed' || s === 'closed' || s === 'done';
            const dueDate = new Date(t.due_date);
            dueDate.setHours(23, 59, 59, 999);
            return !isDone && dueDate < new Date();
        });
        return overdueTasks.map((t: any, index: number) => {
            const dueDate = new Date(t.due_date);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - dueDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return {
                id: t.id || index,
                'Task ID': t.public_id ?? '',
                'User': t.assignee ? [t.assignee.first_name, t.assignee.last_name].filter(Boolean).join(' ') : (t.owners && t.owners.length > 0 ? [t.owners[0].first_name, t.owners[0].last_name].filter(Boolean).join(' ') : 'Unassigned'),
                'Project': t.project?.project_name ?? 'N/A',
                'Task Name': t.task_name ?? 'N/A',
                'Due Date': t.due_date ? String(t.due_date).split('T')[0] : 'N/A',
                'Days Overdue': diffDays,
                'Status': t.status_master?.label ?? t.status?.label ?? 'N/A',
                'Priority': t.priority_master?.label ?? t.priority?.label ?? 'N/A',
            };
        });
      } catch (err) {
        console.error('Failed to fetch overdue tasks:', err);
        return [];
      }
    }
    return [];
  };

  const handleView = async (id: number) => {
    setLoading(true);
    try {
      const mapped = await getReportMappedData(id);
      setReportData(mapped);
      setActiveReport(id);
      setSearchQuery('');
    } catch (err) {
      console.error(err);
      showToast('error', 'View Failed', 'Failed to load the report data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id: number) => {
    try {
      const mapped = await getReportMappedData(id);
      if (id === 1) {
        exportToCSV(mapped as Record<string, any>[], 'project_status_report.csv');
        showToast('success', 'Exported', 'Project Status Report downloaded successfully.');
      }
      else if (id === 2) {
        exportToCSV(mapped as Record<string, any>[], 'time_tracking_report.csv');
        showToast('success', 'Exported', 'Time Tracking Report downloaded successfully.');
      }
      else if (id === 3) {
        exportToCSV(mapped as Record<string, any>[], 'defect_analysis_report.csv');
        showToast('success', 'Exported', 'Defect Analysis Report downloaded successfully.');
      }
      else if (id === 4) {
        exportToCSV(mapped as Record<string, any>[], 'overdue_tasks_report.csv');
        showToast('success', 'Exported', 'Overdue Tasks Report downloaded successfully.');
      }
    } catch (error) {
      console.error('Failed to export report:', error);
      showToast('error', 'Export Failed', 'An error occurred while exporting the report.');
    }
  };

  const handleExportAll = async () => {
    setLoading(true);
    await handleDownload(1);
    await handleDownload(2);
    await handleDownload(3);
    await handleDownload(4);
    setLoading(false);
    showToast('success', 'All Reports Exported', 'All reports have been downloaded successfully.');
  };

  const liveStats: StatCardProps[] = useMemo(() => {
    if (!summary) return [];
    return [
      { label: "Total Projects", value: summary.total_projects, icon: <Layers size={18} strokeWidth={2} />, accentVariant: 'teal' },
      { label: "Total Tasks", value: summary.total_tasks, icon: <CheckCircle size={18} strokeWidth={2} />, accentVariant: 'teal' },
      { label: "Total Defects", value: summary.total_issues, icon: <AlertCircle size={18} strokeWidth={2} />, accentVariant: 'amber' },
      { label: "Hours Logged", value: `${summary.total_hours_logged.toFixed(1)}h`, icon: <Clock size={18} strokeWidth={2} />, accentVariant: 'rose' },
    ] as StatCardProps[];
  }, [summary]);

  return (
    <PageLayout
      title={activeReport ? reportTypes.find(r => r.id === activeReport)?.title : "System Reports"}
      subtitle={activeReport ? `${reportData.length} Records` : undefined}
      isFullHeight
      showBackButton={!!activeReport}
      onBack={() => {
          setActiveReport(null);
          setSearchQuery('');
      }}
      actions={
        !activeReport ? (
          <Button
            variant="primary"
            onClick={handleExportAll}
            className="!h-9 !px-4 !rounded-lg"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Export All</span>
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={() => handleDownload(activeReport)}
            className="!h-9 !px-4 !rounded-lg"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Download Data</span>
          </Button>
        )
      }
    >
      <div className="h-full flex flex-col space-y-6 overflow-hidden relative">

        { }
        <AnimatePresence mode="wait">
          {!activeReport ? (
            <motion.div
              key="catalog"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col space-y-6 overflow-y-auto pr-2 pb-6 custom-scrollbar"
            >
              { }
              {loading && !summary ? (
                <div className="py-12"><SectionLoadingIndicator label="Syncing Telemetry..." /></div>
              ) : summary ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 flex-shrink-0">
                  {liveStats.map((stat, i) => (
                    <StatCard key={i} {...stat} className="h-full" />
                  ))}
                </div>
              ) : (
                <Card className="p-6 text-center text-red-500 font-bold border-red-200">System Telemetry Currently Offline</Card>
              )}

              { }
              <div className="flex items-center justify-between pb-2">
                <h2 className="text-[16px] font-bold tracking-tight text-slate-800 dark:text-white">Report Catalog</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 flex-1 min-h-0">
                {reportTypes.map((report) => (
                  <Card key={report.id} glass={true} className="flex flex-col overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-slate-200/60 dark:border-slate-800 p-0" pt={{ content: { className: 'p-0 w-full h-full flex flex-col' } }}>
                    { }
                    <div className="h-2 w-full" style={{ background: report.gradient }}></div>

                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700"
                          style={{ color: report.gradient.split(', ')[1].split(' ')[0] }}
                        >
                          {report.icon}
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-full">{report.frequency}</span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{report.title}</h3>
                      <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-6 flex-1 leading-relaxed">{report.description}</p>

                      <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/60">
                        <Button
                          variant="secondary"
                          onClick={() => handleView(report.id)}
                          className="flex-1 !h-9 !px-4 !rounded-lg text-[13px]"
                        >
                          View Data
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => handleDownload(report.id)}
                          className="flex-1 !h-9 !px-4 !rounded-lg"
                        >
                          <Download size={14} /> <span className="hidden sm:inline">Download</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="dataview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col overflow-hidden"
            >
              <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-[var(--shadow-premium)] overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
                    <h3 className="text-[15px] font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        {reportTypes.find(r => r.id === activeReport)?.icon}
                        {reportTypes.find(r => r.id === activeReport)?.title} Data
                    </h3>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search report..."
                            className="pl-9 pr-4 py-2 text-[13px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-brand-teal-500 focus:ring-1 focus:ring-brand-teal-500 transition-all w-[200px] sm:w-[300px]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 min-h-0 relative">
                {loading ? (
                  <div className="h-full w-full flex items-center justify-center"><SectionLoadingIndicator label="Aggregating Report Data..." /></div>
                ) : reportData.length > 0 ? (
                  <PrimeDataTable
                    value={(() => {
                        if (!searchQuery.trim()) return reportData;
                        const lowerQuery = searchQuery.toLowerCase();
                        return reportData.filter(row => Object.values(row).some(val => String(val).toLowerCase().includes(lowerQuery)));
                    })()}
                    paginator
                    rows={15}
                    rowsPerPageOptions={[15, 30, 50, 100]}
                    dataKey="id"
                    showGridlines
                    stripedRows
                    resizableColumns
                    columnResizeMode="fit"
                    scrollable
                    scrollHeight="flex"
                    size="small"
                    emptyMessage="No reports found."
                    pt={{
                        header: { className: 'pms-dt-header' },
                        headerRow: { className: 'pms-dt-header-row' },
                        bodyRow: { className: 'pms-dt-row' },
                        column: { bodyCell: { className: 'pms-dt-cell !whitespace-nowrap' }, headerCell: { className: 'pms-dt-head-cell !whitespace-nowrap' } },
                    }}
                    style={{ fontSize: 13 }}
                  >
                    {(() => {
                      const renderStatus = (val: any) => {
                          if (!val || val === 'N/A') return <span className="text-slate-400">N/A</span>;
                          return <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-black tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{val}</span>;
                      };
                      const renderPriority = (val: any) => {
                          if (!val || val === 'N/A') return <span className="text-slate-400">N/A</span>;
                          return <span className="px-2 py-0.5 rounded text-[11px] font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">{val}</span>;
                      };
                      const renderTags = (val: any) => {
                          if (!val) return <span className="text-slate-400">—</span>;
                          const tags = String(val).split(',');
                          return (
                              <div className="flex flex-wrap gap-1">
                                  {tags.slice(0, 2).map((t, i) => (
                                      <span key={i} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">{t.trim()}</span>
                                  ))}
                                  {tags.length > 2 && <span className="text-[10px] text-slate-400">+{tags.length - 2}</span>}
                              </div>
                          );
                      };

                      let cols: any[] = [];
                      if (activeReport === 1) cols = [
                        { field: 'Project ID', header: 'ID', sortable: true, body: (r: any) => <span className="font-mono text-[11px] text-teal-600 font-bold">{r['Project ID']}</span> },
                        { field: 'Project Name', header: 'Project Name', sortable: true, body: (r: any) => <span className="font-bold text-slate-800 dark:text-white">{r['Project Name']}</span> },
                        { field: 'Customer Name', header: 'Customer', sortable: true },
                        { field: 'Client Name', header: 'Client', sortable: true },
                        { field: 'Billing Model', header: 'Billing Model', sortable: true },
                        { field: 'Project Type', header: 'Type', sortable: true },
                        { field: 'Status', header: 'Status', sortable: true, body: (r: any) => renderStatus(r['Status']) },
                        { field: 'Priority', header: 'Priority', sortable: true, body: (r: any) => renderPriority(r['Priority']) },
                        { field: 'Owner', header: 'Owner', sortable: true },
                        { field: 'Project Manager', header: 'Manager', sortable: true },
                        { field: 'Expected Start', header: 'Start Date', sortable: true },
                        { field: 'Expected End', header: 'End Date', sortable: true },
                        { field: 'Estimated Hours', header: 'Est. Hours', sortable: true },
                        { field: 'Actual Hours', header: 'Actual Hours', sortable: true },
                        { field: 'Tags', header: 'Tags', sortable: true, body: (r: any) => renderTags(r['Tags']) },
                      ];
                      else if (activeReport === 2) cols = [
                        { field: 'Log ID', header: 'Log ID', sortable: true, body: (r: any) => <span className="font-mono text-[11px] text-blue-600 font-bold">{r['Log ID']}</span> },
                        { field: 'Log Title', header: 'Log Title', sortable: true, body: (r: any) => <span className="font-semibold text-slate-800 dark:text-white">{r['Log Title']}</span> },
                        { field: 'Date', header: 'Date', sortable: true },
                        { field: 'Project', header: 'Project', sortable: true },
                        { field: 'Task', header: 'Task', sortable: true },
                        { field: 'Issue', header: 'Issue', sortable: true },
                        { field: 'User', header: 'User', sortable: true },
                        { field: 'Hours', header: 'Hours', sortable: true, body: (r: any) => <span className="font-bold text-[13px] text-slate-800 dark:text-slate-200">{Number(r['Hours']).toFixed(1)}h</span> },
                        { field: 'Billing Type', header: 'Billing', sortable: true },
                        { field: 'Approval Status', header: 'Approval', sortable: true, body: (r: any) => renderStatus(r['Approval Status']) },
                        { field: 'Notes', header: 'Notes', sortable: true },
                      ];
                      else if (activeReport === 3) cols = [
                        { field: 'Issue ID', header: 'ID', sortable: true, body: (r: any) => <span className="font-mono text-[11px] text-red-600 font-bold">{r['Issue ID']}</span> },
                        { field: 'Title', header: 'Title', sortable: true, body: (r: any) => <span className="font-bold text-slate-800 dark:text-white">{r['Title']}</span> },
                        { field: 'Project', header: 'Project', sortable: true },
                        { field: 'Status', header: 'Status', sortable: true, body: (r: any) => renderStatus(r['Status']) },
                        { field: 'Priority', header: 'Priority', sortable: true, body: (r: any) => renderPriority(r['Priority']) },
                        { field: 'Severity', header: 'Severity', sortable: true },
                        { field: 'Classification', header: 'Classification', sortable: true },
                        { field: 'Reporter', header: 'Reporter', sortable: true },
                        { field: 'Assignee', header: 'Assignee', sortable: true },
                        { field: 'Start Date', header: 'Start Date', sortable: true },
                        { field: 'Due Date', header: 'Due Date', sortable: true },
                        { field: 'Estimated Hours', header: 'Est. Hours', sortable: true },
                        { field: 'Module', header: 'Module', sortable: true },
                        { field: 'Tags', header: 'Tags', sortable: true, body: (r: any) => renderTags(r['Tags']) },
                        { field: 'Created At', header: 'Created At', sortable: true },
                      ];
                      else if (activeReport === 4) cols = [
                        { field: 'User', header: 'User', sortable: true, body: (r: any) => <span className="font-bold text-slate-800 dark:text-white">{r['User']}</span> },
                        { field: 'Task Name', header: 'Task Name', sortable: true },
                        { field: 'Project', header: 'Project', sortable: true },
                        { field: 'Due Date', header: 'Due Date', sortable: true, body: (r: any) => <span className="text-red-500 font-semibold">{r['Due Date']}</span> },
                        { field: 'Days Overdue', header: 'Days Overdue', sortable: true, body: (r: any) => <span className="px-2 py-0.5 rounded text-[11px] font-black bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">{r['Days Overdue']} Days</span> },
                        { field: 'Status', header: 'Status', sortable: true, body: (r: any) => renderStatus(r['Status']) },
                        { field: 'Priority', header: 'Priority', sortable: true, body: (r: any) => renderPriority(r['Priority']) },
                      ];

                      return cols.map(col => (
                          <Column
                              key={col.field}
                              field={col.field}
                              header={col.header}
                              sortable={col.sortable}
                              body={col.body}
                              style={{ minWidth: '150px' }}
                          />
                      ));
                    })()}
                  </PrimeDataTable>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                    <FileText className="w-12 h-12 mb-3 opacity-20" />
                    <span className="font-bold">No telemetry captured for this report.</span>
                  </div>
                )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </PageLayout>
  );
}
