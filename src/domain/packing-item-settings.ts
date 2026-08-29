import { isImportantPackingItem } from '@/domain/important-snapshot';
import type { PackingItem } from '@/domain/packing-item';

export type PackingItemSettingsInput = {
  name: string;
  quantity: number;
  needToBuy: boolean;
  assignedTo: string | null;
  note: string;
};

export function normalizePackingItemSettingsInput(
  input: PackingItemSettingsInput,
): PackingItemSettingsInput {
  const trimmedName = input.name.trim();
  const trimmedNote = input.note.trim();

  return {
    name: trimmedName,
    quantity: Math.max(1, input.quantity),
    needToBuy: input.needToBuy,
    assignedTo: input.assignedTo,
    note: trimmedNote,
  };
}

export function hasPackingItemSettingsChanges(
  item: PackingItem,
  input: PackingItemSettingsInput,
): boolean {
  const normalized = normalizePackingItemSettingsInput(input);
  const isImportant = isImportantPackingItem(item);
  const persistedNote = item.note?.trim() ?? '';

  if (!isImportant && normalized.name !== item.name) {
    return true;
  }
  if (normalized.quantity !== item.quantity) {
    return true;
  }
  if (normalized.needToBuy !== item.needToBuy) {
    return true;
  }
  if (normalized.assignedTo !== item.assignedTo) {
    return true;
  }
  if (!isImportant && normalized.note !== persistedNote) {
    return true;
  }

  return false;
}

export function canSavePackingItemSettings(
  item: PackingItem,
  input: PackingItemSettingsInput,
): boolean {
  const normalized = normalizePackingItemSettingsInput(input);
  const isImportant = isImportantPackingItem(item);

  if (!isImportant && normalized.name.length === 0) {
    return false;
  }

  return hasPackingItemSettingsChanges(item, input);
}

export function buildPackingItemSettingsPatch(
  item: PackingItem,
  input: PackingItemSettingsInput,
): Partial<PackingItem> {
  const normalized = normalizePackingItemSettingsInput(input);
  const isImportant = isImportantPackingItem(item);
  const patch: Partial<PackingItem> = {};

  if (!isImportant && normalized.name !== item.name) {
    patch.name = normalized.name;
  }
  if (normalized.quantity !== item.quantity) {
    patch.quantity = normalized.quantity;
  }
  if (normalized.needToBuy !== item.needToBuy) {
    patch.needToBuy = normalized.needToBuy;
  }
  if (normalized.assignedTo !== item.assignedTo) {
    patch.assignedTo = normalized.assignedTo;
  }
  if (!isImportant) {
    const nextNote = normalized.note.length > 0 ? normalized.note : undefined;
    const persistedNote = item.note?.trim();
    if (nextNote !== persistedNote) {
      patch.note = nextNote;
    }
  }

  return patch;
}
