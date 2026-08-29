import type { PackingItem } from '@/domain/packing-item';
import type { Trip } from '@/domain/trip';
import { createDestinationFromText } from '@/domain/destination';
import { normalizeTrip, type TripLike } from '@/domain/trip-compatibility';
import { createSeedPrimaryPackingList } from '@/mocks/seed-packing-lists';
import {
  seedLisbonWeather,
  seedMallorcaWeather,
  seedTokyoWeather,
} from '@/mocks/seed-weather';

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

const tokyoItems: PackingItem[] = [
  makeItem('tokyo-1', 'Passport', 'Essentials', { packed: true }),
  makeItem('tokyo-2', 'Wallet & cards', 'Essentials', { packed: true }),
  makeItem('tokyo-3', 'Travel insurance', 'Essentials', { packed: true }),
  makeItem('tokyo-4', 'Medication', 'Essentials'),
  makeItem('tokyo-5', 'T-shirts', 'Clothing', { quantity: 6, packed: true }),
  makeItem('tokyo-6', 'Walking shoes', 'Shoes', { packed: true }),
  makeItem('tokyo-7', 'Running shoes', 'Shoes', { assignedTo: 't-anna' }),
  makeItem('tokyo-8', 'Travel adapter', 'Electronics', { needToBuy: true }),
  makeItem('tokyo-9', 'Compact umbrella', 'Weather', { needToBuy: true }),
];

function createSeedTripInput(
  input: Omit<TripLike, 'packingLists'> & { items: PackingItem[] },
): TripLike {
  const primaryList = createSeedPrimaryPackingList(
    input.id,
    input.items,
    input.packingMode,
  );

  const tripName = input.name?.trim() || input.title?.trim() || '';

  return {
    ...input,
    name: tripName,
    title: tripName,
    packingLists: [primaryList],
    items: primaryList.items,
    packingMode: primaryList.packingMode,
    generated: primaryList.packingMode === 'generated',
  };
}

const mockTokyoTripInput = createSeedTripInput({
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
    { id: 't-anna', name: 'Anna', role: 'Adult' },
    { id: 't-martin', name: 'Martin', role: 'Adult' },
  ],
  bags: [
    { id: 'bag-anna', name: "Anna's carry-on", type: 'carryon', ownerId: 't-anna' },
    { id: 'bag-martin', name: "Martin's backpack", type: 'backpack', ownerId: 't-martin' },
    { id: 'bag-shared', name: 'Shared checked suitcase', type: 'checked', ownerId: null },
  ],
  note: "We're running a half marathon during the trip and want to pack relatively light.",
  weather: seedTokyoWeather,
  items: tokyoItems,
  insights: [
    'Your hotel has laundry available, so we reduced the amount of clothing you need for 14 days.',
    'Rain is common during your trip, so we added a compact umbrella and a light rain jacket.',
    'Because you are running a half marathon, we added race-day essentials like gels and your race confirmation.',
  ],
  packingMode: 'generated',
  generated: true,
  status: 'upcoming',
});

export const mockTokyoTrip: Trip = normalizeTrip(mockTokyoTripInput);

const mockLisbonTripInput = createSeedTripInput({
  id: 'lisbon',
  name: 'Lisbon City Break',
  title: 'Lisbon City Break',
  destination: createDestinationFromText('Lisbon', 'Portugal'),
  startDate: '2026-05-08',
  endDate: '2026-05-12',
  tripContext: ['City break', 'Nice dinners'],
  accommodation: 'apartment',
  laundry: 'no',
  travelers: [
    { id: 't-anna', name: 'Anna', role: 'Adult' },
    { id: 't-martin', name: 'Martin', role: 'Adult' },
  ],
  bags: [
    { id: 'bag-l-1', name: 'Cabin bag', type: 'carryon', ownerId: 't-anna' },
    { id: 'bag-l-2', name: 'Cabin bag', type: 'carryon', ownerId: 't-martin' },
  ],
  note: '',
  weather: seedLisbonWeather,
  items: [],
  insights: [],
  packingMode: 'generated',
  generated: true,
  status: 'past',
});

export const mockLisbonTrip: Trip = normalizeTrip(mockLisbonTripInput);

const mockMallorcaTripInput = createSeedTripInput({
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
    { id: 't-anna', name: 'Anna', role: 'Adult' },
    { id: 't-martin', name: 'Martin', role: 'Adult' },
  ],
  bags: [
    { id: 'bag-m-1', name: 'Beach duffel', type: 'duffel', ownerId: null },
    { id: 'bag-m-2', name: 'Checked suitcase', type: 'checked', ownerId: null },
  ],
  note: '',
  weather: seedMallorcaWeather,
  items: [],
  insights: [],
  packingMode: 'generated',
  generated: true,
  status: 'past',
});

export const mockMallorcaTrip: Trip = normalizeTrip(mockMallorcaTripInput);

export const mockSeedTrips: Trip[] = [mockTokyoTrip, mockLisbonTrip, mockMallorcaTrip];
