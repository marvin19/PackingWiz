import type { PackingItem } from '@/domain/packing-item';
import type { PackingList } from '@/domain/packing-list';
import type { Trip } from '@/domain/trip';
import { createDestinationFromText } from '@/domain/destination';
import {
  normalizeTrip,
  primaryPackingListId,
  primaryPackingProfileId,
  type TripLike,
} from '@/domain/trip-compatibility';
import {
  createSeedPrimaryPackingList,
  createSeedSelfProfileSnapshot,
} from '@/mocks/seed-packing-lists';
import {
  seedLisbonWeather,
  seedMallorcaWeather,
  seedTokyoWeather,
} from '@/mocks/seed-weather';

const LISBON_EMILIE_PROFILE_ID = 'profile-emilie';

function makeItem(
  id: string,
  name: string,
  category: PackingItem['category'],
  overrides: Partial<PackingItem> = {},
): PackingItem {
  return {
    id,
    name,
    quantity: overrides.quantity ?? 1,
    category,
    packed: overrides.packed ?? false,
    needToBuy: overrides.needToBuy ?? false,
    assignedTo: overrides.assignedTo ?? null,
    note: overrides.note,
    source: overrides.source ?? 'generated',
    importantItemId: overrides.importantItemId,
  };
}

function finalizeSeedTrip(
  input: Omit<TripLike, 'packingLists' | 'items' | 'packingMode' | 'generated'> & {
    packingLists: PackingList[];
  },
): TripLike {
  const primaryList = input.packingLists[0];

  const tripName = input.name?.trim() || input.title?.trim() || '';

  return {
    ...input,
    name: tripName,
    title: tripName,
    packingLists: input.packingLists.map((list) => ({
      ...list,
      profileSnapshot: { ...list.profileSnapshot },
      items: list.items.map((item) => ({ ...item })),
    })),
    items: primaryList.items.map((item) => ({ ...item })),
    packingMode: primaryList.packingMode,
    generated: primaryList.packingMode === 'generated',
  };
}

const tokyoMeItems: PackingItem[] = [
  makeItem('tokyo-1', 'Passport', 'Essentials', { packed: true }),
  makeItem('tokyo-2', 'Wallet & cards', 'Essentials', { packed: true }),
  makeItem('tokyo-3', 'Travel insurance', 'Essentials', { packed: true }),
  makeItem('tokyo-4', 'Medication', 'Essentials'),
  makeItem('tokyo-5', 'T-shirts', 'Clothing', { quantity: 6, packed: true }),
  makeItem('tokyo-6', 'Walking shoes', 'Shoes', { packed: true }),
  makeItem('tokyo-7', 'Running shoes', 'Shoes', { assignedTo: 'profile-emilie' }),
  makeItem('tokyo-8', 'Travel adapter', 'Electronics', { needToBuy: true }),
  makeItem('tokyo-9', 'Compact umbrella', 'Weather', { needToBuy: true }),
];

const tokyoEmilieItems: PackingItem[] = [
  makeItem('tokyo-emilie-jacket', 'Light rain jacket', 'Clothing', { packed: false }),
  makeItem('tokyo-emilie-snacks', 'Travel snacks', 'Essentials', { packed: true, note: 'For the flight' }),
];

const mockTokyoTripInput = finalizeSeedTrip({
  id: 'tokyo-kyoto',
  name: 'Tokyo & Kyoto',
  title: 'Tokyo & Kyoto',
  destination: createDestinationFromText('Tokyo & Kyoto', 'Japan'),
  startDate: '2026-10-12',
  endDate: '2026-10-26',
  tripContext: ['Vacation', 'Hiking', 'Running', 'Half marathon'],
  accommodation: 'hotel',
  laundry: 'yes',
  travelers: [
    { id: 't-you', name: 'You', role: 'Adult' },
    { id: LISBON_EMILIE_PROFILE_ID, name: 'Emilie', role: 'Child', age: 8 },
  ],
  bags: [
    { id: 'bag-me-carry', name: 'Carry-on', type: 'carryon', ownerId: 't-you' },
    { id: 'bag-emilie-backpack', name: "Emilie's backpack", type: 'backpack', ownerId: LISBON_EMILIE_PROFILE_ID },
    { id: 'bag-shared', name: 'Shared checked suitcase', type: 'checked', ownerId: null },
  ],
  note: "We're running a half marathon during the trip and want to pack relatively light.",
  weather: seedTokyoWeather,
  insights: [
    'Your hotel has laundry available, so we reduced the amount of clothing you need for 14 days.',
    'Rain is common during your trip, so we added a compact umbrella and a light rain jacket.',
    'Because you are running a half marathon, we added race-day essentials like gels and your race confirmation.',
  ],
  status: 'upcoming',
  packingLists: [
    createSeedPrimaryPackingList('tokyo-kyoto', tokyoMeItems, 'generated'),
    {
      id: 'tokyo-kyoto-list-emilie',
      packingProfileId: LISBON_EMILIE_PROFILE_ID,
      profileSnapshot: {
        id: LISBON_EMILIE_PROFILE_ID,
        name: 'Emilie',
        age: 8,
        isSelf: false,
      },
      packingMode: 'manual',
      items: tokyoEmilieItems,
    },
  ],
});

