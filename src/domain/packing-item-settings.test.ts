import {
  buildPackingItemSettingsPatch,
  hasPackingItemSettingsChanges,
} from '@/domain/packing-item-settings';
import type { PackingItem } from '@/domain/packing-item';

const regularItem: PackingItem = {
  id: 'item-1',
  name: 'Joggesko',
  quantity: 1,
  category: 'Uncategorized',
  packed: false,
  needToBuy: false,
  assignedTo: null,
  note: 'Blue pair',
  source: 'generated',
};

const importantItem: PackingItem = {
  id: 'item-important',
  name: 'EpiPen',
  quantity: 1,
  category: 'Important',
  packed: false,
  needToBuy: false,
  assignedTo: null,
  source: 'important',
  importantItemId: 'imp-1',
};

describe('buildPackingItemSettingsPatch', () => {
  it('includes category when changed for regular items', () => {
    const patch = buildPackingItemSettingsPatch(regularItem, {
      name: 'Joggesko',
      quantity: 1,
      needToBuy: false,
      assignedTo: null,
      note: 'Blue pair',
      category: 'Shoes',
    });

    expect(patch).toEqual({ category: 'Shoes' });
  });

  it('omits category when unchanged', () => {
    const patch = buildPackingItemSettingsPatch(regularItem, {
      name: 'Joggesko',
      quantity: 2,
      needToBuy: false,
      assignedTo: null,
      note: 'Blue pair',
      category: 'Uncategorized',
    });

    expect(patch).toEqual({ quantity: 2 });
    expect(patch.category).toBeUndefined();
  });

  it('preserves unrelated fields in the patch contract', () => {
    const patch = buildPackingItemSettingsPatch(regularItem, {
      name: 'Running shoes',
      quantity: 1,
      needToBuy: true,
      assignedTo: null,
      note: '',
      category: 'Shoes',
    });

    expect(patch).toEqual({
      name: 'Running shoes',
      needToBuy: true,
      note: undefined,
      category: 'Shoes',
    });
  });

  it('does not allow category or quantity changes for Important items', () => {
    const patch = buildPackingItemSettingsPatch(importantItem, {
      name: 'EpiPen',
      quantity: 2,
      needToBuy: false,
      assignedTo: null,
      note: '',
      category: 'Essentials',
    });

    expect(patch).toEqual({});
    expect(patch.category).toBeUndefined();
    expect(patch.quantity).toBeUndefined();
  });

  it('allows needToBuy changes for Important items', () => {
    const patch = buildPackingItemSettingsPatch(importantItem, {
      name: 'EpiPen',
      quantity: 1,
      needToBuy: true,
      assignedTo: null,
      note: '',
      category: 'Important',
    });

    expect(patch).toEqual({ needToBuy: true });
  });
});

describe('hasPackingItemSettingsChanges', () => {
  it('detects category changes for regular items', () => {
    expect(
      hasPackingItemSettingsChanges(regularItem, {
        name: 'Joggesko',
        quantity: 1,
        needToBuy: false,
        assignedTo: null,
        note: 'Blue pair',
        category: 'Shoes',
      }),
    ).toBe(true);
  });

  it('detects quantity changes for regular items', () => {
    expect(
      hasPackingItemSettingsChanges(regularItem, {
        name: 'Joggesko',
        quantity: 3,
        needToBuy: false,
        assignedTo: null,
        note: 'Blue pair',
        category: 'Uncategorized',
      }),
    ).toBe(true);
  });

  it('ignores category-only changes for Important items', () => {
    expect(
      hasPackingItemSettingsChanges(importantItem, {
        name: 'EpiPen',
        quantity: 1,
        needToBuy: false,
        assignedTo: null,
        note: '',
        category: 'Essentials',
      }),
    ).toBe(false);
  });

  it('ignores quantity-only changes for Important items', () => {
    expect(
      hasPackingItemSettingsChanges(importantItem, {
        name: 'EpiPen',
        quantity: 3,
        needToBuy: false,
        assignedTo: null,
        note: '',
        category: 'Important',
      }),
    ).toBe(false);
  });

  it('detects needToBuy changes for Important items', () => {
    expect(
      hasPackingItemSettingsChanges(importantItem, {
        name: 'EpiPen',
        quantity: 1,
        needToBuy: true,
        assignedTo: null,
        note: '',
        category: 'Important',
      }),
    ).toBe(true);
  });
});
