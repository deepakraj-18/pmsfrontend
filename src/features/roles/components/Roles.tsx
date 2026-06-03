import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EntityPageTemplate } from '@/components/layout/EntityPageTemplate';
import { StatCardProps } from '@/components/data-display/StatCard';
import { Button } from '@/components/forms/Button';
import { TableSkeleton } from '@/components/feedback/Skeleton/TableSkeleton';
import {
    Plus, Shield, Users, Wrench, Lock, Edit, ChevronRight,
    ShieldCheck, ShieldAlert, LayoutGrid, List
} from 'lucide-react';
import { useRolesQuery } from '@/features/roles/hooks/useRoles';
import { SegmentedControl } from '@/components/forms/SegmentedControl';
import { ROLES } from '@/utils/permissions';

const usePermissions = (_module: string) => ({ canEdit: true, canDelete: false });


const SYSTEM_ROLES = ['Admin', 'Team Lead', 'Employee'];

function RoleTypeBadge({ name }: { name: string }) {
    const isSystem = SYSTEM_ROLES.some(r => r.toLowerCase() === name?.toLowerCase());
    return (
        <span
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={
                isSystem
                    ? { background: 'hsl(220 70% 50% / 0.1)', color: 'hsl(220 70% 50%)', border: '1px solid hsl(220 70% 50% / 0.25)' }
                    : { background: 'hsl(160 60% 45% / 0.1)', color: 'hsl(160 60% 40%)', border: '1px solid hsl(160 60% 45% / 0.25)' }
            }
        >
            {isSystem ? <Lock size={9} /> : <Wrench size={9} />}
            {isSystem ? 'System' : 'Custom'}
        </span>
    );
}

function ModuleCount({ permissions }: { permissions?: any }) {
    const count = permissions
        ? Object.values(permissions).filter(v => v === true).length
        : 0;
    if (count === 0) return (
        <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>No permissions</span>
    );
    return (
        <span
            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: 'hsl(160 60% 45% / 0.1)', color: 'hsl(160 60% 40%)', border: '1px solid hsl(160 60% 45% / 0.2)' }}
        >
            <ShieldCheck size={11} />
            {count} {count === 1 ? 'module' : 'modules'}
        </span>
    );
}

function RoleCard({ role, onEdit, onClick }: { role: any; onEdit: () => void; onClick: () => void }) {
    const isSystem = SYSTEM_ROLES.some(r => r.toLowerCase() === role.name?.toLowerCase());
    const accentColor = isSystem ? 'hsl(220 70% 50%)' : 'hsl(160 60% 45%)';
    const moduleCount = role.permissions ? Object.keys(role.permissions).length : 0;

    return (
        <div
            onClick={onClick}
            className="group relative rounded-2xl border cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg overflow-hidden"
            style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
            }}
        >

            <div className="h-1 w-full" style={{ background: accentColor }} />

            <div className="p-5">

                <div className="flex items-start justify-between gap-3 mb-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${accentColor}14`, border: `1px solid ${accentColor}30` }}
                    >
                        {isSystem
                            ? <ShieldAlert size={18} style={{ color: accentColor }} />
                            : <Shield size={18} style={{ color: accentColor }} />
                        }
                    </div>
                    <RoleTypeBadge name={role.name} />
                </div>

                <h3 className="font-bold text-[15px] mb-1 group-hover:text-brand-teal-600 transition-colors"
                    style={{ color: 'var(--text-primary)' }}>
                    {role.name}
                </h3>

                <p className="text-[12px] line-clamp-2 mb-4 leading-relaxed"
                    style={{ color: 'var(--text-muted)', minHeight: '2.5rem' }}>
                    {role.description || 'No description provided.'}
                </p>

                <div className="flex items-center justify-between pt-3"
                    style={{ borderTop: '1px solid var(--border-color)' }}>
                    <div className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                        <Users size={13} style={{ color: 'var(--text-muted)' }} />
                        <span>{role.users_count || 0} {(role.users_count || 0) === 1 ? 'user' : 'users'}</span>
                    </div>
                    <ModuleCount permissions={role.permissions} />
                </div>



            </div>
        </div>
    );
}

