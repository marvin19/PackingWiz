import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { createDestinationFromText } from '@/domain/destination';
import type { Trip } from '@/domain/trip';
import { normalizeTrip, type TripLike } from '@/domain/trip-compatibility';
import { PackScreen } from '@/features/packing/screens/pack-screen';

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), navigate: jest.fn() }),
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

jest.mock('@/hooks/use-profile', () => ({
  useProfile: () => ({
    getImportantConfigForProfile: () => ({
      items: [],
      updatedAt: '2027-01-02T10:00:00.000Z',
    }),
    getEnabledImportantItemsForProfile: () => [],
    getImportantItemsForProfile: () => [],
    isImportantFeatureActiveForProfile: () => false,
    getImportantMasterVersionForProfile: () => 'v1',
    resolveImportantProfileId: () => 'profile-self',
    requestOpenImportantEditor: jest.fn(),
    dismissImportantStaleNotice: jest.fn(),
    isImportantStaleNoticeDismissed: () => false,
  }),
}));

jest.mock('@/features/trip-creation/hooks/use-acknowledge-post-create-navigation', () => ({
  useAcknowledgePostCreateNavigation: () => {},
}));

jest.mock('@/features/packing/hooks/use-packed-celebration', () => ({
  usePackedCelebration: () => ({
    visible: false,
    dismiss: jest.fn(),
  }),
}));

function createPackTrip(overrides: Partial<TripLike> = {}): Trip {
  return normalizeTrip({
    id: 'trip-pack-identity',
    name: 'Kirsebærblomstring',
    title: 'Kirsebærblomstring',
    isTripNameUserEdited: true,
    destination: createDestinationFromText('Tokyo & Kyoto', 'Japan'),
    startDate: '2027-04-01',
    endDate: '2027-04-14',
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
    weather: { mode: 'climate', summary: 'Mild', detail: '', high: 18, low: 8 },
    insights: [],
    packingLists: [
      {
        id: 'list-identity',
        packingProfileId: 'profile-self',
        profileSnapshot: { id: 'profile-self', name: 'Me', isSelf: true },
        packingMode: 'generated',
        items: [
          {
            id: 'item-1',
            name: 'Shirt',
            quantity: 1,
            category: 'Clothing',
            packed: false,
            needToBuy: false,
            assignedTo: null,
          },
        ],
      },
    ],
    ...overrides,
  } as TripLike);
}

let mockTrip = createPackTrip();

jest.mock('@/hooks/use-trips', () => ({
  useTrips: () => ({
    activeTrip: mockTrip,
    activeTripId: mockTrip.id,
    activePackingList: mockTrip.packingLists[0],
    activePackingListId: mockTrip.packingLists[0]!.id,
    isCommitDraftInFlight: false,
    selectActivePackingList: jest.fn(),
    togglePacked: jest.fn(),
    markItemPurchased: jest.fn(),
    syncImportantSnapshotForList: jest.fn(),
  }),
}));

describe('PackScreen trip identity header (PW-TECH-001H-A)', () => {
  beforeEach(() => {
    mockTrip = createPackTrip();
  });

  it('renders destination subtitle and heading label beside the progress ring', async () => {
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(<PackScreen />);
    });

    expect(
      tree!.root.findByProps({
        accessibilityLabel: 'Kirsebærblomstring, Tokyo & Kyoto, Japan',
        accessibilityRole: 'header',
      }),
    ).toBeTruthy();
    expect(tree!.root.findByProps({ children: 'Tokyo & Kyoto, Japan' })).toBeTruthy();
    expect(tree!.root.findByProps({ accessibilityRole: 'progressbar' })).toBeTruthy();
  });

  it('omits redundant destination subtitle when the display name matches the location line', async () => {
    mockTrip = createPackTrip({
      name: '',
      title: 'Oslo',
      isTripNameUserEdited: false,
      destination: createDestinationFromText('Oslo'),
    });

    let tree: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<PackScreen />);
    });

    expect(tree!.root.findByProps({ accessibilityLabel: 'Oslo', accessibilityRole: 'header' })).toBeTruthy();
    const locationNodes = tree!.root.findAll(
      (node) => node.props.children === 'Oslo' && node.props.color === 'mutedForeground',
    );
    expect(locationNodes).toHaveLength(0);
  });

  it('does not duplicate text when the custom name equals the destination line', async () => {
    mockTrip = createPackTrip({
      name: 'Madrid',
      title: 'Madrid',
      isTripNameUserEdited: true,
      destination: createDestinationFromText('Madrid'),
    });

    let tree: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<PackScreen />);
    });

    expect(tree!.root.findByProps({ accessibilityLabel: 'Madrid', accessibilityRole: 'header' })).toBeTruthy();
    const destinationSubtitles = tree!.root.findAll(
      (node) => node.props.children === 'Madrid' && node.props.color === 'mutedForeground',
    );
    expect(destinationSubtitles).toHaveLength(0);
  });

});