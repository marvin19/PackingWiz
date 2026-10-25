import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { createDestinationFromText } from '@/domain/destination';
import { DRAFT_SELF_PROFILE_ID } from '@/domain/trip-draft-profiles';
import type { PackingProfile } from '@/domain/packing-profile';
import type { Trip } from '@/domain/trip';
import type { TripDraft } from '@/domain/trip-draft';
import { TripSummaryScreen } from '@/features/trip-creation/screens/trip-summary-screen';
import { cloneTrip } from '@/lib/clone-trip';
import { mockLisbonTrip, mockMallorcaTrip } from '@/mocks/seed-trips';
import { validNewTripDateRangeForTests } from '@/test-support/valid-new-trip-dates';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockCommitDraftTrip = jest.fn();
const mockSetDraftWizardStep = jest.fn();

const COMMIT_READY_DATES = validNewTripDateRangeForTests();

const baseDraft = {
  id: 'draft-test',
  name: 'Test trip',
  destination: createDestinationFromText('Oslo', 'Norway'),
  startDate: COMMIT_READY_DATES.startDate,
  endDate: COMMIT_READY_DATES.endDate,
  tripContext: ['City'],
  accommodation: 'hotel' as const,
  laundry: 'no' as const,
  note: '',
  bags: [],
  travelers: [],
  packingProfiles: [{ id: DRAFT_SELF_PROFILE_ID, name: 'Me', isSelf: true }],
};

let mockDraft: TripDraft = { ...baseDraft };
let mockRepositoryError: string | null = 'Stale load error from another screen';

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush, navigate: jest.fn() }),
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

jest.mock('@/features/trip-creation/hooks/use-require-active-draft-route', () => ({
  useRequireActiveDraftRoute: () => true,
}));

jest.mock('@/hooks/use-draft-important', () => ({
  useDraftImportant: () => ({ importantByProfileId: {} }),
}));

jest.mock('@/hooks/use-trips', () => ({
  useTrips: () => ({
    draft: mockDraft,
    commitDraftTrip: mockCommitDraftTrip,
    setDraftWizardStep: mockSetDraftWizardStep,
    repositoryError: mockRepositoryError,
  }),
}));

jest.mock('@/features/trip-creation/components/weather-preview', () => ({
  WeatherPreview: 'WeatherPreview',
}));

jest.mock('@/features/trip-creation/components/summary-important-section', () => ({
  SummaryImportantSection: 'SummaryImportantSection',
}));

jest.mock('@/features/trip-creation/components/trip-summary-details-content', () => ({
  TripSummaryDetailsContent: 'TripSummaryDetailsContent',
}));

describe('TripSummaryScreen manual create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDraft = { ...baseDraft };
    mockRepositoryError = 'Stale load error from another screen';
    mockCommitDraftTrip.mockReset();
  });

  async function pressManualCreate(tree: TestRenderer.ReactTestRenderer) {
    const button = tree.root.findByProps({ accessibilityLabel: 'Create packing list manually' });
    await act(async () => {
      await button.props.onPress();
    });
  }

  it('shows an error banner and does not navigate when manual commit fails', async () => {
    mockDraft = { ...baseDraft, note: 'Keep this note' };
    mockCommitDraftTrip.mockRejectedValueOnce(new Error('create failed'));

    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<TripSummaryScreen />);
    });

    expect(() => tree.root.findByProps({ testID: 'summary-manual-create-error-banner' })).toThrow();

    await pressManualCreate(tree);

    expect(mockReplace).not.toHaveBeenCalled();
    expect(tree.root.findByProps({ testID: 'summary-manual-create-error-banner' })).toBeTruthy();
    expect(mockCommitDraftTrip).toHaveBeenCalledTimes(1);
    expect(mockCommitDraftTrip).toHaveBeenCalledWith('manual');
    expect(mockDraft.note).toBe('Keep this note');
  });

  it('does not show stale repository errors as a manual-create failure', async () => {
    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<TripSummaryScreen />);
    });

    expect(() => tree.root.findByProps({ testID: 'summary-manual-create-error-banner' })).toThrow();
  });

  it('clears the error and navigates to Pack after a successful retry', async () => {
    const saved = cloneTrip(mockMallorcaTrip);
    mockCommitDraftTrip
      .mockRejectedValueOnce(new Error('create failed'))
      .mockResolvedValueOnce(saved);

    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<TripSummaryScreen />);
    });

    await pressManualCreate(tree);
    expect(tree.root.findByProps({ testID: 'summary-manual-create-error-banner' })).toBeTruthy();

    mockReplace.mockClear();
    await pressManualCreate(tree);

    expect(() => tree.root.findByProps({ testID: 'summary-manual-create-error-banner' })).toThrow();
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/pack');
    expect(mockCommitDraftTrip).toHaveBeenCalledTimes(2);
  });

  it('navigates to the list picker after successful manual create for multiple travellers', async () => {
    mockDraft = {
      ...baseDraft,
      packingProfiles: [
        { id: DRAFT_SELF_PROFILE_ID, name: 'Me', isSelf: true },
        { id: 'profile-emilie', name: 'Emilie', age: 8, isSelf: false },
      ] satisfies PackingProfile[],
    };
    mockCommitDraftTrip.mockResolvedValueOnce(cloneTrip(mockLisbonTrip));

    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<TripSummaryScreen />);
    });

    const button = tree.root.findByProps({ accessibilityLabel: 'Create packing lists manually' });
    await act(async () => {
      await button.props.onPress();
    });

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/pack/select-list');
  });

  it('ignores duplicate manual-create taps while commit is in flight', async () => {
    let resolveCommit: ((trip: Trip) => void) | undefined;
    mockCommitDraftTrip.mockImplementation(
      () =>
        new Promise<Trip>((resolve) => {
          resolveCommit = resolve;
        }),
    );

    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<TripSummaryScreen />);
    });

    const button = tree.root.findByProps({ accessibilityLabel: 'Create packing list manually' });

    await act(async () => {
      void button.props.onPress();
    });

    await act(async () => {
      await button.props.onPress();
    });

    expect(mockCommitDraftTrip).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveCommit?.(cloneTrip(mockMallorcaTrip));
      await Promise.resolve();
    });
  });
});
