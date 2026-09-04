import type { Insight } from '@/domain/insight';
import type { PackingItem } from '@/domain/packing-item';
import { packingStatsForTrip } from '@/domain/packing-stats';
import type { Trip } from '@/domain/trip';
import { createDestinationFromText } from '@/domain/destination';
import { normalizeTrip, primaryPackingListId, type TripLike } from '@/domain/trip-compatibility';
import { snapshotPackingListsState } from '@/domain/trip-edit';
import {
  buildReusedTrip,
  TripReuseError,
} from '@/domain/trip-reuse';
import { emptyTripWeather } from '@/domain/weather';
import { cloneTrip } from '@/lib/clone-trip';

const SOURCE_TRIP_ID = 'trip-reuse-source';
const REFERENCE_DATE = new Date('2026-06-15T12:00:00');

const emilieProfileId = `${SOURCE_TRIP_ID}-profile-emilie`;
const jonasProfileId = 'profile-jonas-reuse';

function makeItem(
  id: string,
  name: string,
  overrides: Partial<PackingItem> = {},
): PackingItem {
  return {
    id,
    name,
    quantity: overrides.quantity ?? 1,
    category: overrides.category ?? 'Clothing',
    packed: overrides.packed ?? false,
    needToBuy: overrides.needToBuy ?? false,
    assignedTo: overrides.assignedTo ?? null,
    source: overrides.source ?? 'generated',
    note: overrides.note,
    importantItemId: overrides.importantItemId,
  };
}

function createSourceTrip(overrides: Partial<TripLike> = {}): Trip {
  const meListId = primaryPackingListId(SOURCE_TRIP_ID);
  const emilieListId = `${SOURCE_TRIP_ID}-list-emilie`;
  const jonasListId = `${SOURCE_TRIP_ID}-list-jonas`;

  const input: TripLike = {
    id: SOURCE_TRIP_ID,
    name: 'Family beach trip',
    title: 'Family beach trip',
    destination: createDestinationFromText('Barcelona', 'Spain'),
    startDate: '2025-08-01',
    endDate: '2025-08-10',
    tripContext: ['Beach', 'Family trip'],
    accommodation: 'hotel',
    laundry: 'yes',
    note: 'Reuse me',
    travelers: [
      { id: 't-you', name: 'You', role: 'Adult' },
      { id: emilieProfileId, name: 'Emilie', role: 'Child', age: 8 },
      { id: jonasProfileId, name: 'Jonas', role: 'Child', age: 10 },
    ],
    bags: [{ id: 'bag-source', name: 'Carry-on', type: 'carryon', ownerId: null }],
    weather: {
      mode: 'climate',
      summary: 'Hot and sunny',
      detail: 'Old forecast detail',
      high: 32,
      low: 22,
      days: [{ label: 'Mon', icon: 'sun', high: 32, low: 22 }],
    },
    insights: [
      {
        id: 'insight-old',
        category: 'weather',
        title: 'Warm weather',
        body: 'Pack light clothing',
      },
    ] as Insight[],
    image: 'https://example.com/old-hero.jpg',
    packingLists: [
      {
        id: meListId,
        packingProfileId: `${SOURCE_TRIP_ID}-profile-self`,
        profileSnapshot: { id: `${SOURCE_TRIP_ID}-profile-self`, name: 'Me', isSelf: true },
        packingMode: 'generated',
        items: [
          makeItem('item-me-packed', 'Shirt', {
            packed: true,
            quantity: 2,
            note: 'Blue one',
            assignedTo: 't-you',
          }),
          makeItem('item-me-buy', 'Sunscreen', {
            category: 'Toiletries',
            needToBuy: true,
          }),
          makeItem('item-me-important', 'Passport', {
            category: 'Important',
            source: 'important',
            importantItemId: 'imp-passport-master',
            packed: true,
          }),
        ],
      },
      {
        id: emilieListId,
        packingProfileId: emilieProfileId,
        profileSnapshot: { id: emilieProfileId, name: 'Emilie', age: 8, isSelf: false },
        packingMode: 'manual',
        items: [
          makeItem('item-emilie', 'Comfort toy', {
            category: 'Essentials',
            packed: true,
            note: 'Favorite bear',
          }),
        ],
      },
      {
        id: jonasListId,
        packingProfileId: jonasProfileId,
        profileSnapshot: { id: jonasProfileId, name: 'Jonas', age: 10, isSelf: false },
        packingMode: 'generated',
        items: [makeItem('item-jonas', 'Swim trunks', { packed: true })],
      },
    ],
    items: [],
    packingMode: 'generated',
    generated: true,
    status: 'past',
    ...overrides,
  };

  return normalizeTrip(input);
}

function deepFreezeTripSnapshot(trip: Trip): string {
  return JSON.stringify(cloneTrip(trip));
}

