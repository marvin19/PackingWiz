import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { createDestinationFromText } from '@/domain/destination';
import { TripDetailsScreen } from '@/features/trip-edit/screens/trip-details-screen';
import { normalizeTrip, type TripLike } from '@/domain/trip-compatibility';
import {
  resetTripEditSaveNoticeHandoffForTests,
  stageTripEditPackingNotice,
} from '@/features/trip-edit/utils/trip-edit-save-notice-handoff';

const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush, navigate: jest.fn() }),
  useLocalSearchParams: () => ({ returnTo: 'overview' }),
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

const mockTrip = normalizeTrip({
  id: 'trip-details-test',
  name: 'Test trip',
  title: 'Test trip',
  destination: createDestinationFromText('Oslo', 'Norway'),
  startDate: '2026-07-01',
  endDate: '2026-07-10',
  tripContext: ['City'],
  accommodation: 'hotel',
  laundry: 'yes',
  note: '',
  status: 'upcoming',
  generated: true,
  packingMode: 'generated',
  items: [],
  travelers: [],
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
    activeTrip: mockTrip,
    activeTripId: mockTrip.id,
  }),
}));

describe('TripDetailsScreen packing notice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetTripEditSaveNoticeHandoffForTests();
  });

  it('shows the visible packing banner after save staging and hub focus', async () => {
    stageTripEditPackingNotice();

    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<TripDetailsScreen />);
      await Promise.resolve();
    });

    expect(tree.root.findByProps({ testID: 'trip-edit-packing-notice-banner' })).toBeTruthy();
    expect(tree.root.findByProps({ testID: 'trip-edit-packing-notice-title' }).props.children).toBe(
      'Trip updated',
    );
  });

  it('does not show a banner when no packing notice was staged', async () => {
    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<TripDetailsScreen />);
      await Promise.resolve();
    });

    expect(tree.root.findAllByProps({ testID: 'trip-edit-packing-notice-banner' })).toHaveLength(0);
  });
});
