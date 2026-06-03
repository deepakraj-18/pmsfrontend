import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { rolesService } from '@/features/roles/api/roles.api';
import { availablePermissions, Permission } from '@/features/roles/types/permissions';
import { useRoleActions } from '@/features/roles/hooks/useRoleActions';
import { Button } from '@/components/forms/Button';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { SectionLoadingIndicator } from '@/components/feedback/Loader/SectionLoadingIndicator';
import {
    Shield, Check, X, Save, RotateCcw,
    ChevronRight, ChevronDown, Lock, Info,
    LayoutGrid, ListTodo, Bug, Clock, Users, BarChart3, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dropdown } from 'primereact/dropdown';

// Mapping categories to icons for the sidebar/list
const categoryIcons: Record<string, any> = {
    'Projects': <LayoutGrid size={16} />,
    'Tasks': <ListTodo size={16} />,
    'Issues': <Bug size={16} />,
    'Milestones': <Check size={16} />,
    'Time Tracking': <Clock size={16} />,
    'Users': <Users size={16} />,
    'Teams': <Users size={16} />,
    'Reports': <BarChart3 size={16} />,
    'Administration': <Settings size={16} />,
};

export function PermissionsMatrixView() {
    const navigate = useNavigate();
    const { bulkUpdatePermissions } = useRoleActions();

    // Fetch roles
    const { data: roles = [], isLoading } = useQuery({
        queryKey: ['roles', 'all'],
        queryFn: () => rolesService.getRoles()
    });

    const editableRoles = useMemo(() => {
        return roles;
    }, [roles]);

    const [localPermissions, setLocalPermissions] = useState<Record<number, Record<string, any>>>({});
    const [isDirty, setIsDirty] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        'Projects': true,
        'Tasks': true,
        'Issues': true,
        'Time Tracking': true
    });

    // Initialize local state when roles are loaded
    useEffect(() => {
        if (roles.length > 0) {
            const initialState: Record<number, Record<string, any>> = {};
            roles.forEach(role => {
                initialState[role.id] = { ...(role.permissions || {}) };
            });
            setLocalPermissions(initialState);
        }
    }, [roles]);

    const categories = useMemo(() => {
        const groups: Record<string, Permission[]> = {};
        availablePermissions.forEach(p => {
            if (!groups[p.category]) groups[p.category] = [];
            groups[p.category].push(p);
        });
        return groups;
    }, []);

    const togglePermission = (roleId: number, permissionId: string) => {
        const roleName = roles.find(r => r.id === roleId)?.name.toLowerCase();
        if (roleName === 'admin') return;

        setLocalPermissions(prev => {
            const rolePerms = prev[roleId] || {};
            const next = {
                ...prev,
                [roleId]: {
                    ...rolePerms,
                    [permissionId]: !rolePerms[permissionId]
                }
            };
            setIsDirty(true);
            return next;
        });
    };

    const toggleCategory = (cat: string) => {
        setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    const handleSave = async () => {
        const updates: Record<number, any> = {};
        editableRoles.forEach(role => {
            if (role.name.toLowerCase() !== 'admin') {
                updates[role.id] = localPermissions[role.id];
            }
        });

        await bulkUpdatePermissions.mutateAsync(updates);
        setIsDirty(false);
    };

    const handleReset = () => {
        const initialState: Record<number, Record<string, any>> = {};
        roles.forEach(role => {
            initialState[role.id] = { ...(role.permissions || {}) };
        });
        setLocalPermissions(initialState);
        setIsDirty(false);
    };

    if (isLoading) return <SectionLoadingIndicator fullPage label="Loading Permissions Matrix..." />;

    return (
        <PageLayout title="Permissions Matrix" subtitle="Centralized Role Management">
            <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 overflow-hidden">
                {/* Header Actions */}
                <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-slate-800 dark:text-white">Role Permissions Grid</h1>
                            <p className="text-xs text-slate-500 font-medium italic flex items-center gap-1">
                                <Info size={12} /> Admin roles have full access by default and cannot be restricted.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={<RotateCcw size={16} />}
                            onClick={handleReset}
                            disabled={!isDirty}
                        >
                            Reset
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            icon={<Save size={16} />}
                            onClick={handleSave}
                            loading={bulkUpdatePermissions.isPending}
                            disabled={!isDirty}
                            className="bg-teal-600 hover:bg-teal-700"
                        >
                            Save Changes
                        </Button>
                    </div>
                </div>

                {/* Matrix Content */}
                <div className="flex-1 overflow-auto custom-scrollbar p-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden min-w-max">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                    <th className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-800 px-6 py-4 text-left border-b border-r border-slate-200 dark:border-slate-700 w-[300px]">
                                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Default Modules & Actions</span>
                                    </th>
                                    {editableRoles.map(role => (
                                        <th key={role.id} className="px-6 py-4 text-center border-b border-slate-200 dark:border-slate-700 min-w-[120px]">
                                            <div className="flex flex-col items-center">
                                                <span className={`text-[13px] font-black ${role.name.toLowerCase() === 'admin' ? 'text-teal-600' : 'text-slate-700 dark:text-slate-300'}`}>
                                                    {role.name}
                                                    {role.name.toLowerCase() === 'admin' && <Lock size={12} className="inline ml-1" />}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">{role.users_count} Users</span>
                                            </div>
                                        </th>
                                    ))}
                                    {/* Placeholder column for "+ Add Profile" as seen in Zoho */}
                                    <th className="px-6 py-4 text-center border-b border-slate-200 dark:border-slate-700">
                                        <button onClick={() => navigate('/roles/create')} className="text-teal-600 font-bold text-xs hover:underline">+ Add Role</button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {Object.entries(categories).map(([category, perms]) => (
                                    <React.Fragment key={category}>
                                        {/* Category Header Row */}
                                        <tr className="bg-slate-50/30 dark:bg-slate-800/20">
                                            <td className="sticky left-0 z-10 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-sm px-6 py-3 border-r border-slate-200 dark:border-slate-700">
                                                <button
                                                    onClick={() => toggleCategory(category)}
                                                    className="flex items-center gap-3 w-full text-left"
                                                >
                                                    <span className="text-teal-500">{categoryIcons[category] || <ChevronRight size={16} />}</span>
                                                    <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">{category}</span>
                                                    <div className="ml-auto">
                                                        {expandedCategories[category] ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                                                    </div>
                                                </button>
                                            </td>
                                            <td colSpan={editableRoles.length + 1} className="px-6 py-3"></td>
                                        </tr>

                                        {/* Individual Permission Rows */}
                                        <AnimatePresence>
                                            {expandedCategories[category] && perms.map((p, pIdx) => (
                                                <motion.tr
                                                    key={p.id}
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                                                >
                                                    <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 px-6 py-4 border-r border-slate-200 dark:border-slate-700 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                                        <div className="flex flex-col">
                                                            <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300">{p.name}</span>
                                                            <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{p.description}</span>
                                                        </div>
                                                    </td>
                                                    {editableRoles.map(role => {
                                                        const val = localPermissions[role.id]?.[p.id];
                                                        // Fallback logic for old boolean permissions
                                                        const isChecked = val === true || val === 'All' || val === 'O' || val === 'A';
                                                        const isAdmin = role.name.toLowerCase() === 'admin';
                                                        const isViewPermission = p.id.endsWith('-view');

                                                        return (
                                                            <td key={role.id} className="px-6 py-4 text-center">
                                                                {isViewPermission ? (
                                                                    isAdmin ? (
                                                                        <div className="text-[11px] font-bold text-teal-600 bg-teal-500/10 py-1 px-2 rounded-md w-max mx-auto border border-teal-500/20">All</div>
                                                                    ) : (
                                                                        <Dropdown
                                                                            value={val === true ? 'All' : (val || '')}
                                                                            options={[
                                                                                { label: '-', value: '' },
                                                                                { label: 'O', value: 'O' },
                                                                                { label: 'A', value: 'A' },
                                                                                { label: 'ALL', value: 'All' }
                                                                            ]}
                                                                            onChange={(e) => {
                                                                                const newVal = e.value;
                                                                                setLocalPermissions(prev => ({
                                                                                    ...prev,
                                                                                    [role.id]: {
                                                                                        ...prev[role.id],
                                                                                        [p.id]: newVal === '' ? false : newVal
                                                                                    }
                                                                                }));
                                                                                setIsDirty(true);
                                                                            }}
                                                                            unstyled
                                                                            pt={{
                                                                                root: { className: 'inline-flex items-center w-[64px] h-[26px] mx-auto bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-teal-400 rounded-md text-[11px] font-bold outline-none transition-all cursor-pointer relative' },
                                                                                input: { className: 'flex-1 w-full text-center pl-1 text-slate-700 dark:text-slate-300 select-none' },
                                                                                trigger: { className: 'w-5 h-full flex items-center justify-center text-slate-400 border-l-2 border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50 rounded-r-md shrink-0' },
                                                                                panel: { className: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg overflow-hidden z-50 min-w-[64px]' },
                                                                                list: { className: 'py-1 flex flex-col m-0 p-0 list-none' },
                                                                                item: { className: 'text-[11px] font-bold px-2 py-1.5 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-700 dark:hover:text-teal-400 cursor-pointer text-center select-none transition-colors' }
                                                                            }}
                                                                        />
                                                                    )
                                                                ) : (
                                                                    <button
                                                                        onClick={() => togglePermission(role.id, p.id)}
                                                                        disabled={isAdmin}
                                                                        className={`w-6 h-6 mx-auto rounded-md border-2 flex items-center justify-center transition-all ${isAdmin
                                                                                ? 'bg-teal-500/10 border-teal-500/20 text-teal-600 cursor-default'
                                                                                : val
                                                                                    ? 'bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/20'
                                                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                                                                            }`}
                                                                    >
                                                                        {(isAdmin || val) && <Check size={14} strokeWidth={4} />}
                                                                    </button>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="px-6 py-4"></td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
