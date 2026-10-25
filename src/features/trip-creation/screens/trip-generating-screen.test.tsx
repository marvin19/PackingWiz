import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import {
  GENERATION_FINISH_DELAY_MS,
  GENERATION_STEP_DELAY_MS,
  GENERATION_STEPS,
} from '@/features/trip-creation/constants/generation';
import { TripGeneratingScreen } from '@/features/trip-creation/screens/trip-generating-screen';
import { cloneTrip } from '@/lib/clone-trip';
import { mockLisbonTrip, mockMallorcaTrip } from '@/mocks/seed-trips';

const mockReplace = jest.fn();
const mockCommitDraftTrip = jest.fn();

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), navigate: jest.fn() }),
}));

jest.mock('@/hooks/use-theme', () => {
  const { theme } = jest.requireActual('@/theme') as typeof import('@/theme');
  return { useTheme: () => theme };
});

jest.mock('@/hooks/use-trips', () => {
  const { createDestinationFromText } = jest.requireActual('@/domain/destination') as typeof import('@/domain/destination');
  return {
    useTrips: () => ({
      draft: { destination: createDestinationFromText('Oslo', 'Norway') },
      commitDraftTrip: mockCommitDraftTrip,
    }),
  };
});

describe('TripGeneratingScreen navigation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockReplace.mockReset();
    mockCommitDraftTrip.mockReset();
    mockCommitDraftTrip.mockResolvedValue(cloneTrip(mockMallorcaTrip));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not replace to Pack before the fifth illustrative step completes', async () => {
    await act(async () => {
      TestRenderer.create(<TripGeneratingScreen />);
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(GENERATION_STEP_DELAY_MS * 2);
    });

    expect(mockReplace).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(
        GENERATION_STEP_DELAY_MS * (GENERATION_STEPS.length - 2),
      );
    });

    expect(mockReplace).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(GENERATION_FINISH_DELAY_MS);
    });

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/pack');
  });

  it('routes multi-list trips to the packing list picker after the full sequence', async () => {
    mockCommitDraftTrip.mockResolvedValueOnce(cloneTrip(mockLisbonTrip));

    await act(async () => {
      TestRenderer.create(<TripGeneratingScreen />);
      await Promise.resolve();
    });

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(GENERATION_STEP_DELAY_MS * GENERATION_STEPS.length);
    });

    await act(async () => {
      jest.advanceTimersByTime(GENERATION_FINISH_DELAY_MS);
    });

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/pack/select-list');
  });

  it('does not navigate when commit fails', async () => {
    mockCommitDraftTrip.mockRejectedValueOnce(new Error('Commit failed'));

    await act(async () => {
      TestRenderer.create(<TripGeneratingScreen />);
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(
        GENERATION_STEP_DELAY_MS * GENERATION_STEPS.length + GENERATION_FINISH_DELAY_MS,
      );
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
