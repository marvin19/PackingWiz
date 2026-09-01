import type { Href } from 'expo-router';

import type { EditTripReturnTo } from '@/features/trip-edit/utils/edit-trip-view-model';

export type TripSummaryDetailsMode = 'create' | 'existing';

export type TripDetailsSection =
  | 'destination'
  | 'trip-context'
  | 'accommodation'
  | 'packing-for'
  | 'bags'
  | 'note';

const SECTION_ALIASES: Record<string, TripDetailsSection> = {
  destination: 'destination',
  'trip-context': 'trip-context',
  context: 'trip-context',
  accommodation: 'accommodation',
  laundry: 'accommodation',
  'packing-for': 'packing-for',
  travellers: 'packing-for',
  travelers: 'packing-for',
  bags: 'bags',
  note: 'note',
};

export function getTripSummaryDetailsScreenTitle(mode: TripSummaryDetailsMode): string {
  return mode === 'create' ? 'Trip summary' : 'Trip details';
}

export function parseTripDetailsSection(
  value: string | string[] | undefined,
): TripDetailsSection | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) {
    return null;
  }

  return SECTION_ALIASES[raw.trim().toLowerCase()] ?? null;
}

export function getTripDetailsSectionScreenTitle(section: TripDetailsSection): string {
  switch (section) {
    case 'destination':
      return 'Destination & dates';
    case 'trip-context':
      return 'Trip context';
    case 'accommodation':
      return 'Staying in';
    case 'packing-for':
      return 'Packing for';
    case 'bags':
      return 'Packing in';
    case 'note':
      return 'Additional information';
    default:
      return 'Edit section';
  }
}

export function buildTripDetailsSectionHref(
  section: TripDetailsSection,
  returnTo: EditTripReturnTo,
): Href {
  return `/trip/edit-section?section=${section}&returnTo=${returnTo}` as Href;
}

export function buildTripDetailsReturnHref(returnTo: EditTripReturnTo): Href {
  return `/trip/edit?returnTo=${returnTo}` as Href;
}
