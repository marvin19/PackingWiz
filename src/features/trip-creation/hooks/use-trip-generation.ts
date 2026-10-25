import { useCallback, useEffect, useRef, useState } from 'react';

import type { Trip } from '@/domain/trip';
import {
  GENERATION_FINISH_DELAY_MS,
  GENERATION_STEP_DELAY_MS,
  GENERATION_STEPS,
  isGenerationReadyToNavigate,
} from '@/features/trip-creation/constants/generation';
import { useTrips } from '@/hooks/use-trips';

export type TripGenerationStatus = 'idle' | 'running' | 'success' | 'error';

export function useTripGeneration() {
  const { commitDraftTrip } = useTrips();
  const commitDraftTripRef = useRef(commitDraftTrip);

  useEffect(() => {
    commitDraftTripRef.current = commitDraftTrip;
  }, [commitDraftTrip]);

  const [activeStep, setActiveStep] = useState(0);
  const [status, setStatus] = useState<TripGenerationStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdTrip, setCreatedTrip] = useState<Trip | null>(null);
  const [runId, setRunId] = useState(0);

  const generationPromiseRef = useRef<Promise<void> | null>(null);
  const stepTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearStepTimers = useCallback(() => {
    stepTimersRef.current.forEach(clearTimeout);
    stepTimersRef.current = [];
  }, []);

  const scheduleStepProgress = useCallback(() => {
    clearStepTimers();
    setActiveStep(0);

    stepTimersRef.current = GENERATION_STEPS.map((_label, index) =>
      setTimeout(() => {
        setActiveStep(index + 1);
      }, GENERATION_STEP_DELAY_MS * (index + 1)),
    );
  }, [clearStepTimers]);

  const runGeneration = useCallback(async (isActive: () => boolean) => {
    if (generationPromiseRef.current) {
      return generationPromiseRef.current;
    }

    const promise = (async () => {
      try {
        const saved = await commitDraftTripRef.current();
        if (!isActive()) {
          return;
        }
        setCreatedTrip(saved);
        setStatus('success');
      } catch (error) {
        if (!isActive()) {
          return;
        }
        clearStepTimers();
        setStatus('error');
        setErrorMessage(
          error instanceof Error ? error.message : 'Something went wrong while building your list.',
        );
        generationPromiseRef.current = null;
      }
    })();

    generationPromiseRef.current = promise;
    return promise;
  }, [clearStepTimers]);

  useEffect(() => {
    let cancelled = false;
    const isActive = () => !cancelled;

    // Bootstrap generation when the screen mounts or the user retries after an error.
    /* eslint-disable react-hooks/set-state-in-effect -- orchestrates timers + async commit together */
    setStatus('running');
    setErrorMessage(null);
    setCreatedTrip(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    scheduleStepProgress();
    void runGeneration(isActive);

    return () => {
      cancelled = true;
      clearStepTimers();
      generationPromiseRef.current = null;
    };
  }, [runId, clearStepTimers, runGeneration, scheduleStepProgress]);

  const retry = useCallback(() => {
    setRunId((current) => current + 1);
  }, []);

  const isReadyToFinish = isGenerationReadyToNavigate(status, activeStep);

  return {
    activeStep,
    status,
    errorMessage,
    createdTrip,
    steps: GENERATION_STEPS,
    retry,
    isReadyToFinish,
    finishDelayMs: GENERATION_FINISH_DELAY_MS,
  };
}
