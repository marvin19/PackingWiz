import type { PackingItem } from '@/domain/packing-item';
import { createDestinationFromText } from '@/domain/destination';
import {
  allTripPackingItems,
  countAllPackedItems,
  isCanonicalTripShape,
  isLegacyTripIngress,
  resolveExplicitPackingListId,
  supportsLegacyItemAssignment,
  tripHasMixedPackingModes,
} from '@/domain/trip-canonical';
import {
  normalizeCanonicalTrip,
  normalizeTrip,
  patchPackingListItem,
  primaryPackingListId,
  resolveCompatibilityPrimaryPackingList,
  type TripLike,
} from '@/domain/trip-compatibility';
import { cloneTrip } from '@/lib/clone-trip';

const TRIP_ID = 'trip-canonical';

function makeItem(id: string, name: string, overrides: Partial<PackingItem> = {}): PackingItem {
  return {
    id,
    name,
    quantity: 1,
    category: 'Clothing',
    packed: false,
    needToBuy: false,
    assignedTo: null,
    source: 'generated',
    ...overrides,
  };
}

function createMixedMultiListTrip() {
  const meListId = primaryPackingListId(TRIP_ID);
  const emilieListId = `${TRIP_ID}-list-profile-emilie`;

  const input: TripLike = {
    id: TRIP_ID,
    name: 'Family trip',
    title: 'Family trip',
    destination: createDestinationFromText('Oslo'),
    startDate: '2026-07-01',
    endDate: '2026-07-10',
    tripContext: ['City'],
    accommodation: 'hotel',
    laundry: 'yes',
    travelers: [],
    bags: [],
    note: '',
    weather: { mode: 'climate', summary: 'Mild', detail: '', high: 20, low: 12 },
    insights: [],
    packingLists: [
      {
        id: meListId,
        packingProfileId: `${TRIP_ID}-profile-self`,
        profileSnapshot: { id: `${TRIP_ID}-profile-self`, name: 'Me', isSelf: true },
        packingMode: 'generated',
        items: [makeItem('item-me', 'Shirt')],
      },
      {
        id: emilieListId,
        packingProfileId: 'profile-emilie',
        profileSnapshot: { id: 'profile-emilie', name: 'Emilie', age: 8, isSelf: false },
        packingMode: 'manual',
        items: [makeItem('item-emilie', 'Toy')],
      },
    ],
    items: [],
    packingMode: 'generated',
    generated: true,
    status: 'upcoming',
  };

  return normalizeTrip(input);
}

