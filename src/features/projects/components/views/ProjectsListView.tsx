import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { EntityPageTemplate } from '@/components/layout/EntityPageTemplate';
import { Button } from '@/components/forms/Button';
import { SegmentedControl } from '@/components/forms/SegmentedControl';
import { EmptyState as EmptyStateComp } from '@/components/data-display/EmptyState';
import { StatCardProps } from '@/components/data-display/StatCard';
import { Search, Plus, FolderKanban, CheckCircle, Clock, Download, LayoutGrid, List as ListIcon, AlertTriangle, X } from 'lucide-react';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { exportToCSV } from '@/utils/export';
import { Project } from '@/features/projects/api/projects.api';
import { statusStr } from '@/utils/statusHelpers';
import { ProjectListTable } from '../ui/ProjectListTable';
import { TableSkeleton } from '@/components/feedback/Skeleton/TableSkeleton';
import { useMasterLookups, useUsersDropdown } from '@/features/masters/hooks/useMasters';
import { useFilters } from '@/hooks/useFilters';
import { useAuth } from '@/auth/AuthProvider';
import { can } from '@/utils/permissions';
import { ProjectKanbanBoard } from '../ui/ProjectKanbanBoard';
import { useDebounce } from '@/hooks/useDebounce';
import { InputText } from 'primereact/inputtext';
import { LazyParams } from '@/components/data-display/DataTable';

