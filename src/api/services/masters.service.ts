import { api } from '@/api/client';
import type { MasterItem } from '@/features/masters/types/master.types';

export { type MasterItem };

export const mastersApi = {
    getRoles:        (): Promise<MasterItem[]> => api.get('/masters/roles').then(r => r.data),
    getSkills:       (): Promise<MasterItem[]> => api.get('/masters/skills').then(r => r.data),
    getStatuses:     (): Promise<MasterItem[]> => api.get('/masters/statuses').then(r => r.data),
    getUserStatuses: (): Promise<MasterItem[]> => api.get('/masters/user-statuses').then(r => r.data),
    getPriorities:   (): Promise<MasterItem[]> => api.get('/masters/priorities').then(r => r.data),
    getLookups:      (category: string): Promise<any[]> => api.get(`/masters/lookups/${category}`).then(r => r.data),
};
