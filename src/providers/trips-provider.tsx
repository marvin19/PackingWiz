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

import { findActiveTrip, reconcileActiveTripId } from '@/domain/packing-stats';
import type { ImportantItem } from '@/domain/important-item';
import type { PackingCategory, PackingItem } from '@/domain/packing-item';
import { createEmptyTripDraft, type TripDraft } from '@/domain/trip-draft';
import type { PackingMode, Trip } from '@/domain/trip';
import { createPackingItemId } from '@/lib/id';
import { WIZARD_STEP_COUNT } from '@/features/trip-creation/constants';
import { useAuth } from '@/providers/auth-provider';
import { useProfile } from '@/providers/profile-provider';
import { useServices } from '@/providers/services-provider';
import { assembleTripFromDraft } from '@/services/trip-assembly';
import { mergeImportantItems } from '@/services/packing/merge-important-items';
import { syncTripImportantSnapshot } from '@/services/packing/sync-important-snapshot';

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
  commitDraftTrip: (packingMode?: PackingMode) => Promise<Trip>;
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
  injectImportantItemsIntoTrip: (tripId: string, importantItems: ImportantItem[]) => void;
  syncImportantSnapshotForTrip: (tripId: string, importantItems: ImportantItem[]) => void;
}

const TripsContext = createContext<TripsContextValue | null>(null);

