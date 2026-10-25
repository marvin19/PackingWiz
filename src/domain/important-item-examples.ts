import type { PackingProfile } from '@/domain/packing-profile';

/** Matches `travelerRoleFromAge` in trip-draft-profiles.ts (under 18 = child). */
const CHILD_MAX_AGE_EXCLUSIVE = 18;

export type ImportantExampleKind = 'adult' | 'child' | 'neutral';

export const ADD_ANOTHER_IMPORTANT_ITEM_PLACEHOLDER = 'Add another item';

export function importantExampleKindForProfile(
  profile: Pick<PackingProfile, 'isSelf' | 'age'>,
): ImportantExampleKind {
  if (profile.isSelf) {
    return 'adult';
  }

  if (profile.age === undefined) {
    return 'neutral';
  }

  if (profile.age < CHILD_MAX_AGE_EXCLUSIVE) {
    return 'child';
  }

  return 'adult';
}

function examplesForKind(kind: ImportantExampleKind): readonly string[] {
  switch (kind) {
    case 'child':
      return ['favourite teddy', 'comfort blanket', 'medication'];
    case 'adult':
      return ['medication', 'passport', 'house keys'];
    case 'neutral':
      return ['medication', 'house keys', 'passport'];
  }
}

function capitalizeFirst(text: string): string {
  if (!text) {
    return text;
  }

  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

export function formatImportantExamplesLine(
  profile: Pick<PackingProfile, 'isSelf' | 'age'>,
): string {
  const examples = examplesForKind(importantExampleKindForProfile(profile));
  return `e.g. ${examples.join(', ')}`;
}

export function importantItemFirstRowPlaceholder(
  profile: Pick<PackingProfile, 'isSelf' | 'age'>,
): string {
  const kind = importantExampleKindForProfile(profile);
  const first = examplesForKind(kind)[0];
  return `e.g. ${capitalizeFirst(first)}`;
}
