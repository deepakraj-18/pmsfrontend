import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { EntityPageTemplate } from '@/components/layout/EntityPageTemplate';
import { Button } from '@/components/forms/Button';
import { SegmentedControl } from '@/components/forms/SegmentedControl';
import { EmptyState } from '@/components/data-display/EmptyState';
import { StatCardProps } from '@/components/data-display/StatCard';
import { Search, AlertCircle, AlertTriangle, CheckCircle, Clock, Download, Plus, Upload, Columns, List as ListIcon, X } from 'lucide-react';
import { useIssues } from '../../hooks/useIssues';
import { useMasterLookups, useUsersDropdown } from '@/features/masters/hooks/useMasters';
import { useFilters } from '@/hooks/useFilters';
import { useAuth } from '@/auth/AuthProvider';
import { can } from '@/utils/permissions';
import { exportToCSV } from '@/utils/export';
import { statusStr } from '@/utils/statusHelpers';
import { LazyParams } from '@/components/data-display/DataTable';
import { TableSkeleton } from '@/components/feedback/Skeleton/TableSkeleton';
import { IssueListTable } from '../ui/IssueListTable';
import { IssuesKanbanBoard } from '../ui/IssuesKanbanBoard';
import { issuesService } from '../../api/issues.api';
import { InputText } from 'primereact/inputtext';
import { useDebounce } from '@/hooks/useDebounce';