export function ProjectsListView() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Active Projects');
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [lazyParams, setLazyParams] = useState<LazyParams>({ first: 0, rows: 20, page: 0 });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const {
    selectedFilters, handleFilterChange, clearFilters, hasActiveFilters,
  } = useFilters();

  const { data: allUsersData } = useUsersDropdown();
  const { data: statusesData } = useMasterLookups('ProjectStatus');
  const { data: prioritiesData } = useMasterLookups('TaskPriority');

  const allUsers = Array.isArray(allUsersData) ? allUsersData : (allUsersData as any)?.items || [];
  const statuses = Array.isArray(statusesData) ? statusesData : (statusesData as any)?.items || [];
  const priorities = Array.isArray(prioritiesData) ? prioritiesData : (prioritiesData as any)?.items || [];

  const queryParams = useMemo(() => ({
    skip: lazyParams.first,
    limit: 1000,
    status_id: selectedFilters.status?.map(Number),
    priority_id: selectedFilters.priority?.map(Number),
    manager_emails: selectedFilters.manager,
    search: debouncedSearch || undefined,
    is_template: activeTab === 'Project Templates' ? true : false,
    is_archived: false,
  }), [lazyParams, selectedFilters, debouncedSearch, activeTab]);

  const { data: projectsData, isLoading } = useProjects(queryParams);
  const { data: tasksData } = useTasks({ limit: 1000 });
  const allTasks = tasksData?.items ?? [];

  const rawProjects: Project[] = Array.isArray(projectsData) ? projectsData : (projectsData as any)?.items || [];
  
  const projects = useMemo(() => {
    return rawProjects.filter(p => {
      if (selectedFilters.project_type && selectedFilters.project_type.length > 0) {
          if (!selectedFilters.project_type.includes(p.project_type as never)) return false;
      }
      if (selectedFilters.billing_model && selectedFilters.billing_model.length > 0) {
          if (!selectedFilters.billing_model.includes(p.billing_model as never)) return false;
      }
      return true;
    }).map(p => {
      const pTasks = allTasks.filter((t: any) => t.project_id === p.id);
      const completedTasks = pTasks.filter(t => {
        const s = statusStr((t as any).status_master ?? t.status);
        return s === 'completed' || s === 'closed' || s === 'done';
      }).length;
      const totalTasks = pTasks.length;
      const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      return { ...p, completion_percentage: pct };
    });
  }, [rawProjects, allTasks, selectedFilters]);

  const totalRecords: number = (projectsData as any)?.total || projects.length;

  const tabs = ['Active Projects'];

  const uniqueProjectTypes = Array.from(new Set(rawProjects.map(p => p.project_type).filter(Boolean)));
  const uniqueBillingModels = Array.from(new Set(rawProjects.map(p => p.billing_model).filter(Boolean)));

  const filterGroups = [
    {
      id: 'status',
      label: 'Status',
      options: statuses.map(s => ({ label: s.label || s.name, value: s.id.toString() })),
    },
    { id: 'priority', label: 'Priority', options: priorities.map(p => ({ label: p.label || p.name, value: p.id.toString() })) },
    { id: 'manager', label: 'Manager', options: allUsers.map(u => ({ label: `${u.first_name} ${u.last_name}`, value: u.email })) },
    ...(uniqueProjectTypes.length > 0 ? [{ id: 'project_type', label: 'Project Type', options: uniqueProjectTypes.map(t => ({ label: t as string, value: t as string })) }] : []),
    ...(uniqueBillingModels.length > 0 ? [{ id: 'billing_model', label: 'Billing Model', options: uniqueBillingModels.map(b => ({ label: b as string, value: b as string })) }] : []),
  ];

  const statsProps = useMemo(() => {
    if (isLoading && !projectsData) return [];
    const counts = { total: projects.length, active: 0, completed: 0, planning: 0 };
    projects.forEach((p: any) => {
      const s = statusStr(p.status_master ?? p.status);
      if (['completed', 'closed', 'cancelled'].includes(s)) counts.completed++;
      else if (s.includes('planning')) counts.planning++;
      else counts.active++;
    });

    return [
      { label: 'Total Visible', value: counts.total, icon: <FolderKanban size={18} strokeWidth={2} />, accentVariant: 'teal' },
      { label: 'Active', value: counts.active, icon: <Clock size={18} strokeWidth={2} />, accentVariant: 'teal' },
      { label: 'Completed', value: counts.completed, icon: <CheckCircle size={18} strokeWidth={2} />, accentVariant: 'teal' },
      { label: 'Planning', value: counts.planning, icon: <AlertTriangle size={18} strokeWidth={2} />, accentVariant: 'amber' },
    ] as StatCardProps[];
  }, [projects, isLoading, projectsData]);

  const handleExport = () => {
    const exportData = projects.map((p: any) => ({
      'Project ID':        p.public_id ?? '',
      'Project Name':      p.project_name ?? '',
      'Customer Name':     p.customer_name ?? '',
      'Client Name':       p.client_name ?? '',
      'Billing Model':     p.billing_model ?? '',
      'Project Type':      p.project_type ?? '',
      'Status':            p.status_master?.label ?? p.status?.label ?? '',
      'Priority':          p.priority_master?.label ?? p.priority?.label ?? '',
      'Owner':             p.owner ? [p.owner.first_name, p.owner.last_name].filter(Boolean).join(' ') : '',
      'Project Manager':   p.project_manager ? [p.project_manager.first_name, p.project_manager.last_name].filter(Boolean).join(' ') : '',
      'Delivery Head':     p.delivery_head ? [p.delivery_head.first_name, p.delivery_head.last_name].filter(Boolean).join(' ') : '',
      'Expected Start':    p.expected_start_date ?? '',
      'Expected End':      p.expected_end_date ?? '',
      'Actual Start':      p.actual_start_date ?? '',
      'Actual End':        p.actual_end_date ?? '',
      'Estimated Hours':   p.estimated_hours ?? '',
      'Actual Hours':      p.actual_hours ?? '',
      'Completion %':      p.completion_percentage ?? '',
      'Tags':              p.tags ?? '',
      'Description':       p.description ?? '',
      'Is Archived':       p.is_archived ? 'Yes' : 'No',
      'Is Template':       p.is_template ? 'Yes' : 'No',
    }));
    exportToCSV(exportData, 'projects.csv');
  };

  return (
    <EntityPageTemplate
      title="Projects"
      stats={statsProps}
      tabs={tabs.length > 1 ? tabs : undefined}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      getTabCount={(tab) => tab === activeTab ? totalRecords : '—'}
      loading={isLoading}
      filterGroups={filterGroups}
      selectedFilters={selectedFilters}
      onFilterChange={handleFilterChange}
      onClearFilters={clearFilters}
      hasActiveFilters={hasActiveFilters}
      activeFilterCount={Object.values(selectedFilters).flat().length}
      utilityBarExtra={null}
      headerActions={
        <div className="flex items-center gap-2">
          <SegmentedControl
            value={view}
            onChange={(v) => setView(v as 'list' | 'kanban')}
            options={[
              { label: 'List', value: 'list', icon: <ListIcon size={13} strokeWidth={2.5} /> },
              { label: 'Kanban', value: 'kanban', icon: <LayoutGrid size={13} strokeWidth={2.5} /> },
            ]}
          />
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            className="!w-9 !h-9 !p-0 !rounded-xl"
            title="Export CSV"
          >
            <Download size={15} strokeWidth={2.5} />
          </Button>
          {can.createProject(user?.role) && (
            <Button
              onClick={() => navigate('/projects/create')}
              size="sm"
              className="shadow-brand-teal-500/25 ml-2"
            >
              <Plus size={15} /> New Project
            </Button>
          )}
        </div>
      }
    >
      {view === 'kanban' ? (
        <ProjectKanbanBoard projects={projects} />
      ) : (
        <div className="h-full flex flex-col min-h-0">
          {isLoading && !projectsData ? (
            <div className="p-4 h-full"><TableSkeleton rows={6} columns={8} /></div>
          ) : projects.length === 0 ? (
            <EmptyStateComp
              icon={<FolderKanban />}
              title="No projects found"
              description={hasActiveFilters || search ? "Try adjusting your filters or search to see more projects." : "Get started by creating your first project."}
              action={(!hasActiveFilters && !search) && (
                <Button variant="primary" onClick={() => navigate('/projects/create')} className="!h-10 !px-5"><Plus size={15} /> New Project</Button>
              )}
            />
          ) : (
            <ProjectListTable
              projects={projects}
              loading={isLoading}
              lazy={true}
              paginator={true}
              totalRecords={totalRecords}
              onPage={(e) => setLazyParams(e)}
              first={lazyParams.first}
              rows={lazyParams.rows}
            />
          )}
        </div>
      )}
    </EntityPageTemplate>
  );
}
