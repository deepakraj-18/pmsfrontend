import { api } from '@/api/client';

export interface Team {
    id: number;
    public_id: string;
    name: string;
    team_email: string;
    budget_allocation: number;
    description: string | null;
    team_type: string | null;
    max_team_size: number | null;
    primary_communication_channel: string | null;
    channel_id: string | null;
    lead_id: number | null;
    lead_email: string | null;
    lead?: { first_name: string; last_name: string; email: string };
    created_at: string;
    updated_at: string;
    members?: any[];
    member_emails?: string[];
    members_count: number;
}

export const teamsService = {
    getTeams: async (skip = 0, limit = 100): Promise<Team[]> => {
        const { data } = await api.get('/teams/', { params: { skip, limit } });
        return data;
    },

    getTeam: async (teamId: number): Promise<Team> => {
        const { data } = await api.get(`/teams/${teamId}`);
        return data;
    },

    createTeam: async (payload: any): Promise<Team> => {
        const { data } = await api.post('/teams/', payload);
        return data;
    },

    updateTeam: async (teamId: number, payload: any): Promise<Team> => {
        const { data } = await api.put(`/teams/${teamId}`, payload);
        return data;
    },

    deleteTeam: async (teamId: number): Promise<void> => {
        await api.delete(`/teams/${teamId}`);
    },
};