export function IssuesListView() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [lazyParams, setLazyParams] = useState<LazyParams>({ first: 0, rows: 20, page: 0 });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const {
    selectedFilters, handleFilterChange, clearFilters, hasActiveFilters,
  } = useFilters();

  const queryParams = useMemo(() => ({
    skip: lazyParams.first,
    limit: 100,
    status_id: selectedFilters.status?.map(Number),
    severity_id: selectedFilters.priority?.map(Number),
    assignee_email: selectedFilters.assignee,
    search: debouncedSearch || undefined,
  }), [lazyParams, selectedFilters, debouncedSearch]);

  const { data, isLoading, refetch } = useIssues(queryParams);
  const issues = data?.items ?? [];
  const totalRecords = data?.total ?? 0;

  const { data: statuses = [] } = useMasterLookups('IssueStatus');
  const { data: priorities = [] } = useMasterLookups('IssueSeverity');
  const { data: allUsers = [] } = useUsersDropdown();

  const filterGroups = [
    {
      id: 'status',
      label: 'Status',
      options: statuses.map((s: any) => ({ label: s.label || s.name, value: s.id.toString() })),
    },
    {
      id: 'priority',
      label: 'Severity / Priority',
      options: priorities.map((p: any) => ({ label: p.label || p.name, value: p.id.toString() })),
    },
    {
      id: 'assignee',
      label: 'Assignee',
      options: allUsers.map((u: any) => ({
        label: `${u.first_name} ${u.last_name}`,
        value: u.email,
      })),
    },
  ];

  const handleKanbanDrop = async (issueId: number, newStatus: string) => {
    const issue = issues.find((i) => i.id === issueId);
    if (issue && issue.status !== newStatus) {
      try {
        await issuesService.updateIssue(issueId, { status: newStatus });
        refetch();
      } catch (err) {
        console.error('Failed to update issue status via DnD', err);
      }
    }
  };

  const handleExport = () => {
    const exportData = issues.map((i: any) => ({
      'Issue ID':        i.public_id ?? '',
      'Title':           i.bug_name ?? '',
      'Description':     i.description ?? '',
      'Project':         i.project?.project_name ?? '',
      'Status':          i.status_master?.label ?? i.status?.label ?? '',
      'Priority':        i.priority_master?.label ?? i.priority?.label ?? '',
      'Severity':        i.severity_master?.label ?? i.severity?.label ?? '',
      'Classification':  i.classification_master?.label ?? i.classification?.label ?? '',
      'Reporter':        i.reporter ? [i.reporter.first_name, i.reporter.last_name].filter(Boolean).join(' ') : '',
      'Assignee':        i.assignee ? [i.assignee.first_name, i.assignee.last_name].filter(Boolean).join(' ') : '',
      'Assignees':       Array.isArray(i.assignees) ? i.assignees.map((u: any) => [u.first_name, u.last_name].filter(Boolean).join(' ')).join('; ') : '',
      'Start Date':      i.start_date ?? '',
      'Due Date':        i.due_date ?? '',
      'Estimated Hours': i.estimated_hours ?? '',
      'Module':          i.module ?? '',
      'Tags':            i.tags ?? '',
      'Flag':            i.flag ?? '',
      'Reproducible':    i.reproducible_flag ? 'Yes' : 'No',
      'Created At':      i.created_at ? String(i.created_at).split('T')[0] : '',
    }));
    exportToCSV(exportData, 'issues.csv');
  };

  const statsProps: StatCardProps[] = useMemo(() => {
    const s = (data as any)?.stats;
    
    const total = data?.total ?? 0;
    const open = s?.open ?? 0;
    const inProgress = s?.in_progress ?? 0;
    const closed = s?.closed ?? 0;

    return [
      { label: 'Total Defects', value: total, icon: <AlertTriangle size={18} strokeWidth={2} />, accentVariant: 'amber' },
      { label: 'Open', value: open, icon: <AlertCircle size={18} strokeWidth={2} />, accentVariant: 'rose' },
      { label: 'In Progress', value: inProgress, icon: <Clock size={18} strokeWidth={2} />, accentVariant: 'violet' },
      { label: 'Closed', value: closed, icon: <CheckCircle size={18} strokeWidth={2} />, accentVariant: 'teal' },
    ];
  }, [data]);

  return (
    <EntityPageTemplate
      title="Defects"
      stats={statsProps}
      filterGroups={filterGroups}
      selectedFilters={selectedFilters}
      onFilterChange={handleFilterChange}
      onClearFilters={clearFilters}
      hasActiveFilters={hasActiveFilters}
      activeFilterCount={Object.values(selectedFilters).flat().length}
      loading={isLoading}
      utilityBarExtra={null}
      headerActions={
        <div className="flex items-center gap-2">
          <SegmentedControl
            value={view}
            onChange={(v) => setView(v as 'list' | 'kanban')}
            options={[
              { label: 'List', value: 'list', icon: <ListIcon size={13} strokeWidth={2.5} /> },
              { label: 'Kanban', value: 'kanban', icon: <Columns size={13} strokeWidth={2.5} /> },
            ]}
          />
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            className="!w-9 !h-9 !p-0 !rounded-xl"
            tooltip="Export CSV"
          >
            <Download size={15} strokeWidth={2.5} />
          </Button>
          {can.createIssue(user?.role) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/issues/import')}
              className="!w-9 !h-9 !p-0 !rounded-xl"
              tooltip="Import CSV"
            >
              <Upload size={15} strokeWidth={2.5} />
            </Button>
          )}
          {can.createIssue(user?.role) && (
            <Button
              onClick={() => navigate('/issues/create')}
              size="sm"
              className="shadow-brand-teal-500/25 ml-2"
            >
              <Plus size={15} /> Report Defect
            </Button>
          )}
        </div>
      }
    >
      {view === 'list' ? (
        <div className="h-full flex flex-col min-h-0">
          {isLoading && !data ? (
            <div className="p-4"><TableSkeleton rows={6} columns={8} /></div>
          ) : issues.length === 0 ? (
            <EmptyState
              icon={<AlertTriangle />}
              title="No defects found"
              description={hasActiveFilters || search ? "Try adjusting your filters or search to see more defects." : "All clear! No defects reported."}
              action={(!hasActiveFilters && !search) && (
                <Button
                  variant="primary"
                  onClick={() => navigate('/issues/create')}
                  className="!h-10 !px-4"
                >
                  <Plus size={15} /> Report Defect
                </Button>
              )}
            />
          ) : (
            <IssueListTable
              issues={issues}
              totalRecords={totalRecords}
              lazy={true}
              paginator={true}
              onPage={(e) => setLazyParams(e)}
              first={lazyParams.first}
              rows={lazyParams.rows}
              onRowClick={(issue) => navigate(`/issues/${issue.id}`, { state: { from: location.pathname + location.search } })}
              loading={isLoading}
            />
          )}
        </div>
      ) : (
        <div className="h-full overflow-hidden bg-slate-50 dark:bg-slate-900/50">
          {issues.length === 0 ? (
            <EmptyState
              icon={<AlertTriangle />}
              title="Empty Board"
              description={hasActiveFilters || search ? "No defects match your filters or search." : "Your board is currently clean — no defects!"}
            />
          ) : (
            <IssuesKanbanBoard
              issues={issues}
              statuses={statuses}
              onDrop={(issueId: number, newStatus: string) => handleKanbanDrop(issueId, newStatus)}
            />
          )}
        </div>
      )}
    </EntityPageTemplate>
  );
}
