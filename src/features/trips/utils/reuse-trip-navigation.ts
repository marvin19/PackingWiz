import type { Href } from 'expo-router';

export type ReuseTripSection =
  | 'destination'
  | 'trip-context'
  | 'accommodation'
  | 'bags'
  | 'note';

const SECTION_ALIASES: Record<string, ReuseTripSection> = {
  destination: 'destination',
  'trip-context': 'trip-context',
  context: 'trip-context',
  accommodation: 'accommodation',
  bags: 'bags',
  note: 'note',
};

export function parseReuseTripSection(
  value: string | string[] | undefined,
): ReuseTripSection | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) {
    return null;
  }

  return SECTION_ALIASES[raw.trim().toLowerCase()] ?? null;
}

export function getReuseTripSectionScreenTitle(section: ReuseTripSection): string {
  switch (section) {
    case 'destination':
      return 'Destination';
    case 'trip-context':
      return 'Trip context';
    case 'accommodation':
      return 'Staying in';
    case 'bags':
      return 'Packing in';
    case 'note':
      return 'Additional information';
    default:
      return 'Edit section';
  }
}

export function buildReuseTripHref(tripId: string): Href {
  return `/trip/reuse?tripId=${encodeURIComponent(tripId)}` as Href;
}

export function buildReuseTripSectionHref(tripId: string, section: ReuseTripSection): Href {
  return `/trip/reuse-section?tripId=${encodeURIComponent(tripId)}&section=${section}` as Href;
}

export function buildReuseTripReturnHref(tripId: string): Href {
  return buildReuseTripHref(tripId);
}
