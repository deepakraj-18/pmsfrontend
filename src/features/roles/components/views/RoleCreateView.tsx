import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/providers/ToastContext';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { Button } from '@/components/forms/Button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { rolesService, roleSchema, RoleFormValues } from '@/features/roles/api/roles.api';
import { usersService } from '@/features/users/api/users.api';
import { UserMultiSelect } from '@/components/core/UserMultiSelect';
import { Shield } from 'lucide-react';
import { RolePermissionGrid } from '../ui/RolePermissionGrid';
import { availablePermissions, Permission } from '../../types/permissions';
import { PremiumFormHeader } from '@/components/forms/PremiumFormHeader';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { SectionDivider } from '@/components/forms/SectionDivider';
import { inputCls } from '@/components/forms/FormStyles';
import { useRoleActions } from '../../hooks/useRoleActions';

export function RoleCreateView() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { createRole } = useRoleActions();
  const [selectedUserObjects, setSelectedUserObjects] = useState<any[]>([]);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      permissions: {},
      user_ids: []
    }
  });

  const selectedPermissionsMap = (watch('permissions') || {}) as Record<string, any>;

  const onChangePermission = (id: string, value: any) => {
    const current = { ...selectedPermissionsMap };
    current[id] = value;
    setValue('permissions', current, { shouldDirty: true });
  };

  const onToggleAllInCategory = (_category: string, permissions: Permission[]) => {
    const current = { ...selectedPermissionsMap };
    const allSelected = permissions.every(p => !!current[p.id]);
    permissions.forEach(p => {
      current[p.id] = !allSelected;
    });
    setValue('permissions', current, { shouldDirty: true });
  };

  const onSubmit = async (data: RoleFormValues) => {
    try {
      const activePermissions: Record<string, any> = {};
      Object.entries(data.permissions || {}).forEach(([key, val]) => {
        if (val) activePermissions[key] = val;
      });

      await createRole.mutateAsync({
        name: data.name,
        description: data.description || '',
        permissions: activePermissions,
        user_ids: data.user_ids || []
      });

      navigate('/roles', { replace: true });
    } catch (error: any) {
      console.error('Failed to create role:', error);
      // Toast is already handled in useRoleActions onSuccess/onError
    }
  };

  const activeCount = Object.values(selectedPermissionsMap).filter(v => !!v).length;

  return (
    <PageLayout title="Create New Role" showBackButton backPath="/roles">
      <form onSubmit={handleSubmit(onSubmit as any)} className="max-w-[980px] mx-auto pb-16 px-4">

        <PremiumFormHeader
          icon={Shield}
          title="Create Role"
          subtitle="Define a new role with permissions and assign organization users"
          color="teal"
        />

        <div
          className="rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-5 mb-6"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}
        >
          <SectionDivider title="Role Details" />

          <div>
            <FieldLabel label="Role Name" required />
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <InputText
                  {...field}
                  placeholder="e.g. Project Manager"
                  className={inputCls(!!errors.name)}
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              )}
            />
            {errors.name && (
              <p className="text-[11px] mt-1 font-medium" style={{ color: 'hsl(0 70% 55%)' }}>
                {errors.name.message as string}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <FieldLabel label="Description" />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  {...field}
                  value={field.value || ''}
                  placeholder="Brief description of this role's purpose"
                  rows={1}
                  className={inputCls()}
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical' }}
                />
              )}
            />
          </div>
        </div>

        <div
          className="rounded-2xl p-6 mb-6"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <SectionDivider title="Permissions Schema" />
            <span className="text-[11px] font-black px-3 py-1 rounded-full ml-4 flex-shrink-0"
              style={{ background: 'hsl(175 70% 45% / 0.1)', color: 'hsl(175 70% 45%)' }}>
              {activeCount} / {availablePermissions.length} SELECTED
            </span>
          </div>
          <RolePermissionGrid
            permissions={selectedPermissionsMap}
            onChangePermission={onChangePermission}
            onToggleAllInCategory={onToggleAllInCategory}
          />
        </div>

        <div
          className="rounded-2xl p-6 mb-6"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}
        >
          <SectionDivider title="Assign Users" />
          <p className="text-[11px] font-bold uppercase tracking-widest mb-4 mt-2" style={{ color: 'var(--text-muted)' }}>
            Search and select users from organization
          </p>
          <Controller
            name="user_ids"
            control={control}
            render={({ field }) => (
              <UserMultiSelect
                value={selectedUserObjects}
                onChange={(selected) => {
                  setSelectedUserObjects(selected);
                  field.onChange(selected.map((u: any) => Number(u.id)));
                }}
                placeholder="Search and select users from directory..."
              />
            )}
          />
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-2">Please correct the following errors:</p>
            <ul className="list-disc list-inside text-xs text-red-600 dark:text-red-400 space-y-1">
              {Object.entries(errors).map(([key, error]: [string, any]) => (
                <li key={key}>{key}: {error.message || 'Invalid value'}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between pt-5 mt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
          <Button variant="ghost" type="button" onClick={() => navigate('/roles')}>Cancel</Button>
          <Button variant="gradient" type="submit" loading={createRole.isPending} disabled={!watch('name')?.trim()}>
            {createRole.isPending ? 'Creating…' : 'Create Role'}
          </Button>
        </div>
      </form>
    </PageLayout>
  );
}
