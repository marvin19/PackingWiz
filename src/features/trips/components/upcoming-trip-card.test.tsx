import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { createDestinationFromText } from '@/domain/destination';
import { normalizeTrip, type TripLike } from '@/domain/trip-compatibility';
import { UpcomingTripCard } from '@/features/trips/components/upcoming-trip-card';

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('@/hooks/use-theme', () => {
  const { theme } = jest.requireActual('@/theme') as typeof import('@/theme');
  return { useTheme: () => theme };
});

jest.mock('@/features/trips/components/trip-hero-image', () => ({
  TripHeroImage: 'TripHeroImage',
}));

function createTripForCard(overrides: Partial<TripLike> = {}) {
  const input: TripLike = {
    id: 'trip-card-test',
    name: 'Sommerferie 2027',
    title: 'Sommerferie 2027',
    destination: createDestinationFromText('Madrid'),
    startDate: '2027-07-01',
    endDate: '2027-07-14',
    tripContext: ['Vacation'],
    accommodation: 'hotel',
    laundry: 'yes',
    travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
    bags: [],
    note: '',
    weather: { mode: 'climate', summary: '', detail: '', high: 20, low: 10 },
    items: [],
    packingMode: 'manual',
    generated: false,
    packingLists: [
      {
        id: 'trip-card-test-list-self',
        packingProfileId: 'trip-card-test-profile-self',
        profileSnapshot: { id: 'trip-card-test-profile-self', name: 'Me', isSelf: true },
        packingMode: 'manual',
        items: [],
      },
    ],
    status: 'upcoming',
    ...overrides,
  };

  return normalizeTrip(input);
}

describe('UpcomingTripCard', () => {
  it('shows custom trip name with destination place under the pin', () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      tree = TestRenderer.create(
        <UpcomingTripCard trip={createTripForCard()} onPress={jest.fn()} />,
      );
    });

    expect(tree!.root.findByProps({ children: 'Sommerferie 2027' })).toBeTruthy();
    expect(tree!.root.findByProps({ children: 'Madrid' })).toBeTruthy();
  });
});