export function TripsProvider({ children }: { children: ReactNode }) {
  const { tripRepository, packingGenerator, weatherService } = useServices();
  const { isAuthReady, authError } = useAuth();
  const { enabledImportantItems } = useProfile();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [draft, setDraftState] = useState<TripDraft>(createEmptyTripDraft());
  const [draftWizardStep, setDraftWizardStep] = useState(0);
  const [draftReachedSummary, setDraftReachedSummary] = useState(false);
  const [isTripsLoading, setIsTripsLoading] = useState(true);
  const [repositoryError, setRepositoryError] = useState<string | null>(null);
  const tripsRef = useRef(trips);
  const commitDraftInFlightRef = useRef<Promise<Trip> | null>(null);

  useEffect(() => {
    tripsRef.current = trips;
  }, [trips]);

  const isLoading = !isAuthReady || isTripsLoading;

  const refreshTrips = useCallback(async () => {
    const loaded = await tripRepository.getAll();
    setTrips(loaded);
    setActiveTripId((current) => reconcileActiveTripId(current, loaded));
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
        setActiveTripId((current) => reconcileActiveTripId(current, loaded));
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

  const commitDraftTrip = useCallback(
    async (packingMode: PackingMode = 'generated') => {
      if (commitDraftInFlightRef.current) {
        return commitDraftInFlightRef.current;
      }

      const promise = (async () => {
        const assembled = await assembleTripFromDraft(
          draft,
          {
            packingGenerator,
            weatherService,
          },
          { packingMode, importantItems: enabledImportantItems },
        );
        const saved = await tripRepository.createTrip(assembled);
        setTrips((current) => {
          const withoutDuplicate = current.filter((trip) => trip.id !== saved.id);
          return [saved, ...withoutDuplicate];
        });
        setActiveTripId(saved.id);
        setDraftState(createEmptyTripDraft());
        setDraftWizardStep(0);
        setDraftReachedSummary(false);
        setRepositoryError(null);
        return saved;
      })().catch((error) => {
        setRepositoryError(error instanceof Error ? error.message : 'Failed to create trip');
        throw error;
      });

      commitDraftInFlightRef.current = promise;

      try {
        return await promise;
      } finally {
        commitDraftInFlightRef.current = null;
      }
    },
    [draft, enabledImportantItems, packingGenerator, weatherService, tripRepository],
  );

  const togglePacked = useCallback(
    (itemId: string) => {
      if (!activeTripId) {
        return;
      }

      const trip = tripsRef.current.find((entry) => entry.id === activeTripId);
      const item = trip?.items.find((entry) => entry.id === itemId);
      if (!trip || !item) {
        return;
      }

      const previousPacked = item.packed;
      const nextPacked = !previousPacked;
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
          setTrips((current) =>
            current.map((entry) =>
              entry.id === activeTripId
                ? {
                    ...entry,
                    items: entry.items.map((entryItem) =>
                      entryItem.id === itemId
                        ? { ...entryItem, packed: previousPacked }
                        : entryItem,
                    ),
                  }
                : entry,
            ),
          );
          setRepositoryError(error instanceof Error ? error.message : 'Failed to update item');
        });
    },
    [activeTripId, tripRepository],
  );

  const setItemQuantity = useCallback(
    (itemId: string, quantity: number) => {
      if (!activeTripId) {
        return;
      }

      const trip = tripsRef.current.find((entry) => entry.id === activeTripId);
      const item = trip?.items.find((entry) => entry.id === itemId);
      if (!trip || !item) {
        return;
      }

      const previousQuantity = item.quantity;
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
          setTrips((current) =>
            current.map((entry) =>
              entry.id === activeTripId
                ? {
                    ...entry,
                    items: entry.items.map((entryItem) =>
                      entryItem.id === itemId
                        ? { ...entryItem, quantity: previousQuantity }
                        : entryItem,
                    ),
                  }
                : entry,
            ),
          );
          setRepositoryError(error instanceof Error ? error.message : 'Failed to update quantity');
        });
    },
    [activeTripId, tripRepository],
  );

  const toggleNeedToBuy = useCallback(
    (itemId: string) => {
      if (!activeTripId) {
        return;
      }

      const trip = tripsRef.current.find((entry) => entry.id === activeTripId);
      const item = trip?.items.find((entry) => entry.id === itemId);
      if (!trip || !item) {
        return;
      }

      const previousNeedToBuy = item.needToBuy;
      const nextNeedToBuy = !previousNeedToBuy;
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
          setTrips((current) =>
            current.map((entry) =>
              entry.id === activeTripId
                ? {
                    ...entry,
                    items: entry.items.map((entryItem) =>
                      entryItem.id === itemId
                        ? { ...entryItem, needToBuy: previousNeedToBuy }
                        : entryItem,
                    ),
                  }
                : entry,
            ),
          );
          setRepositoryError(error instanceof Error ? error.message : 'Failed to update item');
        });
    },
    [activeTripId, tripRepository],
  );

  const markItemPurchased = useCallback(
    (itemId: string) => {
      if (!activeTripId) {
        return;
      }

      const trip = tripsRef.current.find((entry) => entry.id === activeTripId);
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
          setTrips((current) =>
            current.map((entry) =>
              entry.id === activeTripId
                ? {
                    ...entry,
                    items: entry.items.map((entryItem) =>
                      entryItem.id === itemId
                        ? { ...entryItem, needToBuy: true }
                        : entryItem,
                    ),
                  }
                : entry,
            ),
          );
          setRepositoryError(error instanceof Error ? error.message : 'Failed to update item');
        });
    },
    [activeTripId, tripRepository],
  );

  const assignItem = useCallback(
    (itemId: string, travelerId: string | null) => {
      if (!activeTripId) {
        return;
      }

      const trip = tripsRef.current.find((entry) => entry.id === activeTripId);
      const item = trip?.items.find((entry) => entry.id === itemId);
      if (!trip || !item) {
        return;
      }

      const previousAssignedTo = item.assignedTo;

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
          setTrips((current) =>
            current.map((entry) =>
              entry.id === activeTripId
                ? {
                    ...entry,
                    items: entry.items.map((entryItem) =>
                      entryItem.id === itemId
                        ? { ...entryItem, assignedTo: previousAssignedTo }
                        : entryItem,
                    ),
                  }
                : entry,
            ),
          );
          setRepositoryError(error instanceof Error ? error.message : 'Failed to assign item');
        });
    },
    [activeTripId, tripRepository],
  );

  const deletePackingItem = useCallback(
    (itemId: string) => {
      if (!activeTripId) {
        return;
      }

      const trip = tripsRef.current.find((entry) => entry.id === activeTripId);
      const item = trip?.items.find((entry) => entry.id === itemId);
      if (!trip || !item) {
        return;
      }

      setTrips((current) =>
        current.map((entry) =>
          entry.id === activeTripId
            ? { ...entry, items: entry.items.filter((entryItem) => entryItem.id !== itemId) }
            : entry,
        ),
      );

      void tripRepository.deletePackingItem(activeTripId, itemId).catch((error) => {
        setTrips((current) =>
          current.map((entry) =>
            entry.id === activeTripId
              ? { ...entry, items: [...entry.items, item] }
              : entry,
          ),
        );
        setRepositoryError(error instanceof Error ? error.message : 'Failed to delete item');
      });
    },
    [activeTripId, tripRepository],
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
          setTrips((current) =>
            current.map((entry) =>
              entry.id === activeTripId
                ? {
                    ...entry,
                    items: entry.items.filter((entryItem) => entryItem.id !== optimisticId),
                  }
                : entry,
            ),
          );
          setRepositoryError(error instanceof Error ? error.message : 'Failed to add item');
        });
    },
    [activeTripId, tripRepository],
  );

  const injectImportantItemsIntoTrip = useCallback(
    (tripId: string, importantItems: ImportantItem[]) => {
      if (importantItems.length === 0) {
        return;
      }

      let previousItems: PackingItem[] | null = null;
      let nextItems: PackingItem[] | null = null;

      setTrips((current) => {
        const trip = current.find((entry) => entry.id === tripId);
        if (!trip) {
          return current;
        }

        previousItems = trip.items;
        nextItems = mergeImportantItems(trip.items, importantItems);

        return current.map((entry) =>
          entry.id === tripId ? { ...entry, items: nextItems! } : entry,
        );
      });

      if (!nextItems || !previousItems) {
        return;
      }

      void tripRepository.updateTripPackingItems(tripId, nextItems).catch((error) => {
        setTrips((latest) =>
          latest.map((entry) =>
            entry.id === tripId ? { ...entry, items: previousItems! } : entry,
          ),
        );
        setRepositoryError(
          error instanceof Error ? error.message : 'Failed to save important items',
        );
      });
    },
    [tripRepository],
  );

  const syncImportantSnapshotForTrip = useCallback(
    (tripId: string, importantItems: ImportantItem[]) => {
      let previousItems: PackingItem[] | null = null;
      let nextItems: PackingItem[] | null = null;

      setTrips((current) => {
        const trip = current.find((entry) => entry.id === tripId);
        if (!trip) {
          return current;
        }

        previousItems = trip.items;
        nextItems = syncTripImportantSnapshot(trip.items, importantItems);

        return current.map((entry) =>
          entry.id === tripId ? { ...entry, items: nextItems! } : entry,
        );
      });

      if (!nextItems || !previousItems) {
        return;
      }

      void tripRepository.updateTripPackingItems(tripId, nextItems).catch((error) => {
        setTrips((latest) =>
          latest.map((entry) =>
            entry.id === tripId ? { ...entry, items: previousItems! } : entry,
          ),
        );
        setRepositoryError(
          error instanceof Error ? error.message : 'Failed to sync important items',
        );
      });
    },
    [tripRepository],
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
      injectImportantItemsIntoTrip,
      syncImportantSnapshotForTrip,
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
      injectImportantItemsIntoTrip,
      syncImportantSnapshotForTrip,
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