export const mockTokyoTrip: Trip = normalizeTrip(mockTokyoTripInput);

const lisbonMeItems: PackingItem[] = [
  makeItem('lisbon-me-shirt', 'Linen shirt', 'Clothing', {
    packed: true,
    quantity: 2,
    note: 'Blue linen',
  }),
  makeItem('lisbon-me-trousers', 'Light trousers', 'Clothing', { packed: false }),
  makeItem('lisbon-me-sunscreen', 'Sunscreen SPF 50', 'Toiletries', { needToBuy: true }),
  makeItem('lisbon-me-manual', 'Evening wrap', 'Clothing', { note: 'Added manually' }),
  makeItem('lisbon-me-passport', 'Passport', 'Important', {
    source: 'important',
    importantItemId: 'imp-passport',
    packed: true,
  }),
];

const lisbonEmilieItems: PackingItem[] = [
  makeItem('lisbon-emilie-toy', 'Comfort toy', 'Essentials', {
    packed: true,
    note: 'Favorite bear',
  }),
  makeItem('lisbon-emilie-dress', 'Summer dress', 'Clothing', { quantity: 2, packed: false }),
];

const mockLisbonTripInput = finalizeSeedTrip({
  id: 'lisbon',
  name: 'Lisbon City Break',
  title: 'Lisbon City Break',
  destination: createDestinationFromText('Lisbon', 'Portugal'),
  startDate: '2026-08-03',
  endDate: '2026-08-08',
  tripContext: ['City break', 'Nice dinners'],
  accommodation: 'apartment',
  laundry: 'no',
  travelers: [
    { id: 't-you', name: 'You', role: 'Adult' },
    { id: LISBON_EMILIE_PROFILE_ID, name: 'Emilie', role: 'Child', age: 8 },
  ],
  bags: [
    { id: 'bag-l-me', name: 'Cabin bag', type: 'carryon', ownerId: 't-you' },
    { id: 'bag-l-emilie', name: "Emilie's cabin bag", type: 'carryon', ownerId: LISBON_EMILIE_PROFILE_ID },
  ],
  note: 'Late dinners most nights — pack one nicer outfit.',
  weather: seedLisbonWeather,
  insights: [],
  status: 'past',
  packingLists: [
    {
      id: primaryPackingListId('lisbon'),
      packingProfileId: primaryPackingProfileId('lisbon'),
      profileSnapshot: createSeedSelfProfileSnapshot('lisbon'),
      packingMode: 'generated',
      items: lisbonMeItems,
    },
    {
      id: 'lisbon-list-emilie',
      packingProfileId: LISBON_EMILIE_PROFILE_ID,
      profileSnapshot: {
        id: LISBON_EMILIE_PROFILE_ID,
        name: 'Emilie',
        age: 8,
        isSelf: false,
      },
      packingMode: 'manual',
      items: lisbonEmilieItems,
    },
  ],
});

export const mockLisbonTrip: Trip = normalizeTrip(mockLisbonTripInput);

const mockMallorcaTripInput = finalizeSeedTrip({
  id: 'mallorca',
  name: 'Mallorca Beach',
  title: 'Mallorca Beach',
  destination: createDestinationFromText('Mallorca', 'Spain'),
  startDate: '2025-07-19',
  endDate: '2025-07-28',
  tripContext: ['Beach', 'Vacation', 'Cycling'],
  accommodation: 'hotel',
  laundry: 'yes',
  travelers: [
    { id: 't-you', name: 'You', role: 'Adult' },
  ],
  bags: [
    { id: 'bag-m-1', name: 'Beach duffel', type: 'duffel', ownerId: null },
    { id: 'bag-m-2', name: 'Checked suitcase', type: 'checked', ownerId: null },
  ],
  note: '',
  weather: seedMallorcaWeather,
  insights: [],
  status: 'past',
  packingLists: [
    createSeedPrimaryPackingList('mallorca', [], 'generated'),
  ],
});

export const mockMallorcaTrip: Trip = normalizeTrip(mockMallorcaTripInput);

export const mockSeedTrips: Trip[] = [mockTokyoTrip, mockLisbonTrip, mockMallorcaTrip];

export const LISBON_REUSE_FIXTURE_ID = mockLisbonTrip.id;
export const LISBON_EMILIE_LIST_ID = 'lisbon-list-emilie';
