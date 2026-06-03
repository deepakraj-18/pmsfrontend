import React, { useState } from 'react';
import { useToast } from '@/providers/ToastContext';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { TextInput } from '@/components/forms/TextInput';
import { TextAreaInput } from '@/components/forms/TextAreaInput';
import { FormHeader, FormField, FormCard } from '@/components/forms/Form';
import { teamsService } from '@/features/teams/api/teams.api';
import { UserAutocomplete } from '@/components/core/UserAutocomplete';
import { UserMultiSelect } from '@/components/core/UserMultiSelect';
import { Users } from 'lucide-react';

export function TeamCreate() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    team_email: '',
    description: '',
    team_type: '',
    max_team_size: '',
    budget_allocation: '',
    primary_communication_channel: '',
    channel_id: '',
    lead_email: null as any,
  });

  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const extractId = (val: any) => (val && typeof val === 'object' ? val.id : val);
      const extractEmail = (val: any) => (val && typeof val === 'object' ? val.email : val);
      const payload: any = { ...formData };
      payload.lead_email = payload.lead_email?.mail || payload.lead_email?.email || payload.lead_email || null;
      if (payload.max_team_size === '') payload.max_team_size = null;
      else payload.max_team_size = parseInt(payload.max_team_size, 10);

      ['description', 'team_type', 'primary_communication_channel', 'channel_id'].forEach(key => {
        if (payload[key] === '') payload[key] = null;
      });

      payload.budget_allocation = payload.budget_allocation === '' ? 0 : parseFloat(payload.budget_allocation);

      payload.member_emails = selectedMembers.map((u: any) => u.mail || u.email || null).filter(Boolean);

      await teamsService.createTeam(payload);
      navigate('/teams');
    } catch (error: any) {
      console.error('Failed to create team:', error);
      showToast('error', 'Notification', error.response?.data?.detail || 'Failed to create team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const set = (field: string, val: any) => setFormData(prev => ({ ...prev, [field]: val }));

  return (
    <PageLayout title="Create New Team" showBackButton backPath="/teams">
      <form onSubmit={handleSubmit} className="max-w-[1200px] mx-auto">
        <FormHeader icon={Users} title="Team Information" subtitle="Configure your new team and add members" color="cyan" />

        <FormCard columns={3} className="mb-5">
          <FormField label="Team Name" required>
            <TextInput name="name" value={formData.name} onChange={handleChange} placeholder="Enter team name" required className="h-10" />
          </FormField>

          <FormField label="Team Email" required>
            <TextInput name="team_email" value={formData.team_email} onChange={handleChange} type="email" placeholder="team@example.com" required className="h-10" />
          </FormField>

          <FormField label="Team Lead">
            <UserAutocomplete value={formData.lead_email} onChange={v => set('lead_email', v)} placeholder="Search team lead" />
          </FormField>

          <FormField label="Max Team Size">
            <TextInput name="max_team_size" type="number" min="1" value={formData.max_team_size} onChange={handleChange} placeholder="e.g. 10" className="h-10" />
          </FormField>

          <FormField label="Budget Allocation">
            <TextInput name="budget_allocation" type="number" step="0.01" min="0" value={formData.budget_allocation} onChange={handleChange} placeholder="0.00" className="h-10" />
          </FormField>

          <FormField label="Description" className="md:col-span-2 lg:col-span-3">
            <TextAreaInput name="description" value={formData.description} onChange={handleChange} placeholder="Describe the team's purpose" rows={2} />
          </FormField>
        </FormCard>

        <FormCard columns={2} footer={{ onCancel: () => navigate('/teams'), submitLabel: 'Create Team', submittingLabel: 'Creating...', isSubmitting, isDisabled: !formData.name.trim() }} sectionTitle="Team Members">
          <div className="md:col-span-2">
            <p className="text-xs text-slate-500 mb-3">Search and select users to add as members of this team</p>
            <UserMultiSelect
              value={selectedMembers}
              onChange={setSelectedMembers}
              placeholder="Search users..."
            />
          </div>
        </FormCard>
      </form>
    </PageLayout>
  );
}
