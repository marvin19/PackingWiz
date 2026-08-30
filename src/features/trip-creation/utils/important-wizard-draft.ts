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
