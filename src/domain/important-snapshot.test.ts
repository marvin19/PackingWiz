import type { ImportantItem } from '@/domain/important-item';
import type { PackingItem } from '@/domain/packing-item';
import {
  buildImportantMasterVersion,
  importantItemKey,
  isImportantSnapshotStale,
} from '@/domain/important-snapshot';
import { importantStaleNoticeKey } from '@/domain/important-profile-setup';
import {
  cloneImportantItemsConfig,
  defaultImportantItemsConfig,
} from '@/domain/important-items-config';

function importantItem(id: string, name: string, enabled = true): ImportantItem {
  return { id, name, quantity: 1, enabled };
}

function importantPackingRow(
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

/** Mirrors Pack screen stale-notice gating (pure helper under test). */
function shouldShowImportantStaleNotice(input: {
  tripId: string | null;
  listId: string | null;
  snapshotStale: boolean;
  isDismissed: (tripId: string, listId: string, masterVersion: string) => boolean;
  masterVersion: string;
}): boolean {
  if (!input.tripId || !input.listId || !input.snapshotStale) {
    return false;
  }

  return !input.isDismissed(input.tripId, input.listId, input.masterVersion);
}

describe('isImportantSnapshotStale', () => {
  const passportMaster = importantItem('imp-passport', 'Passport');
  const glassesMaster = importantItem('imp-glasses', 'Glasses');

  it('returns false when enabled master keys match the list snapshot exactly', () => {
    const master = [passportMaster, glassesMaster];
    const tripItems = [
      importantPackingRow('row-passport', 'imp-passport', 'Passport'),
      importantPackingRow('row-glasses', 'imp-glasses', 'Glasses'),
    ];

    expect(isImportantSnapshotStale(master, tripItems)).toBe(false);
  });

  it('returns true when master adds an enabled Important item', () => {
    const tripItems = [importantPackingRow('row-passport', 'imp-passport', 'Passport')];
    const master = [passportMaster, importantItem('imp-sunscreen', 'Sunscreen')];

    expect(isImportantSnapshotStale(master, tripItems)).toBe(true);
  });

  it('returns true when master disables or removes a previously snapshotted enabled item', () => {
    const tripItems = [
      importantPackingRow('row-passport', 'imp-passport', 'Passport'),
      importantPackingRow('row-teddy', 'imp-teddy', 'Teddy bear'),
    ];
    const masterWithTeddyDisabled = [
      passportMaster,
      importantItem('imp-teddy', 'Teddy bear', false),
    ];
    const masterWithoutTeddy = [passportMaster];

    expect(isImportantSnapshotStale(masterWithTeddyDisabled, tripItems)).toBe(true);
    expect(isImportantSnapshotStale(masterWithoutTeddy, tripItems)).toBe(true);
  });

  it('does not treat master quantity or display-name metadata as stale when ids match', () => {
    const tripItems = [importantPackingRow('row-passport', 'imp-passport', 'Passport', { quantity: 1 })];
    const master = [{ ...passportMaster, name: 'Passport (expedited)', quantity: 2 }];

    expect(isImportantSnapshotStale(master, tripItems)).toBe(false);
  });

  it('does not mark a list stale when a different profile master changes', () => {
    const meMaster = [passportMaster];
    const emilieMaster = [importantItem('imp-teddy', 'Teddy bear')];

    const meListItems = [importantPackingRow('row-passport', 'imp-passport', 'Passport')];
    const emilieListItems = [importantPackingRow('row-teddy', 'imp-teddy', 'Teddy bear')];

    expect(isImportantSnapshotStale(meMaster, meListItems)).toBe(false);
    expect(isImportantSnapshotStale(emilieMaster, emilieListItems)).toBe(false);

    const emilieMasterAfterAdd = [
      ...emilieMaster,
      importantItem('imp-medication', 'Medication'),
    ];

    expect(isImportantSnapshotStale(emilieMasterAfterAdd, emilieListItems)).toBe(true);
    expect(isImportantSnapshotStale(meMaster, meListItems)).toBe(false);
  });

  it('treats Important item ordering as presentation-only for stale detection', () => {
    const master = [passportMaster, glassesMaster];
    const tripItems = [
      importantPackingRow('row-glasses', 'imp-glasses', 'Glasses'),
      importantPackingRow('row-passport', 'imp-passport', 'Passport'),
    ];

    expect(isImportantSnapshotStale(master, tripItems)).toBe(false);
    expect(importantItemKey(master[0])).toBe('id:imp-passport');
  });
});

describe('Important stale notice contract', () => {
  it('shows a stale notice when the snapshot is stale and not dismissed for the current master version', () => {
    const masterVersion = buildImportantMasterVersion(
      cloneImportantItemsConfig({
        ...defaultImportantItemsConfig,
        isConfigured: true,
        isEnabled: true,
        items: [importantItem('imp-passport', 'Passport')],
        updatedAt: '2026-09-01T10:00:00.000Z',
      }),
    );

    expect(
      shouldShowImportantStaleNotice({
        tripId: 'trip-a',
        listId: 'list-me',
        snapshotStale: true,
        masterVersion,
        isDismissed: () => false,
      }),
    ).toBe(true);
  });

  it('hides the stale notice when the snapshot is fresh', () => {
    expect(
      shouldShowImportantStaleNotice({
        tripId: 'trip-a',
        listId: 'list-me',
        snapshotStale: false,
        masterVersion: 'v1',
        isDismissed: () => false,
      }),
    ).toBe(false);
  });

  it('hides the stale notice when dismissed for the current master version', () => {
    const masterVersion = '1:2026-09-01|id:imp-passport';

    expect(
      shouldShowImportantStaleNotice({
        tripId: 'trip-a',
        listId: 'list-me',
        snapshotStale: true,
        masterVersion,
        isDismissed: (tripId, listId, version) =>
          importantStaleNoticeKey(tripId, listId) === 'trip-a:list-me' && version === masterVersion,
      }),
    ).toBe(false);
  });

  it('uses list-scoped dismiss keys so Me and Emilie notices are independent', () => {
    expect(importantStaleNoticeKey('trip-a', 'list-me')).toBe('trip-a:list-me');
    expect(importantStaleNoticeKey('trip-a', 'list-emilie')).toBe('trip-a:list-emilie');
    expect(importantStaleNoticeKey('trip-a', 'list-me')).not.toBe(
      importantStaleNoticeKey('trip-a', 'list-emilie'),
    );
  });

  it('shows the notice again after master version changes even if an older version was dismissed', () => {
    const dismissedVersions = new Set(['0:2026-08-01|id:imp-passport']);
    const nextMasterVersion = buildImportantMasterVersion(
      cloneImportantItemsConfig({
        ...defaultImportantItemsConfig,
        isConfigured: true,
        isEnabled: true,
        items: [importantItem('imp-passport', 'Passport'), importantItem('imp-med', 'Medication')],
        updatedAt: '2026-09-02T10:00:00.000Z',
      }),
    );

    expect(
      shouldShowImportantStaleNotice({
        tripId: 'trip-a',
        listId: 'list-emilie',
        snapshotStale: true,
        masterVersion: nextMasterVersion,
        isDismissed: (_tripId, _listId, version) => dismissedVersions.has(version),
      }),
    ).toBe(true);
  });
});
