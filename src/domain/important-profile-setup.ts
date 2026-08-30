import type { ImportantItemsConfig } from '@/domain/important-items-config';
import { formatImportantUpdatedDate } from '@/domain/dates';
import type { PackingProfile } from '@/domain/packing-profile';
import {
  getImportantConfigForProfile,
  resolveImportantProfileId,
  type ImportantItemsByProfileId,
} from '@/domain/profile-important-items';

/** First-time Important onboarding — not configured and user has not dismissed the prompt. */
export function profileNeedsImportantFirstTimeSetup(config: ImportantItemsConfig): boolean {
  return !config.isConfigured && !config.promptDismissed;
}

/** Selected draft profiles that still need optional first-time Important setup. */
export function profilesNeedingImportantSetup(
  profiles: PackingProfile[],
  store: ImportantItemsByProfileId,
): PackingProfile[] {
  return profiles.filter((profile) => {
    const config = getImportantConfigForProfile(store, resolveImportantProfileId(profile));
    return profileNeedsImportantFirstTimeSetup(config);
  });
}

/** Configured profiles with saved Important items (for compact summary review). */
export function profilesWithConfiguredImportant(
  profiles: PackingProfile[],
  store: ImportantItemsByProfileId,
): { profile: PackingProfile; itemCount: number }[] {
  return profiles
    .map((profile) => {
      const config = getImportantConfigForProfile(store, resolveImportantProfileId(profile));
      if (!config.isConfigured) {
        return null;
      }

      return {
        profile,
        itemCount: config.items.length,
      };
    })
    .filter((entry): entry is { profile: PackingProfile; itemCount: number } => entry !== null);
}

export function importantStaleNoticeKey(tripId: string, listId: string): string {
  return `${tripId}:${listId}`;
}

export function importantProfileStatusLabel(config: ImportantItemsConfig): string {
  if (!config.isConfigured) {
    return 'Not configured';
  }

  if (!config.isEnabled) {
    return 'Turned off';
  }

  if (config.items.length === 0) {
    return 'No items';
  }

  return `${config.items.length} ${config.items.length === 1 ? 'item' : 'items'}`;
}

/** Compact card metadata for configured Important profiles in the wizard. */
export function importantProfileCardMetadata(config: ImportantItemsConfig): string {
  if (!config.isConfigured) {
    return 'Not configured';
  }

  if (!config.isEnabled) {
    return 'Turned off';
  }

  const count = config.items.length;
  const countLabel = count === 1 ? '1 item' : `${count} items`;

  if (count === 0) {
    return 'No items';
  }

  if (config.updatedAt) {
    const updated = formatImportantUpdatedDate(config.updatedAt);
    return updated ? `${countLabel} · Updated ${updated}` : countLabel;
  }

  return countLabel;
}

/** Unconfigured profiles first, then configured — preserves selected-trip order within each group. */
export function sortProfilesForImportantWizardStep(
  profiles: PackingProfile[],
  store: ImportantItemsByProfileId,
): PackingProfile[] {
  const unconfigured: PackingProfile[] = [];
  const configured: PackingProfile[] = [];

  for (const profile of profiles) {
    const config = getImportantConfigForProfile(store, resolveImportantProfileId(profile));
    if (config.isConfigured) {
      configured.push(profile);
    } else {
      unconfigured.push(profile);
    }
  }

  return [...unconfigured, ...configured];
}