describe('trip canonical contract', () => {
  it('recognizes canonical multi-list trips', () => {
    const trip = createMixedMultiListTrip();
    expect(isLegacyTripIngress(trip)).toBe(false);
    expect(isCanonicalTripShape(trip)).toBe(true);
    expect(tripHasMixedPackingModes(trip)).toBe(true);
  });

  it('normalizes canonical trips idempotently without rewriting list ids', () => {
    const trip = createMixedMultiListTrip();
    const once = normalizeCanonicalTrip(trip);
    const twice = normalizeCanonicalTrip(once);

    expect(twice.id).toBe(once.id);
    expect(twice.packingLists.map((list) => list.id)).toEqual(
      once.packingLists.map((list) => list.id),
    );
    expect(twice.packingLists.flatMap((list) => list.items.map((item) => item.id))).toEqual(
      once.packingLists.flatMap((list) => list.items.map((item) => item.id)),
    );
    expect(twice.packingLists[1]?.packingMode).toBe('manual');
    expect(twice.packingLists[0]?.packingMode).toBe('generated');
    expect(twice.packingLists[0]?.profileSnapshot).toEqual(once.packingLists[0]?.profileSnapshot);
    expect(twice.packingLists[1]?.items[0]?.packed).toBe(once.packingLists[1]?.items[0]?.packed);
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  });

  it('mirrors legacy Trip fields from compatibility-primary list even when it is not index 0', () => {
    const primaryId = primaryPackingListId(TRIP_ID);
    const emilieListId = `${TRIP_ID}-list-emilie`;

    const input: TripLike = {
      id: TRIP_ID,
      name: 'Reordered lists',
      title: 'Reordered lists',
      destination: createDestinationFromText('Oslo'),
      startDate: '2026-07-01',
      endDate: '2026-07-10',
      tripContext: [],
      accommodation: 'hotel',
      laundry: 'yes',
      travelers: [],
      bags: [],
      note: '',
      weather: { mode: 'climate', summary: 'Mild', detail: '', high: 20, low: 12 },
      insights: [],
      packingLists: [
        {
          id: emilieListId,
          packingProfileId: 'profile-emilie',
          profileSnapshot: { id: 'profile-emilie', name: 'Emilie', isSelf: false },
          packingMode: 'manual',
          items: [makeItem('item-emilie-first', 'Emilie toy')],
        },
        {
          id: primaryId,
          packingProfileId: `${TRIP_ID}-profile-self`,
          profileSnapshot: { id: `${TRIP_ID}-profile-self`, name: 'Me', isSelf: true },
          packingMode: 'generated',
          items: [
            makeItem('item-me-mirror', 'Mirror source shirt', {
              importantItemId: 'imp-passport',
              packed: true,
            }),
          ],
        },
      ],
      items: [],
      packingMode: 'manual',
      generated: false,
      status: 'upcoming',
    };

    const trip = normalizeTrip(input);
    const mirrorList = resolveCompatibilityPrimaryPackingList(trip);

    expect(mirrorList?.id).toBe(primaryId);
    expect(trip.items.map((item) => item.id)).toEqual(['item-me-mirror']);
    expect(trip.packingMode).toBe('generated');
    expect(trip.generated).toBe(true);
    expect(trip.items[0]?.importantItemId).toBe('imp-passport');
    expect(trip.items[0]?.packed).toBe(true);
  });

  it('does not mirror from packingLists[0] when multi-list has no compatibility-primary list', () => {
    const staleItem = makeItem('stale-mirror', 'Stale mirror item');

    const input: TripLike = {
      id: TRIP_ID,
      name: 'No compatibility primary',
      title: 'No compatibility primary',
      destination: createDestinationFromText('Oslo'),
      startDate: '2026-07-01',
      endDate: '2026-07-10',
      tripContext: [],
      accommodation: 'hotel',
      laundry: 'yes',
      travelers: [],
      bags: [],
      note: '',
      weather: { mode: 'climate', summary: 'Mild', detail: '', high: 20, low: 12 },
      insights: [],
      packingLists: [
        {
          id: `${TRIP_ID}-list-a`,
          packingProfileId: 'profile-a',
          profileSnapshot: { id: 'profile-a', name: 'A', isSelf: false },
          packingMode: 'manual',
          items: [makeItem('item-a', 'A item')],
        },
        {
          id: `${TRIP_ID}-list-b`,
          packingProfileId: 'profile-b',
          profileSnapshot: { id: 'profile-b', name: 'B', isSelf: false },
          packingMode: 'generated',
          items: [makeItem('item-b', 'B item')],
        },
      ],
      items: [staleItem],
      packingMode: 'manual',
      generated: false,
      status: 'upcoming',
    };

    const trip = normalizeTrip(input);

    expect(resolveCompatibilityPrimaryPackingList(trip)).toBeUndefined();
    expect(trip.items).toEqual([staleItem]);
    expect(trip.packingMode).toBe('manual');
    expect(trip.generated).toBe(false);
  });

  it('patchPackingListItem targets explicit list only and ignores assignedTo for list selection', () => {
    const trip = createMixedMultiListTrip();
    const meListId = trip.packingLists[0].id;
    const emilieListId = trip.packingLists[1].id;

    const withAssignment = patchPackingListItem(trip, meListId, 'item-me', {
      assignedTo: 'profile-emilie',
      packed: true,
    });

    expect(withAssignment.packingLists[0]?.items[0]?.assignedTo).toBe('profile-emilie');
    expect(withAssignment.packingLists[0]?.items[0]?.packed).toBe(true);
    expect(withAssignment.packingLists[1]?.items[0]?.packed).toBe(false);
    expect(withAssignment.packingLists[1]?.items).toHaveLength(1);
    expect(
      withAssignment.packingLists.flatMap((list) => list.items).some((item) => item.id === 'item-me'),
    ).toBe(true);
    expect(
      withAssignment.packingLists
        .find((list) => list.id === emilieListId)
        ?.items.some((item) => item.id === 'item-me'),
    ).toBe(false);
  });

  it('clone preserves list identity; reuse paths generate fresh ids separately', () => {
    const trip = createMixedMultiListTrip();
    const cloned = cloneTrip(trip);

    expect(cloned.id).toBe(trip.id);
    expect(cloned.packingLists.map((list) => list.id)).toEqual(
      trip.packingLists.map((list) => list.id),
    );
    expect(cloned.packingLists[0]?.items[0]?.id).toBe(trip.packingLists[0]?.items[0]?.id);
  });

  it('requires explicit list id for multi-list mutations', () => {
    const trip = createMixedMultiListTrip();
    expect(() => resolveExplicitPackingListId(trip, null)).toThrow(/explicit/i);
    expect(() => resolveExplicitPackingListId(trip, undefined)).toThrow(/explicit/i);
    expect(resolveExplicitPackingListId(trip, trip.packingLists[1].id)).toBe(
      trip.packingLists[1].id,
    );
  });

  it('counts packed items across all lists', () => {
    const trip = createMixedMultiListTrip();
    const packedMe = patchPackingListItem(trip, trip.packingLists[0].id, 'item-me', {
      packed: true,
    });

    expect(allTripPackingItems(packedMe)).toHaveLength(2);
    expect(countAllPackedItems(packedMe)).toBe(1);
  });

  it('disables legacy item assignment on multi-list trips', () => {
    const trip = createMixedMultiListTrip();
    expect(supportsLegacyItemAssignment(trip)).toBe(false);
  });

  it('migrates legacy flat ingress into a nested primary list', () => {
    const legacy: TripLike = {
      id: 'legacy-trip',
      title: 'Legacy',
      destination: createDestinationFromText('Bergen'),
      startDate: '2026-08-01',
      endDate: '2026-08-05',
      tripContext: [],
      accommodation: 'hotel',
      laundry: 'no',
      travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
      bags: [],
      note: '',
      weather: { mode: 'climate', summary: 'Rain', detail: '', high: 16, low: 10 },
      insights: [],
      items: [makeItem('legacy-item', 'Coat')],
      packingMode: 'manual',
      generated: false,
      status: 'past',
    };

    expect(isLegacyTripIngress(legacy)).toBe(true);
    const normalized = normalizeTrip(legacy);
    expect(normalized.packingLists).toHaveLength(1);
    expect(normalized.packingLists[0]?.id).toBe(primaryPackingListId('legacy-trip'));
    expect(normalized.packingLists[0]?.items[0]?.name).toBe('Coat');
  });
});

describe('resolveExplicitPackingListId single-list auto-resolution', () => {
  it('auto-resolves the sole list', () => {
    const trip = normalizeTrip({
      id: 'solo-trip',
      name: 'Solo',
      title: 'Solo',
      destination: createDestinationFromText('Oslo'),
      startDate: '2026-08-01',
      endDate: '2026-08-05',
      tripContext: [],
      accommodation: 'hotel',
      laundry: 'no',
      travelers: [],
      bags: [],
      note: '',
      weather: { mode: 'climate', summary: 'Mild', detail: '', high: 18, low: 10 },
      insights: [],
      packingLists: [
        {
          id: 'solo-custom-list-id',
          packingProfileId: 'profile-self',
          profileSnapshot: { id: 'profile-self', name: 'Me', isSelf: true },
          packingMode: 'generated',
          items: [],
        },
      ],
      items: [],
      packingMode: 'generated',
      generated: true,
      status: 'upcoming',
    });

    expect(resolveExplicitPackingListId(trip, null)).toBe('solo-custom-list-id');
  });
});
