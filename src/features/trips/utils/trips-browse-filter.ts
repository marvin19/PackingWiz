export type TripsBrowseFilter = 'all' | 'drafts' | 'upcoming' | 'previous';

export const TRIPS_BROWSE_FILTERS: TripsBrowseFilter[] = [
  'all',
  'drafts',
  'upcoming',
  'previous',
];

export function tripsBrowseFilterLabel(filter: TripsBrowseFilter): string {
  switch (filter) {
    case 'all':
      return 'All';
    case 'drafts':
      return 'Drafts';
    case 'upcoming':
      return 'Upcoming';
    case 'previous':
      return 'Previous';
  }
}

export function parseTripsBrowseFilter(
  value: string | string[] | undefined,
): TripsBrowseFilter {
  const raw = Array.isArray(value) ? value[0] : value;

  switch (raw) {
    case 'drafts':
      return 'drafts';
    case 'upcoming':
      return 'upcoming';
    case 'previous':
      return 'previous';
    default:
      return 'all';
  }
}
