import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { createDestinationFromText } from '@/domain/destination';
import { normalizeTrip, type TripLike } from '@/domain/trip-compatibility';
import { TripSectionEditScreen } from '@/features/trip-edit/screens/trip-section-edit-screen';

const mockReplace = jest.fn();

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn(), navigate: jest.fn() }),
  useLocalSearchParams: () => ({ section: 'destination', returnTo: 'pack' }),
  useFocusEffect: (effect: () => void | (() => void)) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory scope
    const { useEffect } = require('react');
    useEffect(() => {
      const cleanup = effect();
      return cleanup;
    }, [effect]);
  },
}));

jest.mock('@/hooks/use-theme', () => {
  const { theme } = jest.requireActual('@/theme') as typeof import('@/theme');
  return { useTheme: () => theme };
});

jest.mock('@/config/persistence', () => ({
  getPersistenceMode: () => 'mock',
}));

jest.mock('@/hooks/use-profile', () => ({
  useProfile: () => ({
    savedPackingProfiles: [],
    rememberPackingProfile: jest.fn(),
    importantByProfileId: {},
  }),
}));

jest.mock('@/providers/services-provider', () => ({
  useServices: () => ({ profileRepository: { saveProfile: jest.fn() } }),
}));

const mockPastTrip = normalizeTrip({
  id: 'trip-section-past',
  name: 'Past',
  title: 'Past',
  destination: createDestinationFromText('Oslo'),
  startDate: '2020-01-01',
  endDate: '2020-01-05',
  tripContext: ['City'],
  accommodation: 'hotel',
  laundry: 'yes',
  note: '',
  status: 'upcoming',
  generated: true,
  packingMode: 'generated',
  items: [],
  travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
  bags: [],
  weather: { mode: 'climate', summary: 'Mild', detail: '', high: 20, low: 10 },
  insights: [],
  packingLists: [
    {
      id: 'list-me',
      packingProfileId: 'profile-me',
      profileSnapshot: { id: 'profile-me', name: 'Me', isSelf: true },
      packingMode: 'generated',
      items: [],
    },
  ],
} as TripLike);

jest.mock('@/hooks/use-trips', () => ({
  useTrips: () => ({
    activeTrip: mockPastTrip,
    activeTripId: mockPastTrip.id,
    updateTripSharedDetails: jest.fn(),
    addTravellerToTrip: jest.fn(),
    removeTravellerFromTrip: jest.fn(),
    repositoryError: null,
  }),
}));

describe('TripSectionEditScreen read-only redirect (PW-004E-B)', () => {
  beforeEach(() => {
    mockReplace.mockReset();
  });

  it('replaces to Trip Details when the active trip is read-only', async () => {
    await act(async () => {
      TestRenderer.create(<TripSectionEditScreen />);
      await Promise.resolve();
    });

    expect(mockReplace).toHaveBeenCalledWith('/trip/edit?returnTo=pack');
  });
});