import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { Card } from '@/components/layout/Card';
import { Button } from '@/components/forms/Button';
import { DataTable, DataTableColumn } from '@/components/data-display/DataTable';
import { StatCardProps } from '@/components/data-display/StatCard';
import { Badge } from '@/components/data-display/Badge';
import { EmptyState } from '@/components/data-display/EmptyState';
import { SectionLoadingIndicator } from '@/components/feedback/Loader/SectionLoadingIndicator';
import { EntityDetailTemplate } from '@/components/layout/EntityDetailTemplate';
import { Edit, Users, FolderKanban, TrendingUp, Trash2, ArrowLeft, UserPlus, UserMinus, Mail } from 'lucide-react';
import { teamsService, Team as ApiTeam } from '@/features/teams/api/teams.api';
import { UserAutocomplete, UserOption } from '@/components/core/UserAutocomplete';
import { api } from '@/api/client';
import { useToast } from '@/providers/ToastContext';

const TABS = [{ label: 'Overview' }, { label: 'Members' }];

export function TeamDetail() {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'Overview';

  const [team, setTeam] = useState<ApiTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingUser, setAddingUser] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);

  const fetchTeam = async () => {
    if (!teamId) return;
    const data = await teamsService.getTeam(Number(teamId));
    setTeam(data);
  };

  useEffect(() => {
    setLoading(true);
    fetchTeam().catch(console.error).finally(() => setLoading(false));
  }, [teamId]);

  const handleAddMember = async () => {
    if (!selectedUser || !teamId) return;
    const email = selectedUser.mail;
    if (!email) {
      showToast('error', 'No email', 'This user does not have an email address.');
      return;
    }
    setAddingUser(true);
    try {
      await api.post(`/teams/${teamId}/members/${encodeURIComponent(email)}`);
      showToast('success', 'Member Added', `${selectedUser.displayName} has been added to the team.`);
      setSelectedUser(null);
      await fetchTeam();
    } catch (e: any) {
      showToast('error', 'Error', e?.response?.data?.detail || 'Could not add member.');
    } finally {
      setAddingUser(false);
    }
  };

  const handleRemoveMember = async (email: string, name: string) => {
    if (!teamId) return;
    setRemovingEmail(email);
    try {
      await api.delete(`/teams/${teamId}/members/${encodeURIComponent(email)}`);
      showToast('success', 'Member Removed', `${name} has been removed from the team.`);
      await fetchTeam();
    } catch (e: any) {
      showToast('error', 'Error', e?.response?.data?.detail || 'Could not remove member.');
    } finally {
      setRemovingEmail(null);
    }
  };

  const handleDelete = async () => {
    try {
      await teamsService.deleteTeam(Number(teamId));
      navigate('/teams');
    } catch {
      showToast('error', 'Error', 'Failed to delete team.');
    }
  };

  const columns: DataTableColumn<any>[] = [
    {
      key: 'name',
      header: 'Member',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
            style={{ background: 'var(--brand-gradient)' }}>
            {row.first_name?.[0]}{row.last_name?.[0]}
          </div>
          <div>
            <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{[row.first_name, row.last_name].filter(Boolean).join(' ')}</p>
            <p className="text-xs text-slate-500">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (_, row) => <Badge value={row.status?.name || 'Active'} variant="status" />
    },
    {
      key: 'actions',
      header: '',
      render: (_, row) => (
        <Button
          variant="ghost"
          onClick={(e) => { e.stopPropagation(); handleRemoveMember(row.email, [row.first_name, row.last_name].filter(Boolean).join(' ')); }}
          disabled={removingEmail === row.email}
          className="flex items-center gap-1.5 !px-3 !py-1.5 text-xs font-bold text-red-600 border border-transparent shadow-none"
        >
          <UserMinus className="w-3.5 h-3.5" />
          {removingEmail === row.email ? 'Removing...' : 'Remove'}
        </Button>
      )
    }
  ];

  if (loading) return <SectionLoadingIndicator fullPage label="Loading team" />;
  if (!team) return <SectionLoadingIndicator fullPage label="Team not found" />;

  const metadataNodes = [
    <span key="email" className="flex items-center gap-1.5"><Mail className="w-4 h-4 opacity-70" /> {team.team_email}</span>,
  ];

  const statsProps: StatCardProps[] = [
    { label: 'Team Members', value: team.members?.length || 0, icon: <Users size={18} strokeWidth={2} />, accentVariant: 'teal' },
    { label: 'Active Projects', value: 0, icon: <FolderKanban size={18} strokeWidth={2} />, accentVariant: 'violet' },
    { label: 'Tasks Completed', value: 0, icon: <TrendingUp size={18} strokeWidth={2} />, accentVariant: 'amber' },
  ];

  return (
    <PageLayout
      title={team.name}
      subtitle={team.team_email}
      isFullHeight
      showBackButton
      backPath="/teams"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleDelete} className="text-rose-600">
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate(`/teams/${teamId}/edit`)}>
            <Edit className="w-4 h-4 mr-2" /> Edit Team
          </Button>
        </div>
      }
    >
      <EntityDetailTemplate
        title={team.name}
        icon={<Users className="w-7 h-7 text-slate-900" />}
        metadata={metadataNodes}
        users={team.members}
        tabs={TABS}
        stats={statsProps}
      >
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card glass={true} className="p-0 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/50">
                <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Team Information</h3>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {[
                  { label: 'Team ID', value: team.public_id },
                  { label: 'Team Email', value: team.team_email },
                  { label: 'Team Lead', value: team.lead ? [team.lead.first_name, team.lead.last_name].filter(Boolean).join(' ') : '—' },
                  { label: 'Max Size', value: team.max_team_size ?? '—' },
                  { label: 'Communication', value: team.primary_communication_channel || '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">{label}</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{value}</p>
                  </div>
                ))}
                {team.description && (
                  <div className="col-span-full">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">Description</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{team.description}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'Members' && (
          <Card glass={true} className="p-0 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">Add member from organization directory</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 max-w-md">
                  <UserAutocomplete
                    value={selectedUser}
                    onChange={setSelectedUser}
                    placeholder="Search org users by name..."
                  />
                </div>
                <Button
                  onClick={handleAddMember}
                  disabled={!selectedUser || addingUser}
                  variant="primary"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {addingUser ? 'Adding...' : 'Add Member'}
                </Button>
              </div>
            </div>

            <div className="overflow-auto">
              {(team.members?.length || 0) === 0 ? (
                <EmptyState
                  icon={<Users className="w-8 h-8 text-slate-300" />}
                  title="No members yet"
                  description="Search and add organization users above"
                />
              ) : (
                <DataTable
                  columns={columns}
                  data={team.members || []}
                  onRowClick={(member) => navigate(`/users/${member.id}`)}
                  itemsPerPage={10}
                />
              )}
            </div>
          </Card>
        )}
      </EntityDetailTemplate>
    </PageLayout>
  );
}
