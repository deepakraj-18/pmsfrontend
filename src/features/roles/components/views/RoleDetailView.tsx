import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { Card } from '@/components/layout/Card';
import { StatCardProps } from '@/components/data-display/StatCard';
import { Button } from '@/components/forms/Button';
import { DataTable, DataTableColumn } from '@/components/data-display/DataTable';
import { Badge } from '@/components/data-display/Badge';
import { EmptyState } from '@/components/data-display/EmptyState';
import { EntityDetailTemplate } from '@/components/layout/EntityDetailTemplate';
import { Edit, Users, Shield, CheckCircle, Trash2, UserPlus, UserMinus, ArrowLeft } from 'lucide-react';
import { SectionLoadingIndicator } from '@/components/feedback/Loader/SectionLoadingIndicator';
import { rolesService, Role as ApiRole } from '@/features/roles/api/roles.api';
import { UserMultiSelect } from '@/components/core/UserMultiSelect';
import { api } from '@/api/client';
import { useToast } from '@/providers/ToastContext';
import { availablePermissions } from '../../types/permissions';
import { ROLES } from '@/utils/permissions';

const TABS = [{ label: 'Overview' }, { label: 'Permissions' }, { label: 'Assignments' }];

export function RoleDetailView() {
  const navigate = useNavigate();
  const { roleId } = useParams();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'Overview';

  const [role, setRole] = useState<ApiRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingUser, setAddingUser] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);

  const fetchRole = async () => {
    if (!roleId) return;
    try {
      const data = await rolesService.getRole(Number(roleId));
      setRole(data);
    } catch (err) {
      console.error('Failed to fetch role:', err);
      showToast('error', 'Fetch Error', 'Failed to load role details.');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchRole();
      setLoading(false);
    };
    init();
  }, [roleId]);

  const handleBulkAssign = async () => {
    if (selectedUsers.length === 0 || !role || !roleId) return;
    setAddingUser(true);
    try {
      // Get currently assigned user IDs
      const currentIds = (role.users || []).map((u: any) => u.id);
      // Get new user IDs from selection
      const newIds = selectedUsers.map((u: any) => Number(u.id)).filter(id => !isNaN(id));
      
      // Merge unique IDs
      const mergedIds = Array.from(new Set([...currentIds, ...newIds]));
      
      await rolesService.updateRole(Number(roleId), { user_ids: mergedIds });
      
      showToast('success', 'Users Assigned', `${selectedUsers.length} users have been assigned this role.`);
      setSelectedUsers([]);
      await fetchRole();
    } catch (e: any) {
      showToast('error', 'Assignment Failed', e?.response?.data?.detail || 'Could not assign users.');
    } finally {
      setAddingUser(false);
    }
  };

  const handleRemoveUser = async (email: string, name: string) => {
    if (!role || !roleId) return;
    const userToRemove = role.users?.find((u: any) => u.email === email);
    if (!userToRemove) return;

    setRemovingEmail(email);
    try {
      // Filter out the removed user ID
      const updatedIds = (role.users || [])
        .map((u: any) => u.id)
        .filter((id: number) => id !== userToRemove.id);

      await rolesService.updateRole(Number(roleId), { user_ids: updatedIds });
      
      showToast('success', 'User Removed', `${name} has been removed from this role.`);
      await fetchRole();
    } catch (e: any) {
      showToast('error', 'Error', e?.response?.data?.detail || 'Could not remove user.');
    } finally {
      setRemovingEmail(null);
    }
  };

  const handleDelete = async () => {
    try {
      await rolesService.deleteRole(Number(roleId));
      showToast('success', 'Role Deleted', 'The role was successfully deleted.');
      navigate('/roles');
    } catch {
      showToast('error', 'Error', 'Failed to delete role.');
    }
  };

  const assignedPerms = role ? availablePermissions.filter(p => !!role.permissions?.[p.id]) : [];
  const groupedPermissions = assignedPerms.reduce((acc, permission) => {
    if (!acc[permission.category]) acc[permission.category] = [];
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, typeof availablePermissions[0][]>);

  const userColumns: DataTableColumn<any>[] = [
    {
      key: 'name',
      header: 'User Profile',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black text-white flex-shrink-0 shadow-sm"
            style={{ background: 'var(--brand-gradient)' }}>
            {row.first_name?.[0]}{row.last_name?.[0]}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-[13.5px] text-slate-800 dark:text-slate-100 truncate">{row.first_name} {row.last_name}</p>
            <p className="text-[11px] text-slate-500 truncate font-medium">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'email',
      header: 'Email Address',
      render: (val) => <span className="text-[13px] text-slate-600 dark:text-slate-400 font-medium">{val}</span>
    },
    {
      key: 'status',
      header: 'Access Status',
      render: (_, row) => <Badge value={row.status?.name || 'Active'} variant="status" />
    },
    {
      key: 'actions',
      header: '',
      render: (_, row) => (
        <Button
          variant="ghost"
          onClick={(e) => { e.stopPropagation(); handleRemoveUser(row.email, `${row.first_name} ${row.last_name}`); }}
          disabled={removingEmail === row.email}
          className="!px-3 !py-1.5 !text-[11px] font-black !text-rose-600 border-none shadow-none uppercase tracking-wider"
        >
          <UserMinus className="w-3.5 h-3.5 mr-1.5" />
          {removingEmail === row.email ? 'Removing...' : 'Unassign'}
        </Button>
      )
    }
  ];

  if (loading) return <SectionLoadingIndicator fullPage label="Retrieving role details" />;
  if (!role) return <SectionLoadingIndicator fullPage label="Security object not found" />;

  const metadataNodes = [
    <span key="type" className="flex items-center gap-1.5"><Shield className="w-4 h-4 opacity-70" /> System Authority Object</span>,
  ];

  const statsProps: StatCardProps[] = [
    { label: 'Assigned Personnel', value: role.users?.length || 0, icon: <Users size={18} strokeWidth={2} />, accentVariant: 'teal' },
    { label: 'Active Policies', value: assignedPerms.length, icon: <Shield size={18} strokeWidth={2} />, accentVariant: 'violet' },
    { label: 'Total Definition', value: availablePermissions.length, icon: <Shield size={18} strokeWidth={2} />, accentVariant: 'amber' },
  ];

  return (
    <PageLayout isFullHeight>
      <EntityDetailTemplate
        title={role.name || `Role ${roleId}`}
        subtitle="System Authority Object"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => navigate(`/roles/${roleId}/edit`, { state: { fromDetail: true } })}>
              <Edit className="w-4 h-4 mr-2" /> Edit Configuration
            </Button>
          </div>
        }
        icon={<Shield className="w-7 h-7 text-slate-900" />}
        metadata={metadataNodes}
        users={role.users}
        tabs={TABS}
        stats={statsProps}
        progressPercent={availablePermissions.length > 0 ? Math.round((assignedPerms.length / availablePermissions.length) * 100) : 0}
      >
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card glass={true} className="p-0 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/50">
                <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Structural Information</h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 block mb-2">Unique Identifier</label>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200 font-mono bg-slate-100 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">{roleId}</p>
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 block mb-2">Metadata Summary</label>
                  <p className="text-[13px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic">
                    {role.description || 'No descriptive metadata provided for this authority object.'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'Permissions' && (
          <Card glass={true} className="p-0 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/50">
              <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Policy Coverage</h3>
            </div>
            {assignedPerms.length > 0 ? (
              <div className="p-6 space-y-6">
                {Object.entries(groupedPermissions).map(([category, permissions]) => (
                  <div key={category}>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-brand-teal-600 mb-3 flex items-center gap-2">
                      {category}
                      <div className="h-px flex-1 bg-brand-teal-100 dark:bg-brand-teal-900/30" />
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {permissions.map((permission) => {
                        const val = role?.permissions?.[permission.id];
                        const displaySuffix = 
                          val === 'O' ? ' (O)' : 
                          val === 'A' ? ' (A)' : 
                          val === 'All' ? ' (ALL)' : '';

                        return (
                          <div key={permission.id} className="text-[12px] font-bold px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20 transition-all hover:scale-105">
                            {permission.name}{displaySuffix}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Shield className="w-8 h-8 text-slate-300" />}
                title="No Policies Assigned"
                description="This role currently has no active permissions."
              />
            )}
          </Card>
        )}

        {activeTab === 'Assignments' && (
          <Card glass={true} className="p-0 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-4">Add personnel to this scope</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 max-w-md">
                  <UserMultiSelect
                    value={selectedUsers}
                    onChange={setSelectedUsers}
                    placeholder="Search organization directory..."
                  />
                </div>
                <Button
                  onClick={handleBulkAssign}
                  disabled={selectedUsers.length === 0 || addingUser}
                  variant="primary"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {addingUser ? 'Linking...' : 'Assign'}
                </Button>
              </div>
            </div>

            <div className="overflow-auto">
              {(role.users?.length || 0) === 0 ? (
                <EmptyState
                  icon={<Users className="w-8 h-8 text-slate-300" />}
                  title="No Active Personnel"
                  description="Utilize the search bar above to link users."
                />
              ) : (
                <DataTable
                  columns={userColumns}
                  data={role.users || []}
                  onRowClick={(user) => navigate(`/users/${user.id}`)}
                  itemsPerPage={10}
                  pt={{
                    root: { className: 'border-none' }
                  }}
                />
              )}
            </div>
          </Card>
        )}
      </EntityDetailTemplate>
    </PageLayout>
  );
}
