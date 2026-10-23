import type { PersistedUserPreferences } from '@/domain/user-settings';

export interface UserPreferencesRepository {
  load(): Promise<PersistedUserPreferences>;
  save(preferences: PersistedUserPreferences): Promise<void>;
}
