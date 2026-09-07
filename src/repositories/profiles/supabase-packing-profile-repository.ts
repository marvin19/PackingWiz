import type { ImportantItemsConfig } from '@/domain/important-items-config';
import {
  cloneImportantItemsConfig,
  defaultImportantItemsConfig,
} from '@/domain/important-items-config';
import {
  normalizeImportantProfileId,
  SELF_IMPORTANT_PROFILE_ID,
  type ImportantItemsByProfileId,
} from '@/domain/profile-important-items';
import type { PackingProfile } from '@/domain/packing-profile';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { PackingProfileRepository } from '@/repositories/profiles/packing-profile-repository';
import {
  isPersistablePackingProfileId,
  mapDbImportantMasterToConfig,
  mapDbPackingProfileRow,
  mapImportantConfigToDbRows,
  mapPackingProfileToDbRow,
} from '@/repositories/trips/mappers/supabase-canonical-mapper';
import type {
  DbImportantProfileConfigRow,
  DbImportantProfileItemRow,
  DbPackingProfileRow,
} from '@/repositories/trips/mappers/supabase-canonical-types';

export class SupabasePackingProfileRepository implements PackingProfileRepository {
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

  async loadAll(): Promise<{
    profiles: PackingProfile[];
    importantByProfileId: ImportantItemsByProfileId;
  }> {
    const userId = await this.requireUserId();

    const { data: profileRows, error: profileError } = await this.client
      .from('packing_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (profileError) {
      throw new Error(profileError.message);
    }

    const { data: configRows, error: configError } = await this.client
      .from('important_profile_configs')
      .select('*')
      .eq('user_id', userId);

    if (configError) {
      throw new Error(configError.message);
    }

    const { data: itemRows, error: itemError } = await this.client
      .from('important_profile_items')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    if (itemError) {
      throw new Error(itemError.message);
    }

    const profiles = ((profileRows ?? []) as DbPackingProfileRow[])
      .filter((row) => !row.is_self)
      .map(mapDbPackingProfileRow);

    const importantByProfileId: ImportantItemsByProfileId = {};

    for (const configRow of (configRows ?? []) as DbImportantProfileConfigRow[]) {
      const profileId = normalizeImportantProfileId(configRow.packing_profile_id);
      const itemsForProfile = ((itemRows ?? []) as DbImportantProfileItemRow[]).filter(
        (row) => row.packing_profile_id === configRow.packing_profile_id,
      );

      importantByProfileId[profileId] = mapDbImportantMasterToConfig(configRow, itemsForProfile);
    }

    if (!importantByProfileId[SELF_IMPORTANT_PROFILE_ID]) {
      importantByProfileId[SELF_IMPORTANT_PROFILE_ID] = cloneImportantItemsConfig(
        defaultImportantItemsConfig,
      );
    }

    return { profiles, importantByProfileId };
  }

  async saveProfile(profile: PackingProfile): Promise<PackingProfile> {
    if (profile.isSelf || !isPersistablePackingProfileId(profile.id)) {
      throw new Error('Only persistable non-self profiles can be saved');
    }

    const userId = await this.requireUserId();
    const row = mapPackingProfileToDbRow(userId, {
      ...profile,
      rememberForFutureTrips: undefined,
    });

    const { error } = await this.client.from('packing_profiles').upsert(row, {
      onConflict: 'user_id,id',
    });

    if (error) {
      throw new Error(error.message);
    }

    return mapDbPackingProfileRow(row);
  }

  async saveImportantMaster(profileId: string, config: ImportantItemsConfig): Promise<void> {
    const normalizedProfileId = normalizeImportantProfileId(profileId);
    if (!isPersistablePackingProfileId(normalizedProfileId)) {
      throw new Error('Draft profile Important master cannot be persisted as reusable');
    }

    const userId = await this.requireUserId();

    if (normalizedProfileId !== SELF_IMPORTANT_PROFILE_ID) {
      const { data: profileRow, error: profileReadError } = await this.client
        .from('packing_profiles')
        .select('id')
        .eq('user_id', userId)
        .eq('id', normalizedProfileId)
        .maybeSingle();

      if (profileReadError) {
        throw new Error(profileReadError.message);
      }

      if (!profileRow) {
        throw new Error(`Packing profile not found: ${normalizedProfileId}`);
      }
    } else {
      const { error: selfProfileError } = await this.client.from('packing_profiles').upsert(
        {
          user_id: userId,
          id: SELF_IMPORTANT_PROFILE_ID,
          name: 'Me',
          is_self: true,
        },
        { onConflict: 'user_id,id' },
      );

      if (selfProfileError) {
        throw new Error(selfProfileError.message);
      }
    }

    const { configRow, itemRows } = mapImportantConfigToDbRows(
      userId,
      normalizedProfileId,
      config,
    );

    const { error: configError } = await this.client
      .from('important_profile_configs')
      .upsert(configRow, { onConflict: 'user_id,packing_profile_id' });

    if (configError) {
      throw new Error(configError.message);
    }

    const { error: deleteError } = await this.client
      .from('important_profile_items')
      .delete()
      .eq('user_id', userId)
      .eq('packing_profile_id', normalizedProfileId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    if (itemRows.length > 0) {
      const { error: insertError } = await this.client
        .from('important_profile_items')
        .insert(itemRows);

      if (insertError) {
        throw new Error(insertError.message);
      }
    }
  }

  async deleteProfile(profileId: string): Promise<void> {
    const userId = await this.requireUserId();

    const { error } = await this.client
      .from('packing_profiles')
      .delete()
      .eq('user_id', userId)
      .eq('id', profileId);

    if (error) {
      throw new Error(error.message);
    }
  }
}

/** Persist remembered profile + Important master after successful trip commit. */
export async function persistRememberedProfileWithImportant(
  repository: PackingProfileRepository,
  profile: PackingProfile,
  config: ImportantItemsConfig,
): Promise<void> {
  await repository.saveProfile(profile);
  await repository.saveImportantMaster(profile.id, config);
}
