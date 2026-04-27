import api from '@/lib/axios';

export interface UserAiPreference {
  userId: string;
  riskLevel: number;
  preferredNotes: string[];
  avoidedNotes: string[];
}

export const aiPreferencesService = {
  getPreferences() {
    return api.get<UserAiPreference>('/ai-preferences').then((r) => r.data);
  },
  updatePreferences(dto: Partial<Omit<UserAiPreference, 'userId'>>) {
    return api.patch<UserAiPreference>('/ai-preferences', dto).then((r) => r.data);
  },
  resetPreferences() {
    return api.patch<UserAiPreference>('/ai-preferences/reset').then((r) => r.data);
  },
};
