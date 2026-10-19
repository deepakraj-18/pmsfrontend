import React, { useCallback, useEffect, useState } from 'react';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { Button } from '@/components/forms/Button';
import { SectionLoadingIndicator } from '@/components/feedback/Loader/SectionLoadingIndicator';
import { usersService, User as ApiUser } from '@/features/users/api/users.api';
import { mastersApi } from '@/api/services/masters.service';
import { useToast } from '@/providers/ToastContext';
import { USER_STATUS } from '@/constants/constants';
import { Check, X } from 'lucide-react';

// Everything reads statuses by name; ids differ per database.
export function PendingUsers() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [statusIds, setStatusIds] = useState<{ active?: number; inactive?: number }>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const [all, statuses] = await Promise.all([
        usersService.getUsers(0, 500),
        mastersApi.getUserStatuses(),
      ]);
      setStatusIds({
        active: statuses.find((s) => s.name === USER_STATUS.ACTIVE)?.id,
        inactive: statuses.find((s) => s.name === USER_STATUS.INACTIVE)?.id,
      });
      setUsers(all.filter((u) => u.is_external && u.status?.name === USER_STATUS.PENDING));
    } catch (err: any) {
      showToast('error', 'Could not load requests', err?.response?.data?.message || err?.message);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const decide = async (u: ApiUser, approve: boolean) => {
    const statusId = approve ? statusIds.active : statusIds.inactive;
    if (!statusId) {
      showToast('error', 'Status missing', `The "${approve ? USER_STATUS.ACTIVE : USER_STATUS.INACTIVE}" user status was not found.`);
      return;
    }
    setBusyId(u.id);
    try {
      await usersService.updateUser(u.id, { status_id: statusId });
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      showToast('success', approve ? 'Access approved' : 'Request declined', u.email);
    } catch (err: any) {
      showToast('error', 'Update failed', err?.response?.data?.message || err?.message || 'Could not update the user.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <SectionLoadingIndicator fullPage label="Loading access requests" />;

  return (
    <PageLayout title="Access Requests" showBackButton backPath="/users">
      <div className="max-w-[1000px] mx-auto">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          External users who registered with email and password. Approving sets them to Active so they can sign in;
          they only see what their role allows. Add them to projects afterwards.
        </p>

        {users.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-10 text-center text-slate-500">
            No pending requests.
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            {users.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {[u.first_name, u.last_name].filter(Boolean).join(' ') || u.username}
                  </div>
                  <div className="text-sm text-slate-500 truncate">{u.email}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Role: {u.role?.name ?? 'None'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="md" disabled={busyId === u.id} onClick={() => decide(u, false)}>
                    <X size={16} className="mr-1.5" /> Decline
                  </Button>
                  <Button variant="primary" size="md" disabled={busyId === u.id} onClick={() => decide(u, true)}>
                    <Check size={16} className="mr-1.5" /> Approve
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageLayout>
  );
}
