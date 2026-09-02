import { dedupeImportantItemNames } from '@/domain/important-items-preferences';

export function normalizeImportantNameList(names: string[]): string[] {
  return dedupeImportantItemNames(names);
}

export function importantNameListsEqual(left: string[], right: string[]): boolean {
  const normalizedLeft = normalizeImportantNameList(left);
  const normalizedRight = normalizeImportantNameList(right);

  if (normalizedLeft.length !== normalizedRight.length) {
    return false;
  }

  return normalizedLeft.every((name, index) => name === normalizedRight[index]);
}

export function draftRowsFromImportantNames(names: string[]): string[] {
  const normalized = normalizeImportantNameList(names);
  return normalized.length > 0 ? normalized : [''];
}

export type ImportantWizardProfileDraftState = {
  rows: string[];
  expanded: boolean;
};

/** Preserve staged rows when rebuilding wizard draft state from canonical data. */
export function mergeImportantWizardProfileDrafts(
  current: Record<string, ImportantWizardProfileDraftState>,
  next: Record<string, ImportantWizardProfileDraftState>,
): Record<string, ImportantWizardProfileDraftState> {
  const merged = { ...next };

  for (const profileId of Object.keys(current)) {
    const existing = current[profileId];
    if (!existing || !merged[profileId]) {
      continue;
    }

    const stagedNames = normalizeImportantNameList(existing.rows);
    const canonicalNames = normalizeImportantNameList(merged[profileId].rows);
    const hasUncommittedStagedChanges =
      !importantNameListsEqual(stagedNames, canonicalNames) &&
      (canonicalNames.length === 0 ||
        stagedNames.some((name) => !canonicalNames.includes(name)));

    if (existing.expanded || hasUncommittedStagedChanges) {
      merged[profileId] = {
        ...merged[profileId],
        expanded: existing.expanded,
        rows: existing.rows,
      };
    }
  }

  return merged;
}