function RoleRow({ role, onEdit, onClick }: { role: any; onEdit: () => void; onClick: () => void }) {
    const isSystem = SYSTEM_ROLES.some(r => r.toLowerCase() === role.name?.toLowerCase());
    const accentColor = isSystem ? 'hsl(220 70% 50%)' : 'hsl(160 60% 45%)';

    return (
        <div
            onClick={onClick}
            className="group flex items-center gap-4 px-5 py-4 rounded-xl cursor-pointer transition-all hover:shadow-sm"
            style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
            }}
        >

            <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${accentColor}14`, border: `1px solid ${accentColor}30` }}
            >
                {isSystem ? <ShieldAlert size={16} style={{ color: accentColor }} /> : <Shield size={16} style={{ color: accentColor }} />}
            </div>


            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-[14px] group-hover:text-brand-teal-600 transition-colors truncate"
                        style={{ color: 'var(--text-primary)' }}>
                        {role.name}
                    </span>
                    <RoleTypeBadge name={role.name} />
                </div>
                <p className="text-[12px] truncate" style={{ color: 'var(--text-muted)' }}>
                    {role.description || 'No description provided.'}
                </p>
            </div>

            <div className="flex items-center gap-1.5 text-[12px] font-medium w-24 flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
                <Users size={13} style={{ color: 'var(--text-muted)' }} />
                {role.users_count || 0} users
            </div>


            <div className="w-32 flex-shrink-0">
                <ModuleCount permissions={role.permissions} />
            </div>


            <div className="flex items-center gap-1.5 flex-shrink-0">

                <ChevronRight size={15} className="opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--text-muted)' }} />
            </div>
        </div>
    );
}


export const Roles = () => {
    const navigate = useNavigate();
    const { canEdit } = usePermissions('roles');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    const [lazyParams] = useState({ first: 0, rows: 100, page: 0, sortField: undefined, sortOrder: undefined, globalFilter: null });
    const { data, isLoading } = useRolesQuery(lazyParams as any);

    const roles = data?.data || [];
    const totalRecords = roles.length;
    const totalUsers = roles.reduce((acc, role) => acc + (role.users_count || 0), 0);
    const systemRoles = roles.filter((r) => SYSTEM_ROLES.some(s => s.toLowerCase() === r.name?.toLowerCase())).length;
    const customRoles = roles.length - systemRoles;

    const statsProps: StatCardProps[] = [
        { label: 'Total Roles', value: totalRecords, icon: <Shield size={18} strokeWidth={2} />, accentVariant: 'teal' },
        { label: 'Active Users', value: totalUsers, icon: <Users size={18} strokeWidth={2} />, accentVariant: 'violet' },
        { label: 'Custom Roles', value: customRoles, icon: <Wrench size={18} strokeWidth={2} />, accentVariant: 'amber' },
        { label: 'System Roles', value: systemRoles, icon: <Lock size={18} strokeWidth={2} />, accentVariant: 'teal' },
    ];

    return (
        <EntityPageTemplate
            title="Roles"
            stats={statsProps}
            headerActions={
                <div className="flex items-center gap-2">
                    <SegmentedControl
                        value={viewMode}
                        onChange={(v) => setViewMode(v as 'grid' | 'list')}
                        options={[
                            { label: 'List', value: 'list', icon: <List size={13} strokeWidth={2.5} /> },
                            { label: 'Grid', value: 'grid', icon: <LayoutGrid size={13} strokeWidth={2.5} /> },
                        ]}
                    />
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
                    <Button variant="secondary" size="md" onClick={() => navigate('/roles/permissions-matrix')}>
                        <Shield size={15} /> Permissions
                    </Button>
                    <Button variant="primary" size="md" onClick={() => navigate('/roles/create')}>
                        <Plus size={15} /> Create Role
                    </Button>
                </div>
            }
        >
            <div className="h-full overflow-auto px-1 pb-6">
                {isLoading ? (
                    <div className="p-4"><TableSkeleton rows={6} columns={4} /></div>
                ) : roles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4" style={{ color: 'var(--text-muted)' }}>
                        <Shield size={48} className="opacity-20" />
                        <p className="text-sm font-medium">No roles found. Create your first role.</p>
                        <Button variant="primary" onClick={() => navigate('/roles/create')}>
                            <Plus size={15} /> Create Role
                        </Button>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
                        {roles.map((role) => (
                            <RoleCard
                                key={role.id}
                                role={role}
                                onEdit={() => navigate(`/roles/edit/${role.id}`)}
                                onClick={() => navigate(`/roles/${role.id}`)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2 pt-2">

                        <div className="grid px-5 pb-1 text-[11px] font-bold uppercase tracking-wider"
                            style={{ color: 'var(--text-muted)', gridTemplateColumns: '2.25rem 1fr 6rem 8rem 5rem' }}>
                            <span />
                            <span>Role</span>
                            <span>Users</span>
                            <span>Permissions</span>
                            <span />
                        </div>
                        {roles.map((role) => (
                            <RoleRow
                                key={role.id}
                                role={role}
                                onEdit={() => navigate(`/roles/edit/${role.id}`)}
                                onClick={() => navigate(`/roles/${role.id}`)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </EntityPageTemplate>
    );
};
