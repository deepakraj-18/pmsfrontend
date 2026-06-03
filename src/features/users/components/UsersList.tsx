import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { EntityPageTemplate } from '@/components/layout/EntityPageTemplate';
import { Button } from '@/components/forms/Button';
import { StatCardProps } from '@/components/data-display/StatCard';
import { DataTable, DataTableColumn } from '@/components/data-display/DataTable';
import { Badge } from '@/components/data-display/Badge';
import { TableSkeleton } from '@/components/feedback/Skeleton/TableSkeleton';
import { Plus, Users, UserPlus, CheckCircle, UserX } from 'lucide-react';
import { usersService, User as ApiUser } from '@/features/users/api/users.api';
import { format } from 'date-fns';
import { FilterSidebar } from '@/components/layout/FilterSidebar';
import { useRolesLookup } from '@/features/masters/hooks/useMasters';
import { useFilters } from '@/hooks/useFilters';
import { UserAvatar } from '@/components/data-display/UserAvatar/UserAvatar';

export function UsersList() {
  const navigate = useNavigate();

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: roles = [] } = useRolesLookup();

  const {
    showFilters, selectedFilters, openFilters, closeFilters,
    handleFilterChange, clearFilters, hasActiveFilters, isMatch,
  } = useFilters();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await usersService.getUsers();
        setUsers(data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filterGroups = [
    {
      id: 'role',
      label: 'Role',
      options: roles.map(r => ({ label: r.name, value: r.id.toString() }))
    }
  ];

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchFilter = isMatch({ role: user.role_id });
      const matchSearch = true;
      return matchFilter && matchSearch;
    });
  }, [users, isMatch]);

  const statsProps: StatCardProps[] = useMemo(() => {
    if (loading) return [];
    return [
      { label: 'Total Users', value: users.length, icon: <Users size={18} strokeWidth={2} />, accentVariant: 'teal' },
      { label: 'Active', value: users.filter(u => u.status?.name === 'Active' || !u.status).length, icon: <CheckCircle size={18} strokeWidth={2} />, accentVariant: 'violet' },
      { label: 'Inactive', value: users.filter(u => u.status?.name === 'Inactive').length, icon: <UserX size={18} strokeWidth={2} />, accentVariant: 'rose' },
      { label: 'New (7d)', value: users.filter(u => new Date((u as any).created_at || new Date()).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length, icon: <UserPlus size={18} strokeWidth={2} />, accentVariant: 'amber' }
    ];
  }, [users, loading]);

  const columns: DataTableColumn<ApiUser>[] = [
    {
      key: 'name',
      header: 'User',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <UserAvatar firstName={row.first_name} lastName={row.last_name} size="md" />
          <div className="flex flex-col">
            <span className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 antialiased capitalize">{row.first_name || row.username} {row.last_name || ''}</span>
            <span className="text-[12px] text-slate-500 font-normal">{row.email}</span>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (_, row) => <span className="text-slate-600 dark:text-slate-400">{row.role?.name || row.role_id || '-'}</span>
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (_, row) => <Badge value={row.status?.name || "Active"} variant="status" />
    },
    {
      key: 'join_date',
      header: 'Join Date',
      sortable: true,
      render: (value) => <span className="text-slate-600 dark:text-slate-400">{value ? format(new Date(value as string), 'MMM d, yyyy') : '-'}</span>
    },
  ];

  return (
    <EntityPageTemplate
      title="Users"
      stats={statsProps}
      filterGroups={filterGroups}
      selectedFilters={selectedFilters}
      onFilterChange={handleFilterChange}
      onClearFilters={clearFilters}
      hasActiveFilters={hasActiveFilters}
      activeFilterCount={Object.values(selectedFilters).flat().length}
      headerActions={
        <Button variant="primary" size="md" onClick={() => navigate('/users/create')}>
          <Plus size={16} className="mr-2" />
          Add User
        </Button>
      }
    >
      {loading ? (
        <div className="space-y-4 p-4">
          <TableSkeleton rows={8} columns={4} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 h-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-[var(--shadow-premium)] overflow-hidden relative">
          <DataTable
            columns={columns}
            data={filteredUsers}
            selectable
            onRowClick={(user) => navigate(`/users/${user.id}`)}
            itemsPerPage={20}
          />
        </div>
      )}
    </EntityPageTemplate>
  );
}
