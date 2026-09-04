import type { Href } from 'expo-router';

import type { TripsBrowseFilter } from '@/features/trips/utils/trips-browse-filter';

export type TripLifecycleActionOutcome = 'success' | 'failure';

export function buildTripsBrowseHref(filter: TripsBrowseFilter = 'all'): Href {
  if (filter === 'all') {
    return '/trip/browse' as Href;
  }

  return `/trip/browse?filter=${filter}` as Href;
}

export {
  MANAGE_ALL_TRIPS_ACCESSIBILITY_LABEL,
  MANAGE_ALL_TRIPS_LABEL,
  VIEW_ALL_TRIPS_ACCESSIBILITY_LABEL,
  VIEW_ALL_TRIPS_LABEL,
} from '@/features/trips/components/home-view-all-link';

export async function performDeleteTripPermanently(
  tripId: string,
  deleteTripPermanently: (id: string) => Promise<void>,
): Promise<TripLifecycleActionOutcome> {
  try {
    await deleteTripPermanently(tripId);
    return 'success';
  } catch {
    return 'failure';
  }
}
