import { Feather } from '@expo/vector-icons';

import type { TripTypeId } from '@/domain/trip';

export type TripFeatherIcon = keyof typeof Feather.glyphMap;

const TRIP_TYPE_ICONS: Record<TripTypeId, TripFeatherIcon> = {
  vacation: 'sun',
  business: 'briefcase',
  city: 'home',
  beach: 'umbrella',
  outdoor: 'navigation',
  training: 'activity',
  race: 'award',
  ski: 'cloud',
  camping: 'flag',
  family: 'users',
  other: 'star',
};

export function getTripTypeIcon(typeId: TripTypeId): TripFeatherIcon {
  return TRIP_TYPE_ICONS[typeId] ?? 'star';
}
