import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { EntityPageTemplate } from '@/components/layout/EntityPageTemplate';
import { Button } from '@/components/forms/Button';
import {
    Plus, Download, Clock as ClockIcon, TrendingUp, DollarSign,
    BarChart3, Grid, Calendar as CalendarIcon,
    Users, User, ChevronLeft, ChevronRight, CalendarDays
} from 'lucide-react';
import { TimeLogTable } from '../ui/TimeLogTable';
import { timelogsService } from '../../api/timelogs.api';
import { useTimelogActions } from '../../hooks/useTimelogActions';
import { TableSkeleton } from '@/components/feedback/Skeleton/TableSkeleton';
import { useToast } from '@/providers/ToastContext';
import { useAuth } from '@/auth/AuthProvider';
import { isTeamLeadOrAbove, can } from '@/utils/permissions';
import { exportToCSV } from '@/utils/export';
import {
    startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
    isWithinInterval, format, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths
} from 'date-fns';
import SharedCalendar from '@/components/core/SharedCalendar';

const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');
function fmtHHMM(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${pad(h)}:${pad(m)}`;
}

export function TimeLogListView() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();


    const [dateRangeMode, setDateRangeMode] = useState<'day' | 'week' | 'month' | 'range'>('month');
    const [currentReferenceDate, setCurrentReferenceDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'all' | 'mine'>('mine');
    const [customRange, setCustomRange] = useState<Date[] | null>(null);

    const canViewAllLogs = can.viewReports(user?.role);


    const { data: timeEntries = [], isLoading, refetch } = useQuery({
        queryKey: ['timelogs'],
        queryFn: () => timelogsService.getTimelogs(0, 5000),
    });

    const { deleteTimelog } = useTimelogActions();


    const selectedRange = useMemo(() => {
        const ref = currentReferenceDate;
        if (dateRangeMode === 'day') return { start: startOfDay(ref), end: endOfDay(ref) };
        if (dateRangeMode === 'week') return { start: startOfWeek(ref, { weekStartsOn: 1 }), end: endOfWeek(ref, { weekStartsOn: 1 }) };
        if (dateRangeMode === 'month') return { start: startOfMonth(ref), end: endOfMonth(ref) };
        if (dateRangeMode === 'range' && customRange?.[0] && customRange?.[1]) {
            return { start: startOfDay(customRange[0]), end: endOfDay(customRange[1]) };
        }
        return { start: startOfMonth(ref), end: endOfMonth(ref) };
    }, [dateRangeMode, currentReferenceDate, customRange]);

    const handleNavigatePeriod = (direction: 'prev' | 'next') => {
        const step = direction === 'next' ? 1 : -1;
        setCurrentReferenceDate(prev => {
            if (dateRangeMode === 'day') return step > 0 ? addDays(prev, 1) : subDays(prev, 1);
            if (dateRangeMode === 'week') return step > 0 ? addWeeks(prev, 1) : subWeeks(prev, 1);
            if (dateRangeMode === 'month') return step > 0 ? addMonths(prev, 1) : subMonths(prev, 1);
            return prev;
        });
    };

    const filteredEntries = useMemo(() => {
        let logs = timeEntries.filter((e) => {
            if (!e.date) return false;
            const entryDate = new Date(e.date);
            return isWithinInterval(entryDate, { start: selectedRange.start, end: selectedRange.end });
        });

        if (canViewAllLogs && viewMode === 'mine') {
            logs = logs.filter(l => l.user_id === user?.id);
        } else if (!canViewAllLogs) {
            logs = logs.filter(l => l.user_id === user?.id);
        }

        return logs;
    }, [timeEntries, selectedRange, viewMode, user?.id, canViewAllLogs]);

    const stats = useMemo(() => {
        const total = filteredEntries.reduce((s, e) => s + Number(e.daily_log_hours ?? 0), 0);
        const billable = filteredEntries.filter((e) => e.billing_type === 'Billable').reduce((s, e) => s + Number(e.daily_log_hours ?? 0), 0);
        const nonBill = total - billable;
        return { total, billable, nonBill, count: filteredEntries.length };
    }, [filteredEntries]);

    const statsProps = useMemo(() => [
        { label: 'Total Tracked', value: fmtHHMM(stats.total), icon: <ClockIcon size={18} />, accentVariant: 'teal' as const, change: `${stats.count} entries` },
        { label: 'Billable', value: fmtHHMM(stats.billable), icon: <DollarSign size={18} />, accentVariant: 'violet' as const },
        { label: 'Non-Billable', value: fmtHHMM(stats.nonBill), icon: <TrendingUp size={18} />, accentVariant: 'amber' as const },
        { label: 'Active Logs', value: String(stats.count), icon: <BarChart3 size={18} />, accentVariant: 'rose' as const },
    ], [stats]);

    const handleExport = () => {
        const exportData = filteredEntries.map((e: any) => ({
            'Log ID':          e.public_id ?? e.id ?? '',
            'Log Title':       e.log_title ?? '',
            'Date':            e.date ?? '',
            'Project':         e.project?.project_name ?? e.task?.project?.project_name ?? '',
            'Task':            e.task?.task_name ?? '',
            'Issue':           e.issue?.bug_name ?? '',
            'User':            e.user ? [e.user.first_name, e.user.last_name].filter(Boolean).join(' ') : '',
            'User Email':      e.user?.email ?? '',
            'Created By':      e.created_by ? [e.created_by.first_name, e.created_by.last_name].filter(Boolean).join(' ') : '',
            'Hours':           Number(e.daily_log_hours ?? 0).toFixed(2),
            'Time Period':     e.time_period ?? '',
            'Billing Type':    e.billing_type ?? '',
            'Approval Status': e.approval_status_master?.label ?? e.approval_status?.label ?? '',
            'Notes':           e.notes ?? '',
            'General Log':     e.general_log ? 'Yes' : 'No',
        }));
        exportToCSV(exportData, `timelogs_${dateRangeMode}.csv`);
    };

    return (
        <EntityPageTemplate
            title="Time Logs"
            stats={statsProps}
            loading={isLoading}
            headerActions={
                <div className="flex items-center gap-3">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleExport}
                        className="!w-9 !h-9 !p-0 !rounded-lg"
                        tooltip="Export CSV"
                    >
                        <Download size={15} strokeWidth={2.5} />
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => navigate('/time-log/add')}
                        className="!h-10 !px-5"
                    >
                        <Plus size={15} /> Add Time Log
                    </Button>
                </div>
            }
            utilityBarExtra={
                <>
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner flex-shrink-0">
                        {['day', 'week', 'month', 'range'].map((m) => (
                            <Button
                                key={m}
                                unstyled
                                onClick={() => setDateRangeMode(m as any)}
                                className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${dateRangeMode === m ? 'bg-white dark:bg-slate-700 shadow-md text-brand-teal-500 scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                {m}
                            </Button>
                        ))}
                    </div>

                    <div className="flex items-center">
                        <div className="flex h-9 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm relative">
                            <Button
                                unstyled
                                onClick={() => handleNavigatePeriod('prev')}
                                disabled={dateRangeMode === 'range'}
                                className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 hover:text-brand-teal-500 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                            >
                                <ChevronLeft size={16} strokeWidth={3} />
                            </Button>

                            <div className="relative flex items-center">
                                <div className={`px-5 h-full flex items-center gap-2 text-[12px] font-bold text-slate-700 dark:text-slate-200 border-x border-slate-100 dark:border-slate-700 tabular-nums transition-colors ${dateRangeMode === 'range' ? 'hover:text-brand-teal-500 cursor-pointer pr-10' : ''}`}>
                                    <CalendarDays size={14} className="text-brand-teal-500" />
                                    {dateRangeMode === 'range' && (!customRange || !customRange[0]) ? (
                                        <span className="text-slate-400 font-medium tracking-tight">Select Custom Range</span>
                                    ) : (
                                        <>
                                            {format(selectedRange.start, 'MMM dd, yyyy')}
                                            {dateRangeMode !== 'day' && (
                                                <>
                                                    <ChevronRight size={10} className="text-slate-300" />
                                                    {format(selectedRange.end, 'MMM dd, yyyy')}
                                                </>
                                            )}
                                        </>
                                    )}
                                    {dateRangeMode === 'range' && <ChevronRight size={12} className="text-slate-300 absolute right-4 rotate-90" />}
                                </div>

                                {dateRangeMode === 'range' && (
                                    <div className="absolute inset-0 opacity-0 overflow-hidden cursor-pointer">
                                        <SharedCalendar
                                            selectionMode="range"
                                            value={customRange as any}
                                            onChange={(v: any) => setCustomRange(v)}
                                            className="!w-full !h-full"
                                        />
                                    </div>
                                )}
                            </div>

                            <Button
                                unstyled
                                onClick={() => handleNavigatePeriod('next')}
                                disabled={dateRangeMode === 'range'}
                                className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 hover:text-brand-teal-500 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                            >
                                <ChevronRight size={16} strokeWidth={3} />
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1" />

                    <div className="flex items-center gap-4 flex-shrink-0">
                        {canViewAllLogs && (
                            <div className="relative flex items-center bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800 w-[200px]">
                                <div
                                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200/50 dark:border-white/5 transition-all duration-300 ease-out z-0 ${viewMode === 'mine' ? 'left-1' : 'left-[calc(50%+1px)]'}`}
                                />

                                <Button
                                    unstyled
                                    onClick={() => setViewMode('mine')}
                                    className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-1.5 text-[11px] font-black transition-colors duration-300 ${viewMode === 'mine' ? 'text-brand-teal-500' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <User size={13} strokeWidth={2.5} /> My Logs
                                </Button>
                                <Button
                                    unstyled
                                    onClick={() => setViewMode('all')}
                                    className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-1.5 text-[11px] font-black transition-colors duration-300 ${viewMode === 'all' ? 'text-brand-teal-500' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Users size={13} strokeWidth={2.5} /> Team Logs
                                </Button>
                            </div>
                        )}

                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate('/time-log/weekly-add')}
                            className="!h-9 !px-4 border-brand-teal-100 dark:border-brand-teal-800/30 font-black text-[10px] uppercase tracking-widest"
                        >
                            <Grid size={14} strokeWidth={2.5} /> Weekly Time Log
                        </Button>
                    </div>
                </>
            }
        >
            <div className="flex-1 flex flex-col min-h-0 h-full bg-theme-surface rounded-3xl border border-slate-200 dark:border-slate-800 shadow-premium overflow-hidden relative">
                {isLoading ? (
                    <div className="p-4 h-full"><TableSkeleton rows={6} columns={8} /></div>
                ) : (
                    <TimeLogTable
                        timelogs={filteredEntries}
                        onDelete={async (id) => {
                            try {
                                await deleteTimelog.mutateAsync(id);
                                refetch();
                            } catch { }
                        }}
                        onEdit={(log) => navigate(`/time-log/edit/${log.id}`)}
                    />
                )}
            </div>
        </EntityPageTemplate>
    );
}
