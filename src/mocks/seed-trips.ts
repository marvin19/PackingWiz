import type { PackingItem } from '@/domain/packing-item';
import type { Trip } from '@/domain/trip';
import { createDestinationFromText } from '@/domain/destination';
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
  makeItem('tokyo-3', 'Travel insurance', 'Essentials', {
    packed: true,
    note: 'Keep a digital and printed copy in case you need it at a clinic.',
  }),
  makeItem('tokyo-4', 'Medication', 'Essentials', {
    note: 'Bring enough for 14 days — some common meds are restricted in Japan.',
  }),
  makeItem('tokyo-5', 'T-shirts', 'Clothing', { quantity: 6, packed: true }),
  makeItem('tokyo-6', 'Walking shoes', 'Shoes', {
    packed: true,
    note: "You'll walk a lot sightseeing — comfort matters more than style.",
  }),
  makeItem('tokyo-7', 'Running shoes', 'Shoes', {
    assignedTo: 't-anna',
    note: 'For easy runs and shakeouts before race day.',
  }),
  makeItem('tokyo-8', 'Travel adapter', 'Electronics', {
    needToBuy: true,
    note: 'Japan uses Type A plugs at 100V — bring an adapter.',
  }),
  makeItem('tokyo-9', 'Compact umbrella', 'Weather', {
    needToBuy: true,
    note: 'Rain is common in Tokyo during October.',
  }),
];

export const mockTokyoTrip: Trip = {
  id: 'tokyo-kyoto',
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
};

export const mockLisbonTrip: Trip = {
  id: 'lisbon',
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
};

export const mockMallorcaTrip: Trip = {
  id: 'mallorca',
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
};

export const mockSeedTrips: Trip[] = [mockTokyoTrip, mockLisbonTrip, mockMallorcaTrip];
