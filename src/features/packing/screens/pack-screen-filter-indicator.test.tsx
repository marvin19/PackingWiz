import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { createDestinationFromText } from '@/domain/destination';
import type { Trip } from '@/domain/trip';
import { normalizeTrip, type TripLike } from '@/domain/trip-compatibility';
import { PackScreen } from '@/features/packing/screens/pack-screen';

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
  Ionicons: 'Ionicons',
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

function createEditableTrip(): Trip {
  return normalizeTrip({
    id: 'trip-editable-pack',
    name: 'Summer',
    title: 'Summer',
    destination: createDestinationFromText('Oslo', 'Norway'),
    startDate: '2027-06-01',
    endDate: '2027-06-10',
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
        id: 'list-editable',
        packingProfileId: 'profile-self',
        profileSnapshot: { id: 'profile-self', name: 'Me', isSelf: true },
        packingMode: 'generated',
        items: [
          {
            id: 'item-open',
            name: 'Shirt',
            quantity: 1,
            category: 'Clothing',
            packed: false,
            needToBuy: false,
            assignedTo: null,
          },
          {
            id: 'item-buy',
            name: 'Sunscreen',
            quantity: 1,
            category: 'Toiletries',
            packed: false,
            needToBuy: true,
            assignedTo: null,
          },
        ],
      },
    ],
  } as TripLike);
}

const mockTrip = createEditableTrip();

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

function findHeaderFilterButton(root: TestRenderer.ReactTestInstance) {
  return root.find(
    (node) => node.props.accessibilityLabel === 'Filter packing list',
  );
}

function filterSheetTitleVisible(root: TestRenderer.ReactTestInstance): boolean {
  return root
    .findAll((node) => typeof node.props.children === 'string' && node.props.children === 'Filter list')
    .length > 0;
}

describe('PackScreen filter indicator (PW-004D)', () => {
  it('shows header filter control on editable trips', async () => {
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(<PackScreen />);
    });

    expect(findHeaderFilterButton(tree!.root)).toBeDefined();
  });

  it('opens PackFilterSheet from the header filter button', async () => {
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(<PackScreen />);
    });

    expect(filterSheetTitleVisible(tree!.root)).toBe(false);

    await act(async () => {
      findHeaderFilterButton(tree!.root).props.onPress();
    });

    expect(filterSheetTitleVisible(tree!.root)).toBe(true);
  });

  it('updates header indicator after selecting a filter in the sheet', async () => {
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(<PackScreen />);
    });

    await act(async () => {
      findHeaderFilterButton(tree!.root).props.onPress();
    });

    const todoOption = tree!.root.find(
      (node) =>
        typeof node.props.accessibilityLabel === 'string' &&
        node.props.accessibilityLabel.startsWith('To pack,') &&
        node.props.accessibilityLabel.endsWith(' items'),
    );

    await act(async () => {
      todoOption.props.onPress();
    });

    const activeHeader = tree!.root.find(
      (node) => node.props.accessibilityLabel === 'Filter packing list, To pack active',
    );
    expect(activeHeader).toBeDefined();
  });

  it('does not expose Filter inside Trip menu (PW-004D-A)', async () => {
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(<PackScreen />);
    });

    const tripMenu = tree!.root.find((node) => node.props.accessibilityLabel === 'Trip menu');
    await act(async () => {
      tripMenu.props.onPress();
    });

    const filterRows = tree!.root.findAll(
      (node) =>
        node.props.accessibilityLabel === 'Filter' ||
        (typeof node.props.accessibilityLabel === 'string' &&
          node.props.accessibilityLabel.startsWith('Filter,')),
    );
    expect(filterRows).toHaveLength(0);

    const insightRows = tree!.root.findAll(
      (node) => node.props.accessibilityLabel === 'Insights',
    );
    expect(insightRows.length).toBeGreaterThan(0);
  });
});