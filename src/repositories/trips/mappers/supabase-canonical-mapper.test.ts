import type { ImportantItemsConfig } from '@/domain/important-items-config';
import type { PackingItem } from '@/domain/packing-item';
import type { Traveler } from '@/domain/traveler';
import {
  normalizeTrip,
  primaryPackingListId,
  primaryPackingProfileId,
} from '@/domain/trip-compatibility';
import { mockLisbonTrip, mockMallorcaTrip } from '@/mocks/seed-trips';

import {
  buildLegacyFlatTripCompatibilityList,
  compatibilityPrimaryListIdForTrip,
  groupPackingItemsByListId,
  isPersistablePackingProfileId,
  mapCanonicalTripToDbWrites,
  mapDbAggregateToCanonicalTrip,
  mapDbCanonicalPackingItemRow,
  mapImportantConfigToDbRows,
  mapPackingItemToDbRow,
  packingListIdsForTripDelete,
  profileSnapshotToJson,
} from '@/repositories/trips/mappers/supabase-canonical-mapper';
import type {
  DbCanonicalPackingItemRow,
  DbCanonicalTripAggregate,
  DbPackingListRow,
} from '@/repositories/trips/mappers/supabase-canonical-types';

describe('supabase-canonical-mapper', () => {
  describe('A. canonical single-list generated trip', () => {
    it('round-trips a single generated list through DB write mapping', () => {
      const trip = mockMallorcaTrip;
      const { packingLists, packingItems } = mapCanonicalTripToDbWrites(trip);

      expect(packingLists).toHaveLength(1);
      expect(packingLists[0].packing_mode).toBe('generated');
      expect(packingItems.every((row) => row.packing_list_id === packingLists[0].id)).toBe(true);
    });
  });

  describe('B. canonical multi-list trip with mixed generated/manual modes', () => {
    it('preserves per-list packingMode and list ids', () => {
      const { packingLists } = mapCanonicalTripToDbWrites(mockLisbonTrip);

      expect(packingLists).toHaveLength(2);
      expect(packingLists[0].packing_mode).toBe('generated');
      expect(packingLists[1].packing_mode).toBe('manual');
      expect(new Set(packingLists.map((list) => list.id)).size).toBe(2);
    });
  });

  describe('C. profile snapshots remain list-owned', () => {
    it('embeds independent snapshots per list', () => {
      const { packingLists } = mapCanonicalTripToDbWrites(mockLisbonTrip);
      const emilieList = packingLists.find((list) => list.id === 'lisbon-list-emilie');

      expect(emilieList?.profile_snapshot).toEqual({
        id: 'profile-emilie',
        name: 'Emilie',
        age: 8,
        isSelf: false,
      });
      expect(emilieList?.packing_profile_id).toBe('profile-emilie');
    });
  });

  describe('D. Important snapshot link survives persistence mapping', () => {
    it('persists source and importantItemId on list items', () => {
      const importantItem = mockLisbonTrip.packingLists[0].items.find(
        (item) => item.category === 'Important',
      );

      expect(importantItem?.source).toBe('important');
      expect(importantItem?.importantItemId).toBe('imp-passport');

      const row = mapPackingItemToDbRow(
        mockLisbonTrip.id,
        mockLisbonTrip.packingLists[0].id,
        importantItem!,
        0,
      );

      expect(row.source).toBe('important');
      expect(row.important_item_id).toBe('imp-passport');

      const roundTrip = mapDbCanonicalPackingItemRow(row);
      expect(roundTrip.importantItemId).toBe('imp-passport');
      expect(roundTrip.source).toBe('important');
    });
  });

  describe('E. reusable Important master remains separate from list snapshot', () => {
    it('maps Important master to profile-scoped tables', () => {
      const config: ImportantItemsConfig = {
        items: [{ id: 'imp-passport', name: 'Passport', quantity: 1, enabled: true }],
        isConfigured: true,
        isEnabled: true,
        promptDismissed: false,
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      const { configRow, itemRows } = mapImportantConfigToDbRows(
        'user-1',
        'profile-self',
        config,
      );

      expect(configRow.packing_profile_id).toBe('profile-self');
      expect(itemRows).toHaveLength(1);
      expect(itemRows[0].id).toBe('imp-passport');

      const listRow = mapPackingItemToDbRow('trip-1', 'list-1', {
        id: 'item-1',
        name: 'Passport',
        quantity: 1,
        category: 'Important',
        packed: false,
        needToBuy: false,
        assignedTo: null,
        source: 'important',
        importantItemId: 'imp-passport',
      }, 0);

      expect(listRow.important_item_id).toBe('imp-passport');
      expect(listRow.packing_list_id).toBe('list-1');
      expect(itemRows[0].packing_profile_id).toBe('profile-self');
    });
  });

  describe('F. deleting/replacing one list cannot imply deletion of reusable profile', () => {
    it('trip delete scope includes list ids only, not profile ids from snapshots', () => {
      const listIds = packingListIdsForTripDelete(mockLisbonTrip);

      expect(listIds).toContain('lisbon-list-emilie');
      expect(listIds).not.toContain('profile-emilie');
    });

    it('rejects draft profile ids for reusable persistence', () => {
      expect(isPersistablePackingProfileId('profile-emilie')).toBe(true);
      expect(isPersistablePackingProfileId('draft-profile-temp')).toBe(false);
    });
  });

  describe('G. legacy single-list mapping produces exactly one PackingList', () => {
    it('case A: explicit self traveler (t-you / You) preserves name and compatibility ids', () => {
      const travelers: Traveler[] = [{ id: 't-you', name: 'You', role: 'Adult', age: 30 }];
      const items: PackingItem[] = [
        {
          id: 'item-1',
          name: 'Shirt',
          quantity: 1,
          category: 'Clothing',
          packed: false,
          needToBuy: false,
          assignedTo: 't-you',
        },
      ];

      const list = buildLegacyFlatTripCompatibilityList({
        tripId: 'trip-uuid',
        travelers,
        packingMode: 'generated',
        items,
      });

      expect(list.id).toBe(primaryPackingListId('trip-uuid'));
      expect(list.packingProfileId).toBe(primaryPackingProfileId('trip-uuid'));
      expect(list.profileSnapshot).toMatchObject({
        id: primaryPackingProfileId('trip-uuid'),
        name: 'You',
        age: 30,
        isSelf: true,
      });
      expect(list.packingProfileId).toBe(list.profileSnapshot.id);
      expect(list.items).toHaveLength(1);
    });

    it('case B: sole non-self traveler is not promoted to primary identity', () => {
      const list = buildLegacyFlatTripCompatibilityList({
        tripId: 'trip-uuid',
        travelers: [{ id: 't-anna', name: 'Anna', role: 'Adult' }],
        packingMode: 'manual',
        items: [],
      });

      expect(list.profileSnapshot.name).toBe('Me');
      expect(list.profileSnapshot.isSelf).toBe(true);
      expect(list.packingProfileId).toBe(primaryPackingProfileId('trip-uuid'));
    });

    it('case C: no travelers → synthetic Me', () => {
      const list = buildLegacyFlatTripCompatibilityList({
        tripId: 'trip-uuid',
        travelers: [],
        packingMode: 'manual',
        items: [],
      });

      expect(list.profileSnapshot).toEqual({
        id: primaryPackingProfileId('trip-uuid'),
        name: 'Me',
        isSelf: true,
      });
    });

    it('case D: additional travelers do not create extra lists', () => {
      const list = buildLegacyFlatTripCompatibilityList({
        tripId: 'trip-uuid',
        travelers: [
          { id: 't-you', name: 'You', role: 'Adult' },
          { id: 't-emilie', name: 'Emilie', role: 'Child', age: 8 },
        ],
        packingMode: 'generated',
        items: [{ id: 'i1', name: 'Shirt', quantity: 1, category: 'Clothing', packed: false, needToBuy: false, assignedTo: null }],
      });

      expect(list.id).toBe(primaryPackingListId('trip-uuid'));
      expect(list.items).toHaveLength(1);
    });
  });

  describe('H. non-first/primary compatibility assumptions do not leak into canonical model', () => {
    it('multi-list aggregate load preserves non-primary list order and ids', () => {
      const writes = mapCanonicalTripToDbWrites(mockLisbonTrip);
      const aggregate: DbCanonicalTripAggregate = {
        trip: {
          id: mockLisbonTrip.id,
          user_id: 'user-1',
          title: mockLisbonTrip.name,
          destination: 'Lisbon',
          country: 'Portugal',
          start_date: mockLisbonTrip.startDate,
          end_date: mockLisbonTrip.endDate,
          accommodation: mockLisbonTrip.accommodation,
          laundry: mockLisbonTrip.laundry,
          note: mockLisbonTrip.note,
          types: [],
          activities: mockLisbonTrip.tripContext,
          generated: true,
          status: mockLisbonTrip.status,
          image: null,
        },
        packing_lists: writes.packingLists as DbPackingListRow[],
        packing_items: writes.packingItems,
        trip_bags: [],
        trip_weather: null,
        trip_insights: [],
      };

      const loaded = mapDbAggregateToCanonicalTrip(aggregate);

      expect(loaded.packingLists).toHaveLength(2);
      expect(loaded.packingLists[1].id).toBe('lisbon-list-emilie');
      expect(loaded.packingLists[1].packingMode).toBe('manual');
    });

    it('compatibility primary id helper is explicit — not index 0', () => {
      expect(compatibilityPrimaryListIdForTrip('lisbon')).toBe(primaryPackingListId('lisbon'));
      expect(compatibilityPrimaryListIdForTrip('lisbon')).not.toBe('lisbon-list-emilie');
    });
  });

  describe('packing item category ingress', () => {
    it('normalizes unknown persisted categories to Uncategorized', () => {
      const row: DbCanonicalPackingItemRow = {
        trip_id: 'trip-1',
        packing_list_id: 'list-1',
        id: 'item-legacy',
        name: 'Legacy item',
        quantity: 1,
        category: 'LegacyBucket',
        packed: false,
        need_to_buy: false,
        assigned_to: null,
        note: null,
        source: 'generated',
        important_item_id: null,
        sort_order: 0,
      };

      expect(mapDbCanonicalPackingItemRow(row).category).toBe('Uncategorized');
    });

    it('preserves valid categories on round-trip mapping', () => {
      const item: PackingItem = {
        id: 'item-1',
        name: 'Passport',
        quantity: 1,
        category: 'Essentials',
        packed: false,
        needToBuy: false,
        assignedTo: null,
        source: 'generated',
      };

      const row = mapPackingItemToDbRow('trip-1', 'list-1', item, 0);
      expect(mapDbCanonicalPackingItemRow(row).category).toBe('Essentials');
    });

    it('preserves Important items when source is important despite unknown category string', () => {
      const row: DbCanonicalPackingItemRow = {
        trip_id: 'trip-1',
        packing_list_id: 'list-1',
        id: 'item-important',
        name: 'EpiPen',
        quantity: 1,
        category: 'LegacyBucket',
        packed: false,
        need_to_buy: false,
        assigned_to: null,
        note: null,
        source: 'important',
        important_item_id: 'imp-1',
        sort_order: 0,
      };

      expect(mapDbCanonicalPackingItemRow(row).category).toBe('Important');
    });
  });

  describe('I. assignedTo is not used as list ownership', () => {
    it('groups items by packing_list_id, not assigned_to', () => {
      const rows: DbCanonicalPackingItemRow[] = [
        {
          trip_id: 'trip-1',
          packing_list_id: 'list-emilie',
          id: 'item-1',
          name: 'Toy',
          quantity: 1,
          category: 'Essentials',
          packed: false,
          need_to_buy: false,
          assigned_to: 't-you',
          note: null,
          source: 'generated',
          important_item_id: null,
          sort_order: 0,
        },
      ];

      const grouped = groupPackingItemsByListId(rows);
      expect(grouped.get('list-emilie')).toHaveLength(1);
      expect(grouped.get('list-emilie')?.[0].assignedTo).toBe('t-you');
      expect(grouped.has('t-you')).toBe(false);
    });
  });

  describe('profile snapshot JSON', () => {
    it('omits undefined optional fields', () => {
      const json = profileSnapshotToJson({
        id: 'profile-self',
        name: 'Me',
        isSelf: true,
      });

      expect(json).toEqual({ id: 'profile-self', name: 'Me', isSelf: true });
      expect(json).not.toHaveProperty('age');
    });
  });

  describe('aggregate normalization', () => {
    it('normalizes loaded aggregate through normalizeTrip', () => {
      const normalized = normalizeTrip(mockLisbonTrip);
      const { packingLists, packingItems } = mapCanonicalTripToDbWrites(normalized);

      const aggregate: DbCanonicalTripAggregate = {
        trip: {
          id: normalized.id,
          user_id: 'user-1',
          title: normalized.name,
          destination: 'Lisbon',
          country: 'Portugal',
          start_date: normalized.startDate,
          end_date: normalized.endDate,
          accommodation: normalized.accommodation,
          laundry: normalized.laundry,
          note: normalized.note,
          types: [],
          activities: normalized.tripContext,
          generated: true,
          status: normalized.status,
          image: null,
        },
        packing_lists: packingLists as DbPackingListRow[],
        packing_items: packingItems,
        trip_bags: [],
        trip_weather: null,
        trip_insights: [],
      };

      const loaded = mapDbAggregateToCanonicalTrip(aggregate);
      expect(loaded.packingLists).toHaveLength(2);
      expect(loaded.packingLists[0].items.some((item) => item.importantItemId === 'imp-passport')).toBe(
        true,
      );
    });
  });
});
