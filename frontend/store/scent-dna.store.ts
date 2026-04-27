import { create } from 'zustand';
import { aiPreferencesService, UserAiPreference } from '@/services/ai-preferences.service';

interface ScentDNAState {
  preferences: UserAiPreference | null;
  loading: boolean;
  error: string | null;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (dto: Partial<Omit<UserAiPreference, 'userId'>>) => Promise<void>;
  resetPreferences: () => Promise<void>;
}

export const useScentDNAStore = create<ScentDNAState>((set) => ({
  preferences: null,
  loading: false,
  error: null,

  fetchPreferences: async () => {
    set({ loading: true, error: null });
    try {
      const prefs = await aiPreferencesService.getPreferences();
      set({ preferences: prefs, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch preferences', loading: false });
    }
  },

  updatePreferences: async (dto) => {
    set({ loading: true, error: null });
    try {
      const prefs = await aiPreferencesService.updatePreferences(dto);
      set({ preferences: prefs, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to update preferences', loading: false });
    }
  },

  resetPreferences: async () => {
    set({ loading: true, error: null });
    try {
      const prefs = await aiPreferencesService.resetPreferences();
      set({ preferences: prefs, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to reset preferences', loading: false });
    }
  },
}));
