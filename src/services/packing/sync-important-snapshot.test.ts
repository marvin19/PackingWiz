import type { ImportantItem } from '@/domain/important-item';
import type { PackingItem } from '@/domain/packing-item';
import { isImportantSnapshotStale } from '@/domain/important-snapshot';
import { syncTripImportantSnapshot } from '@/services/packing/sync-important-snapshot';

function importantItem(id: string, name: string, enabled = true, quantity = 1): ImportantItem {
  return { id, name, quantity, enabled };
}

function importantRow(
  rowId: string,
  masterId: string,
  name: string,
  overrides: Partial<PackingItem> = {},
): PackingItem {
  return {
    id: rowId,
    name,
    quantity: 1,
    category: 'Important',
    packed: false,
    needToBuy: false,
    assignedTo: null,
    source: 'important',
    importantItemId: masterId,
    ...overrides,
  };
}

function manualRow(rowId: string, name: string, overrides: Partial<PackingItem> = {}): PackingItem {
  return {
    id: rowId,
    name,
    quantity: 2,
    category: 'Clothing',
    packed: true,
    needToBuy: false,
    assignedTo: null,
    note: 'Manual-only note',
    ...overrides,
  };
}

function listSnapshot(items: PackingItem[]) {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    packed: item.packed,
    quantity: item.quantity,
    needToBuy: item.needToBuy,
    note: item.note,
    importantItemId: item.importantItemId,
    source: item.source,
  }));
}

describe('syncTripImportantSnapshot', () => {
  it('updates enabled master Important items while preserving packed state and manual rows', () => {
    const before = [
      importantRow('row-passport', 'imp-passport', 'Passport', { packed: true, quantity: 1 }),
      importantRow('row-teddy', 'imp-teddy', 'Teddy bear', { packed: false }),
      manualRow('row-shirt', 'Me shirt', { packed: true, note: 'Do not lose' }),
    ];

    const master = [
      importantItem('imp-passport', 'Passport (renewed)', true, 1),
      importantItem('imp-sunscreen', 'Sunscreen'),
    ];

    const after = syncTripImportantSnapshot(before, master);

    expect(after.find((item) => item.id === 'row-shirt')).toEqual(before[2]);
    expect(after.find((item) => item.id === 'row-passport')).toMatchObject({
      id: 'row-passport',
      importantItemId: 'imp-passport',
      packed: true,
      name: 'Passport (renewed)',
      category: 'Important',
    });
    expect(after.some((item) => item.importantItemId === 'imp-teddy')).toBe(false);
    expect(after.some((item) => item.importantItemId === 'imp-sunscreen')).toBe(true);
    expect(after.filter((item) => item.category !== 'Important')).toHaveLength(1);
  });

  it('does not regenerate unrelated manual item ids during sync', () => {
    const before = [
      importantRow('row-passport', 'imp-passport', 'Passport'),
      manualRow('row-unique-manual', 'Socks'),
    ];
    const master = [
      importantItem('imp-passport', 'Passport'),
      importantItem('imp-hat', 'Sun hat'),
    ];

    const after = syncTripImportantSnapshot(before, master);
    const manual = after.find((item) => item.name === 'Socks');

    expect(manual?.id).toBe('row-unique-manual');
    expect(after.map((item) => item.id)).toContain('row-passport');
  });

  it('leaves historical list snapshots unchanged until explicit sync is invoked', () => {
    const historicalList = [
      importantRow('row-passport', 'imp-passport', 'Passport', { packed: true }),
      manualRow('row-coat', 'Coat'),
    ];
    const originalSnapshot = listSnapshot(historicalList);

    const initialMaster = [importantItem('imp-passport', 'Passport')];
    expect(isImportantSnapshotStale(initialMaster, historicalList)).toBe(false);

    const changedMaster = [
      importantItem('imp-passport', 'Passport'),
      importantItem('imp-med', 'Medication'),
    ];
    expect(isImportantSnapshotStale(changedMaster, historicalList)).toBe(true);
    expect(listSnapshot(historicalList)).toEqual(originalSnapshot);

    const synced = syncTripImportantSnapshot(historicalList, changedMaster);
    expect(listSnapshot(historicalList)).toEqual(originalSnapshot);
    expect(synced.some((item) => item.importantItemId === 'imp-med')).toBe(true);
  });
});

describe('syncTripImportantSnapshot multi-list isolation', () => {
  const meBefore = [
    importantRow('me-passport-row', 'imp-me-passport', 'Passport', { packed: true }),
    manualRow('me-shirt-row', 'Me shirt', { note: 'Me-only' }),
  ];
  const emilieBefore = [
    importantRow('em-teddy-row', 'imp-em-teddy', 'Teddy bear', { packed: false }),
    manualRow('em-doll-row', 'Doll', { note: 'Emilie-only' }),
  ];

  const meMasterBefore = [importantItem('imp-me-passport', 'Passport')];
  const emilieMasterBefore = [importantItem('imp-em-teddy', 'Teddy bear')];

  it('syncing Me only updates the Me snapshot and leaves Emilie byte-for-byte unchanged', () => {
    const meMasterAfter = [
      importantItem('imp-me-passport', 'Passport'),
      importantItem('imp-me-glasses', 'Glasses'),
    ];
    const emilieSnapshotBefore = listSnapshot(emilieBefore);

    const meAfter = syncTripImportantSnapshot(meBefore, meMasterAfter);

    expect(listSnapshot(emilieBefore)).toEqual(emilieSnapshotBefore);
    expect(isImportantSnapshotStale(emilieMasterBefore, emilieBefore)).toBe(false);
    expect(meAfter.some((item) => item.importantItemId === 'imp-me-glasses')).toBe(true);
    expect(meAfter.find((item) => item.id === 'me-shirt-row')?.note).toBe('Me-only');
  });

  it('syncing Emilie only updates the Emilie snapshot and leaves Me byte-for-byte unchanged', () => {
    const emilieMasterAfter = [importantItem('imp-em-medication', 'Medication')];
    const meSnapshotBefore = listSnapshot(meBefore);

    const emilieAfter = syncTripImportantSnapshot(emilieBefore, emilieMasterAfter);

    expect(listSnapshot(meBefore)).toEqual(meSnapshotBefore);
    expect(isImportantSnapshotStale(meMasterBefore, meBefore)).toBe(false);
    expect(emilieAfter.some((item) => item.importantItemId === 'imp-em-teddy')).toBe(false);
    expect(emilieAfter.some((item) => item.importantItemId === 'imp-em-medication')).toBe(true);
    expect(emilieAfter.find((item) => item.id === 'em-doll-row')?.note).toBe('Emilie-only');
  });
});
