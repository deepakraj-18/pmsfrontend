import React, { useState, useEffect } from 'react';
import { useToast } from '@/providers/ToastContext';
import { useNavigate, useParams } from 'react-router-dom';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { Button } from '@/components/forms/Button';
import { TextInput } from '@/components/forms/TextInput';
import { TextAreaInput } from '@/components/forms/TextAreaInput';
import { SectionLoadingIndicator } from '@/components/feedback/Loader/SectionLoadingIndicator';
import { Trash2, Users } from 'lucide-react';
import { teamsService } from '@/features/teams/api/teams.api';
import { usersService } from '@/features/users/api/users.api';
import ServerSearchDropdown from '@/components/core/ServerSearchDropdown';
import { UserAutocomplete } from '@/components/core/UserAutocomplete';
import { UserMultiSelect } from '@/components/core/UserMultiSelect';
import { FormHeader, FormField, FormCard } from '@/components/forms/Form';

export function TeamEdit() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { teamId } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '', team_email: '', description: '', team_type: '',
    max_team_size: '', budget_allocation: '', primary_communication_channel: '',
    channel_id: '', lead_email: null as any,
  });

  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!teamId) return;
        const team = await teamsService.getTeam(parseInt(teamId, 10));
        setFormData({
          name: team.name || '', team_email: team.team_email || '', description: team.description || '',
          team_type: team.team_type || '', max_team_size: team.max_team_size?.toString() || '',
          budget_allocation: team.budget_allocation?.toString() || '', primary_communication_channel: team.primary_communication_channel || '',
          channel_id: team.channel_id || '', lead_email: team.lead || team.lead_email || null,
        });
        if (team.members) setSelectedMembers(team.members);
      } catch (error) { console.error('Failed to fetch team data:', error); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [teamId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId) return;
    setSubmitting(true);
    try {
      const extractId = (val: any) => (val && typeof val === 'object' ? val.id : val);
      const extractEmail = (val: any) => (val && typeof val === 'object' ? val.email : val);
      const payload: any = { ...formData };
      payload.lead_email = payload.lead_email?.mail || payload.lead_email?.email || payload.lead_email || null;
      if (payload.max_team_size === '') payload.max_team_size = null;
      else payload.max_team_size = parseInt(payload.max_team_size, 10);
      ['description', 'team_type', 'primary_communication_channel', 'channel_id'].forEach(key => { if (payload[key] === '') payload[key] = null; });
      payload.budget_allocation = payload.budget_allocation === '' ? 0 : parseFloat(payload.budget_allocation);
      payload.member_emails = selectedMembers.map((m: any) => m.mail || m.email || null).filter(Boolean);
      await teamsService.updateTeam(parseInt(teamId, 10), payload);
      navigate(`/teams/${teamId}`);
    } catch (error: any) {
      console.error('Failed to update team:', error);
      showToast('error', 'Notification', error.response?.data?.detail || 'Failed to update team');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    try {
      await teamsService.deleteTeam(parseInt(teamId!, 10));
      navigate('/teams');
    } catch { showToast('error', 'Error', 'Failed to delete team.'); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const set = (field: string, val: any) => setFormData(prev => ({ ...prev, [field]: val }));

  if (loading) return <SectionLoadingIndicator fullPage label="Loading team data" />;

  return (
    <PageLayout
      title={`Edit Team`}
      showBackButton backPath={`/teams/${teamId}`}
      actions={<Button variant="danger" type="Button" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" />Delete Team</Button>}
    >
      <form onSubmit={handleSubmit} className="max-w-[1200px] mx-auto">
        <FormHeader icon={Users} title="Edit Team" subtitle="Update team details and manage members" color="cyan" />

        <FormCard columns={3} className="mb-5">
          <FormField label="Team Name" required>
            <TextInput name="name" value={formData.name} onChange={handleChange} required className="h-10" />
          </FormField>
          <FormField label="Team Email" required>
            <TextInput name="team_email" value={formData.team_email} onChange={handleChange} type="email" required className="h-10" />
          </FormField>
          <FormField label="Team Lead">
            <UserAutocomplete value={formData.lead_email} onChange={v => set('lead_email', v)} placeholder="Search team lead" />
          </FormField>
          <FormField label="Max Team Size">
            <TextInput name="max_team_size" type="number" min="1" value={formData.max_team_size} onChange={handleChange} className="h-10" />
          </FormField>
          <FormField label="Budget Allocation">
            <TextInput name="budget_allocation" type="number" step="0.01" min="0" value={formData.budget_allocation} onChange={handleChange} className="h-10" />
          </FormField>
          <FormField label="Description" className="md:col-span-2 lg:col-span-3">
            <TextAreaInput name="description" value={formData.description} onChange={handleChange} rows={2} />
          </FormField>
        </FormCard>

        <FormCard columns={2} sectionTitle="Team Members" footer={{ onCancel: () => navigate(`/teams/${teamId}`), submitLabel: 'Save Changes', submittingLabel: 'Saving...', isSubmitting: submitting }}>
          <div className="md:col-span-2">
            <p className="text-xs text-slate-500 mb-3">Select users to add to this team</p>
            <UserMultiSelect
              value={selectedMembers}
              onChange={setSelectedMembers}
              placeholder="Search and select members..."
            />
          </div>
        </FormCard>
      </form>
    </PageLayout>
  );
}
