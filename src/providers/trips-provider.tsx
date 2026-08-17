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
import type { PackingCategory, PackingItem } from '@/domain/packing-item';
import { createEmptyTripDraft, type TripDraft } from '@/domain/trip-draft';
import type { Trip } from '@/domain/trip';
import { mockDefaultActiveTripId } from '@/mocks/seed-trips';
import { WIZARD_STEP_COUNT } from '@/features/trip-creation/constants';
import { useServices } from '@/providers/services-provider';
import { assembleTripFromDraft } from '@/services/trip-assembly';

export type AppTab = 'trips' | 'pack' | 'profile';

interface TripsContextValue {
  trips: Trip[];
  activeTripId: string | null;
  activeTrip: Trip | null;
  draft: TripDraft;
  draftWizardStep: number;
  draftReachedSummary: boolean;
  isLoading: boolean;
  setActiveTripId: (tripId: string | null) => void;
  setDraft: (patch: Partial<TripDraft>) => void;
  setDraftWizardStep: (step: number) => void;
  markDraftReachedSummary: () => void;
  resetDraft: () => void;
  refreshTrips: () => Promise<void>;
  commitDraftTrip: () => Promise<Trip>;
  togglePacked: (itemId: string) => void;
  setItemQuantity: (itemId: string, quantity: number) => void;
  toggleNeedToBuy: (itemId: string) => void;
  assignItem: (itemId: string, travelerId: string | null) => void;
  deletePackingItem: (itemId: string) => void;
  addPackingItem: (input: {
    name: string;
    category: PackingCategory;
    quantity?: number;
    needToBuy?: boolean;
    assignedTo?: string | null;
  }) => void;
}

const TripsContext = createContext<TripsContextValue | null>(null);

export function TripsProvider({ children }: { children: ReactNode }) {
  const { tripRepository, packingGenerator, weatherService } = useServices();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripId] = useState<string | null>(mockDefaultActiveTripId);
  const [draft, setDraftState] = useState<TripDraft>(createEmptyTripDraft());
  const [draftWizardStep, setDraftWizardStep] = useState(0);
  const [draftReachedSummary, setDraftReachedSummary] = useState(false);
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
    setDraftWizardStep(0);
    setDraftReachedSummary(false);
  }, []);

  const markDraftReachedSummary = useCallback(() => {
    setDraftReachedSummary(true);
    setDraftWizardStep(WIZARD_STEP_COUNT - 1);
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
    setDraftState(createEmptyTripDraft());
    return saved;
  }, [draft, packingGenerator, weatherService, tripRepository]);

  const updateActiveTripItems = useCallback(
    (updater: (items: PackingItem[]) => PackingItem[]) => {
      setTrips((current) => {
        if (!activeTripId) {
          return current;
        }

        let updatedTrip: Trip | null = null;
        const next = current.map((trip) => {
          if (trip.id !== activeTripId) {
            return trip;
          }

          updatedTrip = { ...trip, items: updater(trip.items) };
          return updatedTrip;
        });

        if (updatedTrip) {
          void tripRepository.save(updatedTrip);
        }

        return next;
      });
    },
    [activeTripId, tripRepository],
  );

  const togglePacked = useCallback(
    (itemId: string) => {
      updateActiveTripItems((items) =>
        items.map((item) => (item.id === itemId ? { ...item, packed: !item.packed } : item)),
      );
    },
    [updateActiveTripItems],
  );

  const setItemQuantity = useCallback(
    (itemId: string, quantity: number) => {
      const nextQuantity = Math.max(1, quantity);
      updateActiveTripItems((items) =>
        items.map((item) => (item.id === itemId ? { ...item, quantity: nextQuantity } : item)),
      );
    },
    [updateActiveTripItems],
  );

  const toggleNeedToBuy = useCallback(
    (itemId: string) => {
      updateActiveTripItems((items) =>
        items.map((item) =>
          item.id === itemId ? { ...item, needToBuy: !item.needToBuy } : item,
        ),
      );
    },
    [updateActiveTripItems],
  );

  const assignItem = useCallback(
    (itemId: string, travelerId: string | null) => {
      updateActiveTripItems((items) =>
        items.map((item) =>
          item.id === itemId ? { ...item, assignedTo: travelerId } : item,
        ),
      );
    },
    [updateActiveTripItems],
  );

  const deletePackingItem = useCallback(
    (itemId: string) => {
      updateActiveTripItems((items) => items.filter((item) => item.id !== itemId));
    },
    [updateActiveTripItems],
  );

  const addPackingItem = useCallback(
    (input: {
      name: string;
      category: PackingCategory;
      quantity?: number;
      needToBuy?: boolean;
      assignedTo?: string | null;
    }) => {
      const trimmed = input.name.trim();
      if (!trimmed) {
        return;
      }

      const newItem: PackingItem = {
        id: `pack-item-${Date.now()}`,
        name: trimmed,
        category: input.category,
        quantity: input.quantity ?? 1,
        packed: false,
        needToBuy: input.needToBuy ?? false,
        assignedTo: input.assignedTo ?? null,
      };

      updateActiveTripItems((items) => [...items, newItem]);
    },
    [updateActiveTripItems],
  );

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
      draftWizardStep,
      draftReachedSummary,
      isLoading,
      setActiveTripId,
      setDraft,
      setDraftWizardStep,
      markDraftReachedSummary,
      resetDraft,
      refreshTrips,
      commitDraftTrip,
      togglePacked,
      setItemQuantity,
      toggleNeedToBuy,
      assignItem,
      deletePackingItem,
      addPackingItem,
    }),
    [
      trips,
      activeTripId,
      activeTrip,
      draft,
      draftWizardStep,
      draftReachedSummary,
      isLoading,
      setDraft,
      markDraftReachedSummary,
      resetDraft,
      refreshTrips,
      commitDraftTrip,
      togglePacked,
      setItemQuantity,
      toggleNeedToBuy,
      assignItem,
      deletePackingItem,
      addPackingItem,
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
