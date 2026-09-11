import type { PersistedUserPreferences } from '@/domain/user-settings';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  mapUserPreferencesToDbRow,
  normalizeLoadedUserPreferences,
  type DbUserPreferencesRow,
} from '@/repositories/preferences/user-preferences-mapper';
import type { UserPreferencesRepository } from '@/repositories/preferences/user-preferences-repository';

export class SupabaseUserPreferencesRepository implements UserPreferencesRepository {
  constructor(private readonly client: SupabaseClient) {}

  private async requireUserId(): Promise<string> {
    const { data, error } = await this.client.auth.getUser();
    if (error) {
      throw new Error(error.message);
    }

    const userId = data.user?.id;
    if (!userId) {
      throw new Error('Not authenticated');
    }

    return userId;
  }

  async load(): Promise<PersistedUserPreferences> {
    const userId = await this.requireUserId();

    const { data, error } = await this.client
      .from('user_preferences')
      .select('user_id, smart_quantities, metric_units')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return normalizeLoadedUserPreferences((data as DbUserPreferencesRow | null) ?? null);
  }

  async save(preferences: PersistedUserPreferences): Promise<void> {
    const userId = await this.requireUserId();
    const row = mapUserPreferencesToDbRow(userId, preferences);

    const { error } = await this.client.from('user_preferences').upsert(row, {
      onConflict: 'user_id',
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}
