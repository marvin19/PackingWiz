import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { createDestinationFromText } from '@/domain/destination';
import type { Trip } from '@/domain/trip';
import { normalizeTrip, type TripLike } from '@/domain/trip-compatibility';
import { PackScreen } from '@/features/packing/screens/pack-screen';
import { TRIP_PACK_READ_ONLY_MESSAGE } from '@/features/packing/components/trip-read-only-banner';

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
      items: [{ id: 'imp-1', name: 'Passport', enabled: true }],
      updatedAt: '2026-01-02T10:00:00.000Z',
    }),
    getEnabledImportantItemsForProfile: () => [{ id: 'imp-2', name: 'Meds', enabled: true }],
    getImportantItemsForProfile: () => [],
    isImportantFeatureActiveForProfile: () => true,
    getImportantMasterVersionForProfile: () => 'v2',
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

function createPastTrip(): Trip {
  return normalizeTrip({
    id: 'trip-past-pack',
    name: 'Past trip',
    title: 'Past trip',
    destination: createDestinationFromText('Bergen', 'Norway'),
    startDate: '2020-06-01',
    endDate: '2020-06-10',
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
        id: 'list-past',
        packingProfileId: 'profile-self',
        profileSnapshot: { id: 'profile-self', name: 'Me', isSelf: true },
        packingMode: 'generated',
        items: [
          {
            id: 'item-packed',
            name: 'Shirt',
            quantity: 1,
            category: 'Clothing',
            packed: true,
            needToBuy: false,
            assignedTo: null,
          },
        ],
      },
    ],
  } as TripLike);
}

const mockTrip = createPastTrip();

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

describe('PackScreen read-only (PW-004E-B)', () => {
  it('shows banner, non-checkbox rows, and hides add/settings affordances', async () => {
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(<PackScreen />);
    });

    const bannerNodes = tree!.root.findAll(
      (node) => node.props.accessibilityLabel === TRIP_PACK_READ_ONLY_MESSAGE,
    );
    expect(bannerNodes.length).toBeGreaterThan(0);

    const fabNodes = tree!.root.findAll(
      (node) => node.props.accessibilityLabel === 'Add item',
    );
    expect(fabNodes).toHaveLength(0);

    const checkboxNodes = tree!.root.findAll(
      (node) => node.props.accessibilityRole === 'checkbox',
    );
    expect(checkboxNodes).toHaveLength(0);

    const staleNodes = tree!.root.findAll(
      (node) => node.props.accessibilityLabel === 'Update this list',
    );
    expect(staleNodes).toHaveLength(0);

    const menuNodes = tree!.root.findAll(
      (node) => node.props.accessibilityLabel === 'Trip menu',
    );
    expect(menuNodes.length).toBeGreaterThan(0);

    const filterNodes = tree!.root.findAll(
      (node) => node.props.accessibilityLabel === 'Filter packing list',
    );
    expect(filterNodes.length).toBeGreaterThan(0);
  });
});