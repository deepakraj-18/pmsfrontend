import React from 'react';
import { useToast } from '@/providers/ToastContext';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { Card } from '@/components/layout/Card';
import { Button } from '@/components/forms/Button';
import { Badge } from '@/components/data-display/Badge';
import { SectionLoadingIndicator } from '@/components/feedback/Loader/SectionLoadingIndicator';
import { ArrowLeft, Edit, Mail, Phone, Trash2, User as UserIcon, Briefcase, Star, CheckCircle, Clock, FolderKanban } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usersService, User as ApiUser } from '@/features/users/api/users.api';
import { tasksService } from '@/features/tasks/api/tasks.api';
import { timelogsService } from '@/features/timelogs/api/timelogs.api';
import { projectsService } from '@/features/projects/api/projects.api';
import { format } from 'date-fns';

interface UserActivity {
  tasksCompleted: number;
  hoursLogged: number;
  activeProjects: number;
}

export function UserDetail() {
  const { showToast } = useToast();
  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<UserActivity>({ tasksCompleted: 0, hoursLogged: 0, activeProjects: 0 });
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (userId) {
          const data = await usersService.getUser(Number(userId));
          setUser(data);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  useEffect(() => {
    if (!user?.email) return;

    const fetchActivity = async () => {
      setActivityLoading(true);
      try {
        const [tasksRes, timelogsRes, projectsRes] = await Promise.allSettled([
          tasksService.getTasks({ skip: 0, limit: 1000, assignee_email: user.email }),
          timelogsService.getTimelogs(0, 1000, undefined, undefined, undefined, [user.id]),
          projectsService.getProjects({ skip: 0, limit: 1000, member_email: user.email }),
        ]);

        let tasksCompleted = 0;
        if (tasksRes.status === 'fulfilled') {
          const items = (tasksRes.value as any)?.items ?? [];
          tasksCompleted = items.filter((t: any) => {
            const s = (t.status_master?.name || t.status?.name || t.status || '').toLowerCase();
            return ['completed', 'closed', 'done'].includes(s);
          }).length;
        }

        let hoursLogged = 0;
        if (timelogsRes.status === 'fulfilled') {
          const logs = Array.isArray(timelogsRes.value) ? timelogsRes.value : (timelogsRes.value as any)?.items || [];
          hoursLogged = logs.reduce((acc: number, l: any) => acc + (Number(l.daily_log_hours || l.hours) || 0), 0);
        }

        let activeProjects = 0;
        if (projectsRes.status === 'fulfilled') {
          const projects = (projectsRes.value as any)?.items || [];
          activeProjects = projects.filter((p: any) => {
            const s = (p.status_master?.name || p.status?.name || p.status || '').toLowerCase();
            return !['completed', 'closed', 'cancelled'].includes(s);
          }).length;
        }

        setActivity({ tasksCompleted, hoursLogged, activeProjects });
      } catch (error) {
        console.error('Failed to fetch user activity:', error);
      } finally {
        setActivityLoading(false);
      }
    };

    fetchActivity();
  }, [user, userId]);

  const handleDelete = async () => {
    try {
      await usersService.deleteUser(Number(userId));
      navigate('/users');
    } catch (error) {
      console.error('Failed to delete user:', error);
      showToast('error', 'Notification', 'Failed to delete user');
    }
  };

  if (loading) return <SectionLoadingIndicator fullPage label="Loading user" />;
  if (!user) return <SectionLoadingIndicator fullPage label="User not found" />;

  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || '?';

  const activityStats = [
    {
      label: 'Tasks Done',
      value: activityLoading ? '—' : String(activity.tasksCompleted),
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: 'Hours Logged',
      value: activityLoading ? '—' : `${activity.hoursLogged.toFixed(1)}h`,
      icon: <Clock className="w-4 h-4" />,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Active Projects',
      value: activityLoading ? '—' : String(activity.activeProjects),
      icon: <FolderKanban className="w-4 h-4" />,
      color: 'text-brand-teal-600 dark:text-brand-teal-400',
      bg: 'bg-brand-teal-50 dark:bg-brand-teal-900/20',
    },
  ];

  return (
    <PageLayout
      title={fullName}
      subtitle={user.email}
      showBackButton
      backPath="/users"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate(`/users/${userId}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit User
          </Button>
        </div>
      }
    >
      { }
      <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/40">
        <div className="w-14 h-14 rounded-2xl bg-brand-teal-100 dark:bg-brand-teal-900/30 flex items-center justify-center text-brand-teal-700 dark:text-brand-teal-300 text-xl font-black flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[17px] font-black text-slate-800 dark:text-slate-100 leading-tight">{fullName}</h2>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{user.email}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge value={user.status?.name || 'Active'} variant="status" />
          {user.role?.name && <Badge value={user.role.name} variant="status" />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        { }
        <div className="col-span-2 flex flex-col gap-5">
          { }
          <div>
            <h3 className="text-[11px] font-black tracking-widest uppercase text-theme-muted mb-2.5 flex items-center gap-2">
              <div className="w-1 h-3 rounded-full bg-brand-teal-400" />
              Information
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100/50 dark:border-slate-800/50">
              {[
                { label: 'Email', value: user.email },
                { label: 'Role', value: user.role?.name || '-' },
                { label: 'Status', value: user.status?.name || 'Active', isBadge: true },
                { label: 'Join Date', value: user.join_date ? format(new Date(user.join_date), 'MMM d, yyyy') : '-' },
                { label: 'Manager', value: user.manager ? [user.manager.first_name, user.manager.last_name].filter(Boolean).join(' ') : '-' },
              ].map(({ label, value, isBadge }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-theme-muted">{label}</p>
                  {isBadge
                    ? <div><Badge value={value} variant="status" /></div>
                    : <p className="text-[12px] font-semibold text-theme-primary truncate">{value}</p>
                  }
                </div>
              ))}
            </div>
          </div>

          { }
          <div>
            <h3 className="text-[11px] font-black tracking-widest uppercase text-theme-muted mb-2.5 flex items-center gap-2">
              <div className="w-1 h-3 rounded-full bg-brand-teal-400" />
              Skills
            </h3>
            <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100/50 dark:border-slate-800/50">
              {user.skills && user.skills.length > 0 ? (
                user.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="px-2 py-0.5 bg-brand-teal-50 text-brand-teal-700 dark:bg-brand-teal-900/20 dark:text-brand-teal-300 text-[10px] font-bold rounded-md border border-brand-teal-200 dark:border-brand-teal-700/30"
                  >
                    {skill.name}
                  </span>
                ))
              ) : (
                <p className="text-[11px] text-theme-muted font-medium w-full text-center">No skills assigned.</p>
              )}
            </div>
          </div>
        </div>

        { }
        <div className="space-y-4">
          { }
          <div>
            <h3 className="text-[11px] font-black tracking-widest uppercase text-theme-muted mb-2.5 flex items-center gap-2">
              <div className="w-1 h-3 rounded-full bg-brand-teal-400" />
              Contact
            </h3>
            <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100/50 dark:border-slate-800/50 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 bg-brand-teal-50 dark:bg-brand-teal-900/20 rounded-md flex items-center justify-center flex-shrink-0">
                  <Mail className="w-3 h-3 text-brand-teal-600 dark:text-brand-teal-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] text-theme-muted font-bold uppercase tracking-wider">Email</p>
                  <p className="text-[11px] font-semibold text-theme-primary truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 bg-brand-teal-50 dark:bg-brand-teal-900/20 rounded-md flex items-center justify-center flex-shrink-0">
                  <Phone className="w-3 h-3 text-brand-teal-600 dark:text-brand-teal-400" />
                </div>
                <div>
                  <p className="text-[9px] text-theme-muted font-bold uppercase tracking-wider">Phone</p>
                  <p className="text-[11px] font-semibold text-theme-primary">{user.phone || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          { }
          <div>
            <h3 className="text-[11px] font-black tracking-widest uppercase text-theme-muted mb-2.5 flex items-center gap-2">
              <div className="w-1 h-3 rounded-full bg-indigo-400" />
              Activity
            </h3>
            <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100/50 dark:border-slate-800/50 space-y-2">
              {activityStats.map(({ label, value, icon, color, bg }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${bg} ${color}`}>
                      {React.cloneElement(icon as React.ReactElement, { className: 'w-3 h-3' } as any)}
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-theme-muted">{label}</p>
                  </div>
                  <p className={`text-[12px] font-black leading-none ${activityLoading ? 'text-slate-300 dark:text-slate-600' : 'text-slate-800 dark:text-slate-100'}`}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
