import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { findActiveTrip } from '@/domain/packing-stats';
import { createEmptyTripDraft, type TripDraft } from '@/domain/trip-draft';
import type { Trip } from '@/domain/trip';
import { mockDefaultActiveTripId } from '@/mocks/seed-trips';
import { useServices } from '@/providers/services-provider';
import { assembleTripFromDraft } from '@/services/trip-assembly';

export type AppTab = 'trips' | 'pack' | 'profile';

interface TripsContextValue {
  trips: Trip[];
  activeTripId: string | null;
  activeTrip: Trip | null;
  draft: TripDraft;
  isLoading: boolean;
  setActiveTripId: (tripId: string | null) => void;
  setDraft: (patch: Partial<TripDraft>) => void;
  resetDraft: () => void;
  refreshTrips: () => Promise<void>;
  commitDraftTrip: () => Promise<Trip>;
}

const TripsContext = createContext<TripsContextValue | null>(null);

export function TripsProvider({ children }: { children: ReactNode }) {
  const { tripRepository, packingGenerator, weatherService } = useServices();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripId] = useState<string | null>(mockDefaultActiveTripId);
  const [draft, setDraftState] = useState<TripDraft>(createEmptyTripDraft());
  const [isLoading, setIsLoading] = useState(true);

  const refreshTrips = useCallback(async () => {
    const loaded = await tripRepository.getAll();
    setTrips(loaded);
  }, [tripRepository]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const loaded = await tripRepository.getAll();
        if (mounted) {
          setTrips(loaded);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [tripRepository]);

  const setDraft = useCallback((patch: Partial<TripDraft>) => {
    setDraftState((current) => ({ ...current, ...patch }));
  }, []);

  const resetDraft = useCallback(() => {
    setDraftState(createEmptyTripDraft());
  }, []);

  const commitDraftTrip = useCallback(async () => {
    const assembled = await assembleTripFromDraft(draft, {
      packingGenerator,
      weatherService,
    });
    const saved = await tripRepository.save(assembled);
    setTrips((current) => {
      const withoutDuplicate = current.filter((trip) => trip.id !== saved.id);
      return [saved, ...withoutDuplicate];
    });
    setActiveTripId(saved.id);
    return saved;
  }, [draft, packingGenerator, weatherService, tripRepository]);

  const activeTrip = useMemo(
    () => findActiveTrip(trips, activeTripId),
    [trips, activeTripId],
  );

  const value = useMemo<TripsContextValue>(
    () => ({
      trips,
      activeTripId,
      activeTrip,
      draft,
      isLoading,
      setActiveTripId,
      setDraft,
      resetDraft,
      refreshTrips,
      commitDraftTrip,
    }),
    [
      trips,
      activeTripId,
      activeTrip,
      draft,
      isLoading,
      setDraft,
      resetDraft,
      refreshTrips,
      commitDraftTrip,
    ],
  );

  return <TripsContext.Provider value={value}>{children}</TripsContext.Provider>;
}

export function useTrips(): TripsContextValue {
  const context = useContext(TripsContext);
  if (!context) {
    throw new Error('useTrips must be used within a TripsProvider');
  }
  return context;
}
