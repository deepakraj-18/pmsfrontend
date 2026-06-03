import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { EntityPageTemplate } from '@/components/layout/EntityPageTemplate';
import { StatCardProps } from '@/components/data-display/StatCard';
import { Button } from '@/components/forms/Button';
import { DataTable, DataTableColumn } from '@/components/data-display/DataTable';
import { TableSkeleton } from '@/components/feedback/Skeleton/TableSkeleton';
import { Plus, UsersRound, Users, FolderKanban, ChevronRight } from 'lucide-react';
import { teamsService, Team as ApiTeam } from '@/features/teams/api/teams.api';

export function Teams() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teamsService.getTeams()
      .then(setTeams)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredTeams = useMemo(() => {

    return teams.filter(t =>
      true
    );
  }, [teams]);

  const columns: DataTableColumn<ApiTeam>[] = [
    {
      key: 'public_id',
      header: 'Team ID',
      sortable: true,
      render: (v) => <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{v as string}</span>
    },
    {
      key: 'name',
      header: 'Team',
      sortable: true,
      render: (v, row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-slate-900 shadow-sm flex-shrink-0 brand-gradient-bg">
            {String(v)?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{v as string}</p>
          </div>
        </div>
      )
    },
    {
      key: 'lead_id',
      header: 'Team Lead',
      render: (_, row: any) => row.lead
        ? <span className="font-medium text-[13px] text-slate-700 dark:text-slate-300">{row.lead.first_name} {row.lead.last_name}</span>
        : <span className="text-xs text-slate-400 italic">None assigned</span>
    },
    {
      key: 'members_count',
      header: 'Members',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{value as number || 0}</span>
        </div>
      )
    },
    {
      key: 'id',
      header: '',
      render: (_, row) => (
        <Button
          variant="ghost"
          onClick={(e) => { e.stopPropagation(); navigate(`/teams/${row.id}`); }}
          className="w-8 h-8 !p-0"
        >
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Button>
      )
    }
  ];

  const totalMembers = teams.reduce((acc, t) => acc + (t.members_count || 0), 0);

  const statsProps: StatCardProps[] = [
    { label: 'Total Teams', value: teams.length, icon: <UsersRound size={18} strokeWidth={2} />, accentVariant: 'teal' },
    { label: 'Total Members', value: totalMembers, icon: <Users size={18} strokeWidth={2} />, accentVariant: 'violet' },
    { label: 'Active Projects', value: 0, icon: <FolderKanban size={18} strokeWidth={2} />, accentVariant: 'amber' }
  ];

  return (
    <EntityPageTemplate
      title="Teams"
      stats={statsProps}

      headerActions={
        <Button variant="primary" size="md" onClick={() => navigate('/teams/create')}>
          <Plus size={16} className="mr-2" />
          Create Team
        </Button>
      }
    >
      {loading ? (
        <div className="p-4 space-y-4">
          <TableSkeleton rows={8} columns={5} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 h-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-[var(--shadow-premium)] overflow-hidden relative">
          <DataTable
            columns={columns}
            data={filteredTeams}
            selectable
            onRowClick={(team) => navigate(`/teams/${team.id}`)}
            itemsPerPage={20}
          />
        </div>
      )}
    </EntityPageTemplate>
  );
}
