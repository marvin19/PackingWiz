import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { getPersistenceMode } from '@/config/persistence';
import { findActiveTrip } from '@/domain/packing-stats';
import type { PackingCategory, PackingItem } from '@/domain/packing-item';
import { createEmptyTripDraft, type TripDraft } from '@/domain/trip-draft';
import type { Trip } from '@/domain/trip';
import { createPackingItemId } from '@/lib/id';
import { WIZARD_STEP_COUNT } from '@/features/trip-creation/constants';
import { mockDefaultActiveTripId } from '@/mocks/seed-trips';
import { useAuth } from '@/providers/auth-provider';
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
  repositoryError: string | null;
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
  markItemPurchased: (itemId: string) => void;
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

function initialActiveTripId(): string | null {
  return getPersistenceMode() === 'mock' ? mockDefaultActiveTripId : null;
}

export function TripsProvider({ children }: { children: ReactNode }) {
  const { tripRepository, packingGenerator, weatherService } = useServices();
  const { isAuthReady, authError } = useAuth();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripId] = useState<string | null>(initialActiveTripId);
  const [draft, setDraftState] = useState<TripDraft>(createEmptyTripDraft());
  const [draftWizardStep, setDraftWizardStep] = useState(0);
  const [draftReachedSummary, setDraftReachedSummary] = useState(false);
  const [isTripsLoading, setIsTripsLoading] = useState(true);
  const [repositoryError, setRepositoryError] = useState<string | null>(null);
  const tripsRef = useRef(trips);

  useEffect(() => {
    tripsRef.current = trips;
  }, [trips]);

  const isLoading = !isAuthReady || isTripsLoading;

  const refreshTrips = useCallback(async () => {
    const loaded = await tripRepository.getAll();
    setTrips(loaded);
  }, [tripRepository]);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    let mounted = true;

    (async () => {
      try {
        setRepositoryError(authError);
        const loaded = await tripRepository.getAll();
        if (!mounted) {
          return;
        }

        setTrips(loaded);

        if (getPersistenceMode() === 'supabase') {
          setActiveTripId((current) => {
            if (current && loaded.some((trip) => trip.id === current)) {
              return current;
            }
            return loaded[0]?.id ?? null;
          });
        }
      } catch (error) {
        if (mounted) {
          setRepositoryError(error instanceof Error ? error.message : 'Failed to load trips');
        }
      } finally {
        if (mounted) {
          setIsTripsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isAuthReady, authError, tripRepository]);

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
    const saved = await tripRepository.createTrip(assembled);
    setTrips((current) => {
      const withoutDuplicate = current.filter((trip) => trip.id !== saved.id);
      return [saved, ...withoutDuplicate];
    });
    setActiveTripId(saved.id);
    setDraftState(createEmptyTripDraft());
    setRepositoryError(null);
    return saved;
  }, [draft, packingGenerator, weatherService, tripRepository]);

  const rollbackTrips = useCallback((previousTrips: Trip[]) => {
    setTrips(previousTrips);
  }, []);

  const togglePacked = useCallback(
    (itemId: string) => {
      if (!activeTripId) {
        return;
      }

      const previousTrips = tripsRef.current;
      const trip = previousTrips.find((entry) => entry.id === activeTripId);
      const item = trip?.items.find((entry) => entry.id === itemId);
      if (!trip || !item) {
        return;
      }

      const nextPacked = !item.packed;
      setTrips((current) =>
        current.map((entry) =>
          entry.id === activeTripId
            ? {
                ...entry,
                items: entry.items.map((entryItem) =>
                  entryItem.id === itemId ? { ...entryItem, packed: nextPacked } : entryItem,
                ),
              }
            : entry,
        ),
      );

      void tripRepository
        .updatePackingItem(activeTripId, itemId, { packed: nextPacked })
        .catch((error) => {
          rollbackTrips(previousTrips);
          setRepositoryError(error instanceof Error ? error.message : 'Failed to update item');
        });
    },
    [activeTripId, rollbackTrips, tripRepository],
  );

  const setItemQuantity = useCallback(
    (itemId: string, quantity: number) => {
      if (!activeTripId) {
        return;
      }

      const previousTrips = tripsRef.current;
      const nextQuantity = Math.max(1, quantity);

      setTrips((current) =>
        current.map((entry) =>
          entry.id === activeTripId
            ? {
                ...entry,
                items: entry.items.map((entryItem) =>
                  entryItem.id === itemId ? { ...entryItem, quantity: nextQuantity } : entryItem,
                ),
              }
            : entry,
        ),
      );

      void tripRepository
        .updatePackingItem(activeTripId, itemId, { quantity: nextQuantity })
        .catch((error) => {
          rollbackTrips(previousTrips);
          setRepositoryError(error instanceof Error ? error.message : 'Failed to update quantity');
        });
    },
    [activeTripId, rollbackTrips, tripRepository],
  );

  const toggleNeedToBuy = useCallback(
    (itemId: string) => {
      if (!activeTripId) {
        return;
      }

      const previousTrips = tripsRef.current;
      const trip = previousTrips.find((entry) => entry.id === activeTripId);
      const item = trip?.items.find((entry) => entry.id === itemId);
      if (!trip || !item) {
        return;
      }

      const nextNeedToBuy = !item.needToBuy;
      setTrips((current) =>
        current.map((entry) =>
          entry.id === activeTripId
            ? {
                ...entry,
                items: entry.items.map((entryItem) =>
                  entryItem.id === itemId
                    ? { ...entryItem, needToBuy: nextNeedToBuy }
                    : entryItem,
                ),
              }
            : entry,
        ),
      );

      void tripRepository
        .updatePackingItem(activeTripId, itemId, { needToBuy: nextNeedToBuy })
        .catch((error) => {
          rollbackTrips(previousTrips);
          setRepositoryError(error instanceof Error ? error.message : 'Failed to update item');
        });
    },
    [activeTripId, rollbackTrips, tripRepository],
  );

  const markItemPurchased = useCallback(
    (itemId: string) => {
      if (!activeTripId) {
        return;
      }

      const previousTrips = tripsRef.current;
      const trip = previousTrips.find((entry) => entry.id === activeTripId);
      const item = trip?.items.find((entry) => entry.id === itemId);
      if (!trip || !item || !item.needToBuy) {
        return;
      }

      setTrips((current) =>
        current.map((entry) =>
          entry.id === activeTripId
            ? {
                ...entry,
                items: entry.items.map((entryItem) =>
                  entryItem.id === itemId ? { ...entryItem, needToBuy: false } : entryItem,
                ),
              }
            : entry,
        ),
      );

      void tripRepository
        .updatePackingItem(activeTripId, itemId, { needToBuy: false })
        .catch((error) => {
          rollbackTrips(previousTrips);
          setRepositoryError(error instanceof Error ? error.message : 'Failed to update item');
        });
    },
    [activeTripId, rollbackTrips, tripRepository],
  );

  const assignItem = useCallback(
    (itemId: string, travelerId: string | null) => {
      if (!activeTripId) {
        return;
      }

      const previousTrips = tripsRef.current;

      setTrips((current) =>
        current.map((entry) =>
          entry.id === activeTripId
            ? {
                ...entry,
                items: entry.items.map((entryItem) =>
                  entryItem.id === itemId
                    ? { ...entryItem, assignedTo: travelerId }
                    : entryItem,
                ),
              }
            : entry,
        ),
      );

      void tripRepository
        .updatePackingItem(activeTripId, itemId, { assignedTo: travelerId })
        .catch((error) => {
          rollbackTrips(previousTrips);
          setRepositoryError(error instanceof Error ? error.message : 'Failed to assign item');
        });
    },
    [activeTripId, rollbackTrips, tripRepository],
  );

  const deletePackingItem = useCallback(
    (itemId: string) => {
      if (!activeTripId) {
        return;
      }

      const previousTrips = tripsRef.current;

      setTrips((current) =>
        current.map((entry) =>
          entry.id === activeTripId
            ? { ...entry, items: entry.items.filter((entryItem) => entryItem.id !== itemId) }
            : entry,
        ),
      );

      void tripRepository.deletePackingItem(activeTripId, itemId).catch((error) => {
        rollbackTrips(previousTrips);
        setRepositoryError(error instanceof Error ? error.message : 'Failed to delete item');
      });
    },
    [activeTripId, rollbackTrips, tripRepository],
  );

  const addPackingItem = useCallback(
    (input: {
      name: string;
      category: PackingCategory;
      quantity?: number;
      needToBuy?: boolean;
      assignedTo?: string | null;
    }) => {
      if (!activeTripId) {
        return;
      }

      const trimmed = input.name.trim();
      if (!trimmed) {
        return;
      }

      const previousTrips = tripsRef.current;
      const optimisticId = createPackingItemId();
      const optimisticItem: PackingItem = {
        id: optimisticId,
        name: trimmed,
        category: input.category,
        quantity: input.quantity ?? 1,
        packed: false,
        needToBuy: input.needToBuy ?? false,
        assignedTo: input.assignedTo ?? null,
      };

      setTrips((current) =>
        current.map((entry) =>
          entry.id === activeTripId
            ? { ...entry, items: [...entry.items, optimisticItem] }
            : entry,
        ),
      );

      void tripRepository
        .addPackingItem(activeTripId, {
          id: optimisticId,
          name: trimmed,
          category: input.category,
          quantity: input.quantity,
          needToBuy: input.needToBuy,
          assignedTo: input.assignedTo,
        })
        .then((saved) => {
          setTrips((current) =>
            current.map((entry) =>
              entry.id === activeTripId
                ? {
                    ...entry,
                    items: entry.items.map((entryItem) =>
                      entryItem.id === optimisticId ? saved : entryItem,
                    ),
                  }
                : entry,
            ),
          );
        })
        .catch((error) => {
          rollbackTrips(previousTrips);
          setRepositoryError(error instanceof Error ? error.message : 'Failed to add item');
        });
    },
    [activeTripId, rollbackTrips, tripRepository],
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
      repositoryError,
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
      markItemPurchased,
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
      repositoryError,
      setDraft,
      markDraftReachedSummary,
      resetDraft,
      refreshTrips,
      commitDraftTrip,
      togglePacked,
      setItemQuantity,
      toggleNeedToBuy,
      markItemPurchased,
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
