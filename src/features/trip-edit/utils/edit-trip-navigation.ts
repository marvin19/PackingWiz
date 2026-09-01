import type { Href } from 'expo-router';

import type { EditTripReturnTo } from '@/features/trip-edit/utils/edit-trip-view-model';

export function buildEditTripHref(returnTo: EditTripReturnTo = 'overview'): Href {
  if (returnTo === 'pack') {
    return '/trip/edit?returnTo=pack' as Href;
  }

  return '/trip/edit?returnTo=overview' as Href;
}

export function parseEditTripReturnTo(value: string | string[] | undefined): EditTripReturnTo {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === 'pack' ? 'pack' : 'overview';
}

export function resolveEditTripReturnPath(returnTo: EditTripReturnTo): Href {
  return returnTo === 'pack' ? '/(tabs)/pack' : '/(tabs)/pack/overview';
}
