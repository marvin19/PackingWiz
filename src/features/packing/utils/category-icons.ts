import type { PackingCategory } from '@/domain/packing-item';
import type { TripFeatherIcon } from '@/features/trips/utils/trip-type-icon';

const CATEGORY_ICONS: Record<PackingCategory, TripFeatherIcon> = {
  Important: 'alert-triangle',
  Essentials: 'shield',
  Clothing: 'tag',
  Shoes: 'map-pin',
  Toiletries: 'droplet',
  Electronics: 'smartphone',
  Activities: 'award',
  Weather: 'cloud-rain',
};

export function getCategoryIcon(category: PackingCategory): TripFeatherIcon {
  return CATEGORY_ICONS[category];
}
