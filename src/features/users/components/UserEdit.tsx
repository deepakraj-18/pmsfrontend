import React, { useState, useEffect } from 'react';
import { useToast } from '@/providers/ToastContext';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { TextInput } from '@/components/forms/TextInput';
import SearchableMultiSelect from '@/components/core/SearchableMultiSelect';
import { usersService } from '@/features/users/api/users.api';
import SharedCalendar from '@/components/core/SharedCalendar';
import ServerSearchDropdown from '@/components/core/ServerSearchDropdown';
import { UserAutocomplete } from '@/components/core/UserAutocomplete';
import { formatLocalDate } from '@/utils/dateHelpers';
import { FormHeader, FormField, FormCard } from '@/components/forms/Form';
import { SectionLoadingIndicator } from '@/components/feedback/Loader/SectionLoadingIndicator';
import { UserCog } from 'lucide-react';
import { useUserActions } from '../hooks/useUserActions';

export function UserEdit() {
  const { showToast } = useToast();
  const { userId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const { updateUser } = useUserActions();
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '', employee_id: '',
    job_title: '', username: '', role_id: null as any, status_id: null as any,
    manager_email: null as any, join_date: null as any,
  });

  const [selectedSkills, setSelectedSkills] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!userId) return;
        const user = await usersService.getUser(parseInt(userId, 10));
        setFormData({
          first_name: user.first_name || '', last_name: user.last_name || '', email: user.email || '',
          phone: user.phone || '', employee_id: (user as any).employee_id || '', job_title: user.job_title || '',
          username: user.username || '', role_id: user.role || null, status_id: (user as any).status || null,
          manager_email: (user as any).manager || null,
          join_date: user.join_date ? new Date(user.join_date) : null,
        });
        if (user.skills && user.skills.length > 0) {
          setSelectedSkills(user.skills);
        }
      } catch (error) { console.error('Failed to fetch data:', error); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    try {
      const extractId = (val: any) => (val && typeof val === 'object' ? val.id : val);
      const payload: any = {
        first_name: formData.first_name, last_name: formData.last_name, email: formData.email,
        phone: formData.phone || null, job_title: formData.job_title || null,
        join_date: formatLocalDate(formData.join_date),
        role_id: extractId(formData.role_id), status_id: extractId(formData.status_id),
        manager_email: formData.manager_email?.mail || formData.manager_email?.email || formData.manager_email || null,
      };
      payload.skill_ids = selectedSkills.map((s: any) => (typeof s === 'object' ? s.id : s));
      await updateUser.mutateAsync({ id: parseInt(userId, 10), data: payload });
      navigate(`/users/${userId}`);
    } catch (error: any) {
      console.error('Failed to update user:', error);
      const message = error?.response?.data?.message || error?.response?.data?.detail || 'Could not save changes.';
      showToast('error', 'Update Failed', message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const set = (field: string, val: any) => setFormData(prev => ({ ...prev, [field]: val }));

  if (loading) return <SectionLoadingIndicator fullPage label="Loading user data" />;

  return (
    <PageLayout title={`Edit User`} showBackButton backPath={`/users/${userId}`}>
      <form onSubmit={handleSubmit} className="max-w-[1200px] mx-auto">
        <FormHeader icon={UserCog} title="Edit User" subtitle="Update user profile and account settings" color="blue" />

        <FormCard columns={3} footer={{ onCancel: () => navigate(`/users/${userId}`), submitLabel: 'Save Changes', submittingLabel: 'Saving...', isSubmitting: updateUser.isPending }}>
          <FormField label="First Name" required>
            <TextInput name="first_name" value={formData.first_name} onChange={handleChange} required className="h-10" />
          </FormField>
          <FormField label="Last Name">
            <TextInput name="last_name" value={formData.last_name} onChange={handleChange} className="h-10" />
          </FormField>
          <FormField label="Email" required>
            <TextInput name="email" value={formData.email} onChange={handleChange} type="email" required className="h-10" />
          </FormField>
          <FormField label="Employee ID">
            <TextInput name="employee_id" value={formData.employee_id} readOnly className="h-10 bg-gray-100 cursor-not-allowed" />
          </FormField>
          <FormField label="Phone">
            <TextInput name="phone" value={formData.phone} onChange={handleChange} type="tel" className="h-10" />
          </FormField>
          <FormField label="Job Title">
            <TextInput name="job_title" value={formData.job_title} onChange={handleChange} className="h-10" />
          </FormField>
          <FormField label="Role">
            <ServerSearchDropdown entityType="masters/roles" value={formData.role_id} onChange={v => set('role_id', v)} placeholder="Select Role" />
          </FormField>
          <FormField label="Status">
            <ServerSearchDropdown entityType="masters/user-statuses" value={formData.status_id} onChange={v => set('status_id', v)} placeholder="Select Status" />
          </FormField>
          <FormField label="Manager">
            <UserAutocomplete value={formData.manager_email} onChange={v => set('manager_email', v)} placeholder="Search Manager" />
          </FormField>
          <FormField label="Start Date">
            <SharedCalendar value={formData.join_date} onChange={v => set('join_date', v)} />
          </FormField>
          <div>{ }</div>
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