describe('buildReusedTrip', () => {
  let idCounter: number;

  beforeEach(() => {
    idCounter = 0;
  });

  function nextId(prefix: string): string {
    idCounter += 1;
    return `${prefix}-${idCounter}`;
  }

  function buildWithDeterministicIds(
    sourceTrip: Trip,
    selection: { packingListIds?: string[]; packingProfileIds?: string[] },
    sharedDetails = { startDate: '2026-09-01', endDate: '2026-09-08' },
  ) {
    return buildReusedTrip({
      sourceTrip,
      sharedDetails,
      referenceDate: REFERENCE_DATE,
      createTripId: () => nextId('new-trip'),
      createListId: () => nextId('new-list'),
      createItemId: () => nextId('new-item'),
      createBagId: () => nextId('new-bag'),
      ...(selection.packingListIds
        ? { packingListIds: selection.packingListIds }
        : { packingProfileIds: selection.packingProfileIds! }),
    });
  }

  it('creates fresh trip/list/item ids while source ids stay unchanged', () => {
    const source = createSourceTrip();
    const sourceSnapshot = deepFreezeTripSnapshot(source);
    const meListId = primaryPackingListId(SOURCE_TRIP_ID);

    const reused = buildWithDeterministicIds(source, {
      packingListIds: [meListId, `${SOURCE_TRIP_ID}-list-jonas`],
    });

    expect(reused.id).toMatch(/^new-trip-/);
    expect(reused.id).not.toBe(source.id);
    expect(reused.packingLists).toHaveLength(2);
    expect(reused.packingLists.every((list) => list.id.startsWith('new-list-'))).toBe(true);
    expect(reused.packingLists.flatMap((list) => list.items).every((item) => item.id.startsWith('new-item-'))).toBe(
      true,
    );

    expect(deepFreezeTripSnapshot(source)).toBe(sourceSnapshot);
    expect(source.packingLists[0]?.items[0]?.id).toBe('item-me-packed');
  });

  it('preserves item content, notes, need to buy, and packingMode per list', () => {
    const source = createSourceTrip();
    const meListId = primaryPackingListId(SOURCE_TRIP_ID);
    const emilieListId = `${SOURCE_TRIP_ID}-list-emilie`;

    const reused = buildWithDeterministicIds(source, {
      packingListIds: [meListId, emilieListId],
    });

    const meList = reused.packingLists[0];
    const emilieList = reused.packingLists[1];

    expect(meList?.packingMode).toBe('generated');
    expect(emilieList?.packingMode).toBe('manual');

    const shirt = meList?.items.find((item) => item.name === 'Shirt');
    expect(shirt?.quantity).toBe(2);
    expect(shirt?.note).toBe('Blue one');
    expect(shirt?.assignedTo).toBe('t-you');

    const sunscreen = meList?.items.find((item) => item.name === 'Sunscreen');
    expect(sunscreen?.needToBuy).toBe(true);

    const toy = emilieList?.items.find((item) => item.name === 'Comfort toy');
    expect(toy?.note).toBe('Favorite bear');
  });

  it('resets packed progress on copied items and leaves source progress unchanged', () => {
    const source = createSourceTrip();
    const sourceBefore = snapshotPackingListsState(source);
    const meListId = primaryPackingListId(SOURCE_TRIP_ID);

    const reused = buildWithDeterministicIds(source, { packingListIds: [meListId] });

    expect(reused.packingLists[0]?.items.every((item) => item.packed === false)).toBe(true);
    expect(packingStatsForTrip(reused)).toEqual({ packed: 0, total: 3, pct: 0 });
    expect(snapshotPackingListsState(source)).toEqual(sourceBefore);
    expect(packingStatsForTrip(source).packed).toBeGreaterThan(0);
  });

  it('copies only selected travellers when subset is provided', () => {
    const source = createSourceTrip();
    const meListId = primaryPackingListId(SOURCE_TRIP_ID);
    const jonasListId = `${SOURCE_TRIP_ID}-list-jonas`;

    const reused = buildWithDeterministicIds(source, {
      packingListIds: [meListId, jonasListId],
    });

    expect(reused.packingLists).toHaveLength(2);
    expect(reused.packingLists.map((list) => list.profileSnapshot.name)).toEqual(['Me', 'Jonas']);
    expect(reused.travelers.map((traveler) => traveler.name)).toEqual(['You', 'Jonas']);
    expect(source.packingLists).toHaveLength(3);
  });

  it('supports profile id selection and rejects unknown list/profile ids', () => {
    const source = createSourceTrip();

    const byProfile = buildWithDeterministicIds(source, {
      packingProfileIds: [`${SOURCE_TRIP_ID}-profile-self`, jonasProfileId],
    });
    expect(byProfile.packingLists).toHaveLength(2);

    expect(() =>
      buildReusedTrip({
        sourceTrip: source,
        packingListIds: ['missing-list'],
        sharedDetails: { startDate: '2026-09-01', endDate: '2026-09-08' },
      }),
    ).toThrow(TripReuseError);

    expect(() =>
      buildReusedTrip({
        sourceTrip: source,
        packingProfileIds: ['missing-profile'],
        sharedDetails: { startDate: '2026-09-01', endDate: '2026-09-08' },
      }),
    ).toThrow(TripReuseError);
  });

  it('rejects empty selection', () => {
    const source = createSourceTrip();

    expect(() =>
      buildReusedTrip({
        sourceTrip: source,
        packingListIds: [],
        sharedDetails: { startDate: '2026-09-01', endDate: '2026-09-08' },
        referenceDate: REFERENCE_DATE,
      }),
    ).toThrow(/At least one packing list/);
  });

  it('preserves Important snapshot metadata and master link with fresh item ids', () => {
    const source = createSourceTrip();
    const meListId = primaryPackingListId(SOURCE_TRIP_ID);

    const reused = buildWithDeterministicIds(source, { packingListIds: [meListId] });
    const passport = reused.packingLists[0]?.items.find((item) => item.name === 'Passport');

    expect(passport?.id).not.toBe('item-me-important');
    expect(passport?.source).toBe('important');
    expect(passport?.category).toBe('Important');
    expect(passport?.importantItemId).toBe('imp-passport-master');
    expect(passport?.packed).toBe(false);
  });

  it('uses new dates, rejects past start dates, and leaves source dates unchanged', () => {
    const source = createSourceTrip();
    const meListId = primaryPackingListId(SOURCE_TRIP_ID);

    const reused = buildWithDeterministicIds(
      source,
      { packingListIds: [meListId] },
      { startDate: '2026-09-01', endDate: '2026-09-08' },
    );

    expect(reused.startDate).toBe('2026-09-01');
    expect(reused.endDate).toBe('2026-09-08');
    expect(source.startDate).toBe('2025-08-01');
    expect(source.endDate).toBe('2025-08-10');

    expect(() =>
      buildReusedTrip({
        sourceTrip: source,
        packingListIds: [meListId],
        sharedDetails: { startDate: '2026-06-14', endDate: '2026-06-20' },
        referenceDate: REFERENCE_DATE,
      }),
    ).toThrow(TripReuseError);

    const todayStart = buildReusedTrip({
      sourceTrip: source,
      packingListIds: [meListId],
      sharedDetails: { startDate: '2026-06-15', endDate: '2026-06-20' },
      referenceDate: REFERENCE_DATE,
    });
    expect(todayStart.startDate).toBe('2026-06-15');
  });

  it('does not copy weather, insights, or image metadata', () => {
    const source = createSourceTrip();
    const meListId = primaryPackingListId(SOURCE_TRIP_ID);

    const reused = buildWithDeterministicIds(source, { packingListIds: [meListId] });

    expect(reused.weather).toEqual(emptyTripWeather());
    expect(reused.insights).toEqual([]);
    expect(reused.image).toBeUndefined();
    expect(source.weather.summary).toBe('Hot and sunny');
    expect(source.insights).toHaveLength(1);
    expect(source.image).toBe('https://example.com/old-hero.jpg');
  });

  it('copies profile snapshots without rebuilding from master', () => {
    const source = createSourceTrip();
    const emilieListId = `${SOURCE_TRIP_ID}-list-emilie`;

    const reused = buildWithDeterministicIds(source, { packingListIds: [emilieListId] });
    const snapshot = reused.packingLists[0]?.profileSnapshot;

    expect(snapshot).toEqual(source.packingLists[1]?.profileSnapshot);
    expect(snapshot?.name).toBe('Emilie');
    expect(snapshot?.age).toBe(8);
  });

  it('applies shared detail overrides for name, destination, and context', () => {
    const source = createSourceTrip();
    const meListId = primaryPackingListId(SOURCE_TRIP_ID);

    const reused = buildReusedTrip({
      sourceTrip: source,
      packingListIds: [meListId],
      sharedDetails: {
        startDate: '2026-10-01',
        endDate: '2026-10-07',
        name: 'Autumn revisit',
        destination: createDestinationFromText('Lisbon', 'Portugal'),
        tripContext: ['City'],
        note: 'Updated note',
      },
      referenceDate: REFERENCE_DATE,
      createTripId: () => 'trip-override',
      createListId: () => 'list-override',
      createItemId: () => 'item-override',
      createBagId: () => 'bag-override',
    });

    expect(reused.name).toBe('Autumn revisit');
    expect(reused.destination.displayName).toBe('Lisbon');
    expect(reused.tripContext).toEqual(['City']);
    expect(reused.note).toBe('Updated note');
  });
});
