import React, { StrictMode } from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import {
  GENERATION_FINISH_DELAY_MS,
  GENERATION_STEP_DELAY_MS,
  GENERATION_STEPS,
  isGenerationReadyToNavigate,
} from '@/features/trip-creation/constants/generation';
import { useTripGeneration } from '@/features/trip-creation/hooks/use-trip-generation';
import { cloneTrip } from '@/lib/clone-trip';
import { mockMallorcaTrip } from '@/mocks/seed-trips';

const mockCommitDraftTrip = jest.fn();

jest.mock('@/hooks/use-trips', () => ({
  useTrips: () => ({
    commitDraftTrip: mockCommitDraftTrip,
  }),
}));

type GenerationSnapshot = {
  activeStep: number;
  status: string;
  isReadyToFinish: boolean;
  createdTripId: string | null;
};

function GenerationProbe({ onChange }: { onChange: (snapshot: GenerationSnapshot) => void }) {
  const { activeStep, status, isReadyToFinish, createdTrip } = useTripGeneration();

  React.useEffect(() => {
    onChange({
      activeStep,
      status,
      isReadyToFinish,
      createdTripId: createdTrip?.id ?? null,
    });
  }, [activeStep, createdTrip, isReadyToFinish, onChange, status]);

  return null;
}

describe('useTripGeneration', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockCommitDraftTrip.mockReset();
    mockCommitDraftTrip.mockResolvedValue(cloneTrip(mockMallorcaTrip));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not become ready to finish before the fifth step on fast commit', async () => {
    let latest!: GenerationSnapshot;
    const onChange = jest.fn((snapshot: GenerationSnapshot) => {
      latest = snapshot;
    });

    await act(async () => {
      TestRenderer.create(<GenerationProbe onChange={onChange} />);
      await Promise.resolve();
    });

    expect(mockCommitDraftTrip).toHaveBeenCalledTimes(1);
    await act(async () => {
      await Promise.resolve();
    });
    expect(latest.status).toBe('success');

    await act(async () => {
      jest.advanceTimersByTime(GENERATION_STEP_DELAY_MS * 2);
    });

    expect(latest.activeStep).toBe(2);
    expect(latest.isReadyToFinish).toBe(false);
    expect(isGenerationReadyToNavigate('success', latest.activeStep)).toBe(false);

    await act(async () => {
      jest.advanceTimersByTime(
        GENERATION_STEP_DELAY_MS * (GENERATION_STEPS.length - 2),
      );
    });

    expect(latest.activeStep).toBe(GENERATION_STEPS.length);
    expect(latest.isReadyToFinish).toBe(true);
  });

  it('reschedules step timers after strict-mode-style remount cleanup', async () => {
    let latest!: GenerationSnapshot;
    const onChange = jest.fn((snapshot: GenerationSnapshot) => {
      latest = snapshot;
    });

    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <StrictMode>
          <GenerationProbe onChange={onChange} />
        </StrictMode>,
      );
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(GENERATION_STEP_DELAY_MS);
    });

    expect(latest.activeStep).toBeGreaterThanOrEqual(1);

    await act(async () => {
      renderer.unmount();
    });

    await act(async () => {
      TestRenderer.create(<GenerationProbe onChange={onChange} />);
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(GENERATION_STEP_DELAY_MS * GENERATION_STEPS.length);
    });

    expect(latest.activeStep).toBe(GENERATION_STEPS.length);
    expect(latest.isReadyToFinish).toBe(true);
  });

  it('never reaches ready-to-finish when commit fails', async () => {
    mockCommitDraftTrip.mockRejectedValueOnce(new Error('Mock failure'));

    let latest!: GenerationSnapshot;
    const onChange = jest.fn((snapshot: GenerationSnapshot) => {
      latest = snapshot;
    });

    await act(async () => {
      TestRenderer.create(<GenerationProbe onChange={onChange} />);
      await Promise.resolve();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(latest.status).toBe('error');
    expect(latest.isReadyToFinish).toBe(false);

    await act(async () => {
      jest.advanceTimersByTime(GENERATION_STEP_DELAY_MS * GENERATION_STEPS.length);
    });

    expect(latest.isReadyToFinish).toBe(false);
  });

  it('clears timers on failed commit so steps stop advancing', async () => {
    mockCommitDraftTrip.mockRejectedValueOnce(new Error('Mock failure'));

    let latest!: GenerationSnapshot;
    const onChange = jest.fn((snapshot: GenerationSnapshot) => {
      latest = snapshot;
    });

    await act(async () => {
      TestRenderer.create(<GenerationProbe onChange={onChange} />);
      await Promise.resolve();
      await Promise.resolve();
    });

    const stepAtError = latest.activeStep;

    await act(async () => {
      jest.advanceTimersByTime(GENERATION_STEP_DELAY_MS * GENERATION_STEPS.length);
    });

    expect(latest.status).toBe('error');
    expect(latest.activeStep).toBe(stepAtError);
  });

  it('documents finish delay after animation completes', () => {
    expect(GENERATION_FINISH_DELAY_MS).toBe(700);
  });
});
