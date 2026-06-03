import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { TextInput } from '@/components/forms/TextInput';
import SearchableMultiSelect from '@/components/core/SearchableMultiSelect';
import SharedCalendar from '@/components/core/SharedCalendar';
import ServerSearchDropdown from '@/components/core/ServerSearchDropdown';
import { UserAutocomplete } from '@/components/core/UserAutocomplete';
import { useUserActions } from '../hooks/useUserActions';
import { userSchema, UserFormValues } from '../api/users.api';
import { formatLocalDate } from '@/utils/dateHelpers';
import { FormHeader, FormField, FormCard } from '@/components/forms/Form';
import { UserPlus } from 'lucide-react';

export function UserCreate() {
  const navigate = useNavigate();
  const { createUser } = useUserActions();
  const isSubmitting = createUser.isPending;

  const { control, handleSubmit, setValue, watch, formState: { errors, isValid } } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema) as any,
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      employee_id: '',
      job_title: '',
      username: '',
      role_id: null,
      status_id: null,
      manager_email: null,
      join_date: new Date(),
    }
  });

  const [selectedSkills, setSelectedSkills] = useState<any[]>([]);

  const onSubmit = async (data: UserFormValues) => {
    try {
      const extractId = (val: any) => {
        if (!val || val === '') return null;
        return typeof val === 'object' ? val.id : val;
      };

      const payload: any = {
        ...data,
        role_id: extractId(data.role_id),
        status_id: extractId(data.status_id),
        manager_email: data.manager_email?.mail || data.manager_email?.email || data.manager_email || null,
      };

      if (!payload.username && payload.email) payload.username = payload.email.split('@')[0];

      ['phone', 'job_title'].forEach(key => {
        if (payload[key] === '') payload[key] = null;
      });

      payload.join_date = formatLocalDate(payload.join_date);
      payload.skill_ids = selectedSkills.map((s: any) => (typeof s === 'object' ? s.id : s));

      await createUser.mutateAsync(payload);
      navigate('/users');
    } catch (error: any) {
      console.error('Failed to create user', error);
    }
  };

  return (
    <PageLayout title="Create New User" showBackButton backPath="/users">
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-[1200px] mx-auto">
        <FormHeader
          icon={UserPlus}
          title="User Details"
          subtitle="Fill in the information below to add a new team member"
          color="blue"
        />

        <FormCard
          columns={3}
          footer={{
            onCancel: () => navigate('/users'),
            submitLabel: 'Create User',
            submittingLabel: 'Creating...',
            isSubmitting,
            isDisabled: !isValid
          }}
        >
          <FormField label="First Name" required error={errors.first_name}>
            <Controller
              name="first_name"
              control={control}
              render={({ field }) => (
                <TextInput {...field} placeholder="First name" className="h-10" />
              )}
            />
          </FormField>

          <FormField label="Last Name" error={errors.last_name}>
            <Controller
              name="last_name"
              control={control}
              render={({ field }) => (
                <TextInput {...field} value={field.value || ''} placeholder="Last name" className="h-10" />
              )}
            />
          </FormField>

          <FormField label="Email" required error={errors.email}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextInput {...field} type="email" placeholder="user@example.com" className="h-10" />
              )}
            />
          </FormField>

          <FormField label="Employee ID" required error={errors.employee_id}>
            <Controller
              name="employee_id"
              control={control}
              render={({ field }) => (
                <TextInput {...field} placeholder="e.g. EMP-001" className="h-10" />
              )}
            />
          </FormField>

          <FormField label="Phone" error={errors.phone}>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <TextInput {...field} value={field.value || ''} type="tel" placeholder="+1 (555) 000-0000" className="h-10" />
              )}
            />
          </FormField>

          <FormField label="Job Title" error={errors.job_title}>
            <Controller
              name="job_title"
              control={control}
              render={({ field }) => (
                <TextInput {...field} value={field.value || ''} placeholder="Job title" className="h-10" />
              )}
            />
          </FormField>

          <FormField label="Role">
            <Controller
              name="role_id"
              control={control}
              render={({ field }) => (
                <ServerSearchDropdown
                  entityType="masters/roles"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select Role"
                />
              )}
            />
          </FormField>

          <FormField label="Status">
            <Controller
              name="status_id"
              control={control}
              render={({ field }) => (
                <ServerSearchDropdown
                  entityType="masters/user-statuses"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select Status"
                />
              )}
            />
          </FormField>

          <FormField label="Manager">
            <Controller
              name="manager_email"
              control={control}
              render={({ field }) => (
                <UserAutocomplete
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Search Manager"
                />
              )}
            />
          </FormField>

          <FormField label="Start Date">
            <Controller
              name="join_date"
              control={control}
              render={({ field }) => (
                <SharedCalendar
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </FormField>

          <div />

          <FormField label="Skills & Capabilities" className="md:col-span-2 lg:col-span-3">
            <SearchableMultiSelect
              entityType="masters/skills"
              value={selectedSkills}
              onChange={setSelectedSkills}
              placeholder="Search and select skills..."
              field="name"
            />
          </FormField>
        </FormCard>
      </form>
    </PageLayout>
  );
}
