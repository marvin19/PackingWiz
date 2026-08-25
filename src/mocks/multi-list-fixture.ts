import type { PackingItem } from '@/domain/packing-item';
import type { PackingList } from '@/domain/packing-list';
import type { Trip } from '@/domain/trip';
import { createDestinationFromText } from '@/domain/destination';
import { normalizeTrip, type TripLike } from '@/domain/trip-compatibility';
import { createSeedPrimaryPackingList } from '@/mocks/seed-packing-lists';

const FIXTURE_TRIP_ID = 'fixture-multi-list';

const fixturePrimaryItems: PackingItem[] = [
  {
    id: 'fixture-item-primary',
    name: 'Primary list item',
    quantity: 1,
    category: 'Essentials',
    packed: false,
    needToBuy: false,
    assignedTo: null,
    source: 'generated',
  },
];

const fixtureSecondaryList: PackingList = {
  id: `${FIXTURE_TRIP_ID}-list-secondary`,
  packingProfileId: `${FIXTURE_TRIP_ID}-profile-emilie`,
  profileSnapshot: {
    id: `${FIXTURE_TRIP_ID}-profile-emilie`,
    name: 'Emilie',
    isSelf: false,
  },
  packingMode: 'manual',
  items: [
    {
      id: 'fixture-item-secondary',
      name: 'Secondary list item',
      quantity: 1,
      category: 'Clothing',
      packed: true,
      needToBuy: false,
      assignedTo: null,
      source: 'generated',
    },
  ],
};

/**
 * Domain fixture only — not loaded into MockTripRepository or UI.
 * Used to verify primary-list mutations preserve additional nested lists.
 */
export function createMultiListFixtureTrip(): Trip {
  const primaryList = createSeedPrimaryPackingList(
    FIXTURE_TRIP_ID,
    fixturePrimaryItems,
    'generated',
  );

  const input: TripLike = {
    id: FIXTURE_TRIP_ID,
    name: 'Fixture multi-list',
    title: 'Fixture multi-list',
    destination: createDestinationFromText('Fixture', 'Nowhere'),
    startDate: '2026-01-01',
    endDate: '2026-01-05',
    tripContext: ['Vacation'],
    accommodation: 'hotel',
    laundry: 'no',
    travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
    bags: [],
    note: '',
    weather: {
      mode: 'climate',
      summary: 'Fixture weather',
      detail: '',
      high: 20,
      low: 10,
    },
    packingLists: [primaryList, fixtureSecondaryList],
    items: primaryList.items,
    insights: [],
    packingMode: primaryList.packingMode,
    generated: true,
    status: 'upcoming',
  };

  return normalizeTrip(input);
}

export const multiListFixtureTripId = FIXTURE_TRIP_ID;

export const multiListFixtureSecondaryListId = fixtureSecondaryList.id;
