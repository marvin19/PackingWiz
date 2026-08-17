import { useCallback, useEffect, useRef, useState } from 'react';

import {
  GENERATION_FINISH_DELAY_MS,
  GENERATION_STEP_DELAY_MS,
  GENERATION_STEPS,
} from '@/features/trip-creation/constants/generation';
import { useTrips } from '@/hooks/use-trips';

export type TripGenerationStatus = 'idle' | 'running' | 'success' | 'error';

export function useTripGeneration() {
  const { commitDraftTrip } = useTrips();
  const [activeStep, setActiveStep] = useState(0);
  const [status, setStatus] = useState<TripGenerationStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasStartedRef = useRef(false);
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

  useEffect(() => clearStepTimers, [clearStepTimers]);

  const runGeneration = useCallback(async () => {
    if (generationPromiseRef.current) {
      return generationPromiseRef.current;
    }

    const promise = (async () => {
      try {
        await commitDraftTrip();
        setStatus('success');
      } catch (error) {
        clearStepTimers();
        setStatus('error');
        setErrorMessage(
          error instanceof Error ? error.message : 'Something went wrong while building your list.',
        );
        hasStartedRef.current = false;
        generationPromiseRef.current = null;
      }
    })();

    generationPromiseRef.current = promise;
    return promise;
  }, [clearStepTimers, commitDraftTrip]);

  const start = useCallback(() => {
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;
    setStatus('running');
    setErrorMessage(null);
    scheduleStepProgress();
    void runGeneration();
  }, [runGeneration, scheduleStepProgress]);

  const retry = useCallback(() => {
    hasStartedRef.current = false;
    generationPromiseRef.current = null;
    clearStepTimers();
    setStatus('idle');
    setErrorMessage(null);
    setActiveStep(0);
    start();
  }, [clearStepTimers, start]);

  const isReadyToFinish = status === 'success' && activeStep >= GENERATION_STEPS.length;

  return {
    activeStep,
    status,
    errorMessage,
    steps: GENERATION_STEPS,
    start,
    retry,
    isReadyToFinish,
    finishDelayMs: GENERATION_FINISH_DELAY_MS,
  };
}
