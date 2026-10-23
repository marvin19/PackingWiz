import { defaultPersistedUserPreferences, type PersistedUserPreferences } from '@/domain/user-settings';

import type { UserPreferencesRepository } from '@/repositories/preferences/user-preferences-repository';

/** Session-only preferences store for mock persistence mode. */
export class MockUserPreferencesRepository implements UserPreferencesRepository {
  private preferences: PersistedUserPreferences = { ...defaultPersistedUserPreferences };

  async load(): Promise<PersistedUserPreferences> {
    return { ...this.preferences };
  }

  async save(preferences: PersistedUserPreferences): Promise<void> {
    this.preferences = { ...preferences };
  }
}

export const mockUserPreferencesRepository = new MockUserPreferencesRepository();
