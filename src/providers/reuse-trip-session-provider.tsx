import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

import type { Trip } from '@/domain/trip';
import {
  createReuseFormStateFromTrip,
  type ReuseTripFormState,
} from '@/features/trips/utils/reuse-trip-view-model';

type ReuseTripSessionContextValue = {
  getForm: (sourceTripId: string) => ReuseTripFormState | null;
  ensureForm: (sourceTrip: Trip) => ReuseTripFormState;
  updateForm: (sourceTripId: string, patch: Partial<ReuseTripFormState>) => void;
  clearForm: (sourceTripId: string) => void;
};

const ReuseTripSessionContext = createContext<ReuseTripSessionContextValue | null>(null);

export function ReuseTripSessionProvider({ children }: { children: ReactNode }) {
  const sessionsRef = useRef<Map<string, ReuseTripFormState>>(new Map());

  const getForm = useCallback((sourceTripId: string) => {
    return sessionsRef.current.get(sourceTripId) ?? null;
  }, []);

  const ensureForm = useCallback((sourceTrip: Trip) => {
    const existing = sessionsRef.current.get(sourceTrip.id);
    if (existing) {
      return existing;
    }

    const created = createReuseFormStateFromTrip(sourceTrip);
    sessionsRef.current.set(sourceTrip.id, created);
    return created;
  }, []);

  const updateForm = useCallback((sourceTripId: string, patch: Partial<ReuseTripFormState>) => {
    const current = sessionsRef.current.get(sourceTripId);
    if (!current) {
      return;
    }

    sessionsRef.current.set(sourceTripId, { ...current, ...patch });
  }, []);

  const clearForm = useCallback((sourceTripId: string) => {
    sessionsRef.current.delete(sourceTripId);
  }, []);

  const value = useMemo(
    () => ({
      getForm,
      ensureForm,
      updateForm,
      clearForm,
    }),
    [clearForm, ensureForm, getForm, updateForm],
  );

  return (
    <ReuseTripSessionContext.Provider value={value}>{children}</ReuseTripSessionContext.Provider>
  );
}

export function useReuseTripSession() {
  const context = useContext(ReuseTripSessionContext);
  if (!context) {
    throw new Error('useReuseTripSession must be used within ReuseTripSessionProvider');
  }

  return context;
}
