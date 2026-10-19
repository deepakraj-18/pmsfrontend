import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/providers/ToastContext';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { Button } from '@/components/forms/Button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { SectionLoadingIndicator } from '@/components/feedback/Loader/SectionLoadingIndicator';
import { Trash2, Shield, UserCheck } from 'lucide-react';
import { rolesService, roleSchema, RoleFormValues } from '@/features/roles/api/roles.api';
import { usersService } from '@/features/users/api/users.api';
import { UserMultiSelect } from '@/components/core/UserMultiSelect';
import { FormField } from '@/components/forms/FormField';
import { RolePermissionGrid } from '../ui/RolePermissionGrid';
import { availablePermissions, Permission } from '../../types/permissions';
import { PremiumFormHeader } from '@/components/forms/PremiumFormHeader';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { SectionDivider } from '@/components/forms/SectionDivider';
import { inputCls } from '@/components/forms/FormStyles';
import { ROLES } from '@/utils/permissions';
import { useRoleActions } from '../../hooks/useRoleActions';

export function RoleEditView() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { roleId } = useParams();

  const [loading, setLoading] = useState(true);
  const { updateRole, deleteRole } = useRoleActions();
  const [roleName, setRoleName] = useState('');
  const [selectedUserObjects, setSelectedUserObjects] = useState<any[]>([]);

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      permissions: {},
      user_ids: []
    }
  });

  const selectedPermissionsMap = (watch('permissions') || {}) as Record<string, any>;

  useEffect(() => {
    const fetchData = async () => {
      if (!roleId) return;
      try {
        const role = await rolesService.getRole(parseInt(roleId, 10));

        setRoleName(role.name);
        setSelectedUserObjects(role.users || []);

        const permsMap: Record<string, any> = {};
        if (role.permissions) {
          Object.entries(role.permissions).forEach(([key, val]) => {
            permsMap[key] = val;
          });
        }

        reset({
          name: role.name || '',
          description: role.description || '',
          permissions: permsMap,
          user_ids: role.users ? role.users.map((u: any) => u.id) : []
        });
      } catch (error) {
        console.error('Failed to load role:', error);
        showToast('error', 'Error', 'Failed to load role data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [roleId, reset, showToast]);

  const onChangePermission = (id: string, value: any) => {
    const current = { ...selectedPermissionsMap };
    current[id] = value;
    setValue('permissions', current, { shouldDirty: true });
  };

  const onToggleAllInCategory = (category: string, permissions: Permission[]) => {
    const current = { ...selectedPermissionsMap };
    const allSelected = permissions.every(p => !!current[p.id]);
    permissions.forEach(p => {
      current[p.id] = !allSelected;
    });
    setValue('permissions', current, { shouldDirty: true });
  };

  const onSubmit = async (data: RoleFormValues) => {
    if (!roleId) return;
    try {
      await updateRole.mutateAsync({
        id: parseInt(roleId, 10),
        data: {
          name: data.name,
          description: data.description,
          permissions: data.permissions,
          user_ids: data.user_ids
        }
      });
      
      if (location.state?.fromDetail) {
        navigate(-1);
      } else {
        navigate(`/roles/${roleId}`, { replace: true });
      }
    } catch (error: any) {
      console.error('Failed to update role:', error);
    }
  };

  const handleDelete = async () => {
    if (!roleId) return;
    try {
      await deleteRole.mutateAsync(parseInt(roleId, 10));
      navigate('/roles');
    } catch (error) {
      console.error('Failed to delete role:', error);
    }
  };

  if (loading) return <SectionLoadingIndicator fullPage label="Loading role configuration..." />;

  return (
    <PageLayout
      title={`Edit Role: ${roleName}`}
      showBackButton
      actions={<Button variant="danger" type="button" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" />Delete Role</Button>}
    >
      <form onSubmit={handleSubmit(onSubmit as any)} className="max-w-[980px] mx-auto pb-16 px-4">

        <PremiumFormHeader
          icon={Shield}
          title="Edit Role"
          subtitle={`Modify configuration for the ${roleName} role`}
          color="indigo"
        />

        { }
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
                  placeholder="Enter role name"
                  className={inputCls()}
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              )}
            />
          </div>

          <div>
            <FieldLabel label="Role ID" />
            <InputText
              value={roleId}
              disabled
              className={inputCls()}
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', fontFamily: 'monospace', opacity: 0.7 }}
            />
          </div>

          <div className="md:col-span-3">
            <FieldLabel label="Description" />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  {...field}
                  value={field.value || ''}
                  placeholder="Update role description"
                  rows={2}
                  className={inputCls()}
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical' }}
                />
              )}
            />
          </div>
        </div>

        { }
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <SectionDivider title="Permissions Schema" />
            <span className="text-[11px] font-black px-3 py-1 rounded-full ml-4 flex-shrink-0"
              style={{ background: 'hsl(230 80% 60% / 0.1)', color: 'hsl(230 80% 60%)' }}>
              {Object.values(selectedPermissionsMap).filter(v => !!v).length} / {availablePermissions.length} SELECTED
            </span>
          </div>
          <RolePermissionGrid
            permissions={selectedPermissionsMap}
            onChangePermission={onChangePermission}
            onToggleAllInCategory={onToggleAllInCategory}
          />
        </div>

        { }
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}
        >
          <SectionDivider title="Assigned Userbase" />
          <div className="flex items-center gap-2 mb-4 mt-2 text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            <UserCheck className="w-3.5 h-3.5" /> Direct assignments to this role
          </div>
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
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>Cancel</Button>
          <Button variant="gradient" type="submit" loading={updateRole.isPending} disabled={!watch('name')?.trim()}>
            {updateRole.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </PageLayout>
  );
}
