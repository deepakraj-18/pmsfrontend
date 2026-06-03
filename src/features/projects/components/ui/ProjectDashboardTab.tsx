import React, { useMemo } from 'react';
import { ProgressBar } from 'primereact/progressbar';
import { Avatar } from 'primereact/avatar';
import {
    CheckCircle, AlertCircle, Clock, Target,
    Layers, Hash, FolderKanban
} from 'lucide-react';
import { Project } from '@/features/projects/api/projects.api';
import { statusStr, statusName } from '@/utils/statusHelpers';
import { calculateDaysLeft, formatDaysLeftText, calculateDaysToDate } from '@/utils/dateHelpers';

interface DashboardProps {
    project: Project;
    tasks: any[];
    issues: any[];
    timelogs: any[];
    milestones: any[];
}

export function ProjectDashboardTab({ project, tasks, issues, timelogs, milestones }: DashboardProps) {


    const stats = useMemo(() => {
        const completedTasks = tasks.filter(t => {
            const s = statusStr((t as any).status_master ?? t.status);
            return s === 'completed' || s === 'closed' || s === 'done';
        }).length;
        const planningTasks = tasks.filter(t => {
            const s = statusStr((t as any).status_master ?? t.status).toLowerCase();
            return s === 'planning' || s.includes('planning');
        }).length;
        const totalTasks = tasks.length;

        const closedIssues = issues.filter(i => statusStr((i as any).status_master ?? i.status) === 'closed').length;
        const totalIssues = issues.length;


        const teamMap = new Map<number, any>();


        project.team_members?.forEach((m: any) => {
            if (m.user) {
                teamMap.set(m.user_id, {
                    user: m.user,
                    hours: 0,
                    tasksTotal: 0, tasksDone: 0,
                    issuesTotal: 0, issuesDone: 0
                });
            }
        });


        let totalLogged = 0;
        timelogs.forEach(l => {
            const h = Number(l.daily_log_hours || 0);
            totalLogged += h;
            if (l.user_id) {
                if (!teamMap.has(l.user_id)) {
                    teamMap.set(l.user_id, { user: l.user, hours: 0, tasksTotal: 0, tasksDone: 0, issuesTotal: 0, issuesDone: 0 });
                }
                teamMap.get(l.user_id).hours += h;
            }
        });


        // 2. Count Tasks per user
        tasks.forEach(t => {
            const allOwners = t.owners || (t.single_owner ? [t.single_owner] : (t.assignee ? [t.assignee] : []));
            const ownerIds = new Set<number>();

            allOwners.forEach((u: any) => {
                const uid = u?.id || u?.user_id;
                if (uid) ownerIds.add(uid);
            });
            if (t.owner_id) ownerIds.add(t.owner_id);
            if (t.assignee_id) ownerIds.add(t.assignee_id);

            ownerIds.forEach(uid => {
                if (!teamMap.has(uid)) {

                    const userObj = allOwners.find((uo: any) => (uo.id || uo.user_id) === uid);
                    teamMap.set(uid, { user: userObj, hours: 0, tasksTotal: 0, tasksDone: 0, issuesTotal: 0, issuesDone: 0 });
                }
                const entry = teamMap.get(uid);
                entry.tasksTotal++;
                const s = statusStr((t as any).status_master ?? t.status);
                if (s === 'completed' || s === 'closed' || s === 'done') entry.tasksDone++;
            });
        });

        // 3. Count Issues per user
        issues.forEach(i => {
            const allAssignees = i.assignees || (i.assignee ? [i.assignee] : []);
            const assigneeIds = new Set<number>();

            allAssignees.forEach((u: any) => {
                const uid = u?.id || u?.user_id;
                if (uid) assigneeIds.add(uid);
            });
            if (i.assignee_id) assigneeIds.add(i.assignee_id);

            assigneeIds.forEach(uid => {
                if (!teamMap.has(uid)) {
                    const userObj = allAssignees.find((uo: any) => (uo.id || uo.user_id) === uid);
                    teamMap.set(uid, { user: userObj, hours: 0, tasksTotal: 0, tasksDone: 0, issuesTotal: 0, issuesDone: 0 });
                }
                const entry = teamMap.get(uid);
                entry.issuesTotal++;
                const s = statusStr((i as any).status_master ?? i.status);
                if (s === 'closed' || s === 'resolved' || s === 'done') entry.issuesDone++;
            });
        });

        const currentMemberIds = new Set(project.team_members?.map((m: any) => m.user_id) || []);

        const teamStats = Array.from(teamMap.values())
            .filter(member => {
                const hasActivity = (member.hours || 0) > 0 || (member.tasksTotal || 0) > 0 || (member.issuesTotal || 0) > 0;
                const uid = member.user?.id || member.user?.user_id;
                const isCurrentMember = uid ? currentMemberIds.has(uid) : false;
                return isCurrentMember || hasActivity;
            })
            .sort((a, b) => (b.hours || 0) - (a.hours || 0));
        const daysLeft = calculateDaysLeft(project.expected_end_date);
        const daysToStart = calculateDaysToDate(project.expected_start_date);

        return {
            tasks: { total: totalTasks, done: completedTasks, planning: planningTasks, pct: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0 },
            issues: { total: totalIssues, closed: closedIssues, pct: totalIssues > 0 ? (closedIssues / totalIssues) * 100 : 0 },
            actualHours: totalLogged,
            estHours: project.estimated_hours ?? 0,
            team: teamStats,
            daysLeft,
            daysToStart
        };
    }, [project, tasks, issues, timelogs]);

    return (
        <div className="space-y-6 pb-6">

            { }
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-teal-50 dark:bg-teal-900/20 text-teal-600 rounded-xl">
                            <Layers size={22} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Tasks Done</p>
                            <h3 className="text-2xl font-black">{stats.tasks.done} <span className="text-sm font-semibold text-slate-400">/ {stats.tasks.total}</span></h3>
                            <ProgressBar value={Math.round(stats.tasks.pct)} showValue={false} style={{ height: '4px', marginTop: '8px' }} color="#0d9488" />
                        </div>
                    </div>
                </div>


                <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl">
                            <AlertCircle size={22} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Bugs</p>
                            <h3 className="text-2xl font-black">{stats.issues.closed} <span className="text-sm font-semibold text-slate-400">/ {stats.issues.total}</span></h3>
                            <ProgressBar value={Math.round(stats.issues.pct)} showValue={false} style={{ height: '4px', marginTop: '8px' }} color="#dc2626" />
                        </div>
                    </div>
                </div>

                <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-violet-50 dark:bg-violet-900/20 text-violet-600 rounded-xl">
                            <Clock size={22} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Time Logged</p>
                            <h3 className="text-2xl font-black">{Number(stats.actualHours).toFixed(1)}h</h3>
                            <p className="text-[11px] text-slate-400 mt-1">of {stats.estHours}h estimated</p>
                        </div>
                    </div>
                </div>

                <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl">
                            <Target size={22} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Deadline</p>
                            <h3 className="text-2xl font-black text-[18px]">
                                {stats.daysToStart !== null && stats.daysToStart > 0
                                    ? `Starts in ${stats.daysToStart} ${stats.daysToStart === 1 ? 'day' : 'days'}`
                                    : formatDaysLeftText(stats.daysLeft)}
                            </h3>
                            <p className="text-[11px] text-slate-400 mt-1">{milestones.length} Active Milestones</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                { }
                <div className="p-0 border border-slate-100 dark:border-slate-800/60 rounded-xl overflow-hidden flex flex-col bg-white/50 dark:bg-slate-900/50">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20">
                        <h4 className="text-[13px] font-bold">Team Performance</h4>
                    </div>
                    <div className="flex-1 overflow-auto max-h-[400px]">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50/80 dark:bg-slate-800/80 sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="text-left px-4 py-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Member</th>
                                    <th className="text-right px-4 py-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Logged</th>
                                    <th className="text-right px-4 py-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tasks Done</th>
                                    <th className="text-right px-4 py-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Bugs Fixed</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {stats.team.map((member, i) => (
                                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Avatar
                                                    label={member.user?.first_name?.[0]?.toUpperCase() || '?'}
                                                    shape="circle"
                                                    style={{ width: 24, height: 24, fontSize: 10, fontWeight: 700, background: 'linear-gradient(135deg,#0CD1C3,#6366f1)', color: '#fff' }}
                                                />
                                                <span className="font-semibold text-[13px] truncate max-w-[120px]">{member.user?.first_name} {member.user?.last_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="font-mono text-[12px] font-bold text-violet-600 dark:text-violet-400">{member.hours.toFixed(1)}h</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-[12px]"><span className="font-bold text-teal-600 dark:text-teal-400">{member.tasksDone}</span> <span className="text-slate-400">/ {member.tasksTotal}</span></span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-[12px]"><span className="font-bold text-red-600 dark:text-red-400">{member.issuesDone}</span> <span className="text-slate-400">/ {member.issuesTotal}</span></span>
                                        </td>
                                    </tr>
                                ))}
                                {stats.team.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm">No team activity found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                { }
                <div className="p-0 border border-slate-100 dark:border-slate-800/60 rounded-xl overflow-hidden flex flex-col bg-white/50 dark:bg-slate-900/50">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20">
                        <h4 className="text-[13px] font-bold">Active Milestones</h4>
                    </div>
                    <div className="flex-1 overflow-auto max-h-[400px] p-4 space-y-4">
                        {milestones.length === 0 ? (
                            <div className="text-center text-slate-400 text-sm py-8">No milestones logged</div>
                        ) : (
                            milestones.map((ms: any) => (
                                <div key={ms.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                                    <div className="flex justify-between items-start mb-2">
                                        <h5 className="font-bold text-[13px]">{ms.milestone_name}</h5>
                                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                                            {statusName(ms.status_master || ms.status)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-[11px] text-slate-400 mb-1.5 mt-3">
                                        <span>Completion</span>
                                        <span className="font-bold text-teal-600 dark:text-teal-400">{ms.completion_percentage ?? 0}%</span>
                                    </div>
                                    <ProgressBar value={ms.completion_percentage ?? 0} showValue={false} style={{ height: '6px' }} color="#0d9488" />
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
