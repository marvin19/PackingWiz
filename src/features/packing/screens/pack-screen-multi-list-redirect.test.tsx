import React, { useEffect } from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { PackScreen } from '@/features/packing/screens/pack-screen';
import { cloneTrip } from '@/lib/clone-trip';
import { mockLisbonTrip } from '@/mocks/seed-trips';

const mockReplace = jest.fn();
let mockIsCommitDraftInFlight = false;
let mockActiveTrip = cloneTrip(mockLisbonTrip);
let mockActivePackingListId: string | null = null;
let invokePackFocus: (() => void) | undefined;

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), navigate: jest.fn() }),
  useFocusEffect: (effect: () => void | (() => void)) => {
    invokePackFocus = () => {
      effect();
    };
  },
}));

jest.mock('@/hooks/use-theme', () => {
  const { theme } = jest.requireActual('@/theme') as typeof import('@/theme');
  return { useTheme: () => theme };
});

jest.mock('@/hooks/use-profile', () => ({
  useProfile: () => ({
    getImportantConfigForProfile: () => null,
    getEnabledImportantItemsForProfile: () => [],
    getImportantItemsForProfile: () => [],
    isImportantFeatureActiveForProfile: () => false,
    getImportantMasterVersionForProfile: () => '',
    resolveImportantProfileId: () => null,
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
    showCelebration: false,
    dismissCelebration: jest.fn(),
  }),
}));

jest.mock('@/hooks/use-trips', () => ({
  useTrips: () => ({
    activeTrip: mockActiveTrip,
    activeTripId: mockActiveTrip.id,
    activePackingList: null,
    activePackingListId: mockActivePackingListId,
    isCommitDraftInFlight: mockIsCommitDraftInFlight,
    selectActivePackingList: jest.fn(),
    togglePacked: jest.fn(),
    markItemPurchased: jest.fn(),
    syncImportantSnapshotForList: jest.fn(),
  }),
}));

function TripStateProbe({ onTripCommitted }: { onTripCommitted: () => void }) {
  useEffect(() => {
    onTripCommitted();
  }, [onTripCommitted]);

  return <PackScreen />;
}

describe('PackScreen multi-list redirect', () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockIsCommitDraftInFlight = false;
    mockActiveTrip = cloneTrip(mockLisbonTrip);
    mockActivePackingListId = null;
    invokePackFocus = undefined;
  });

  it('does not replace to the list picker when Pack is not focused (simulated generating overlay)', async () => {
    await act(async () => {
      TestRenderer.create(
        <TripStateProbe
          onTripCommitted={() => {
            mockIsCommitDraftInFlight = true;
            mockActivePackingListId = null;
          }}
        />,
      );
    });

    expect(invokePackFocus).toBeDefined();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirects to the list picker when Pack gains focus after post-create navigation completes', async () => {
    await act(async () => {
      TestRenderer.create(<PackScreen />);
    });

    mockIsCommitDraftInFlight = false;

    await act(async () => {
      invokePackFocus?.();
    });

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/pack/select-list');
  });

  it('does not redirect while commit navigation is still in flight even when Pack is focused', async () => {
    mockIsCommitDraftInFlight = true;

    await act(async () => {
      TestRenderer.create(<PackScreen />);
    });

    await act(async () => {
      invokePackFocus?.();
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
