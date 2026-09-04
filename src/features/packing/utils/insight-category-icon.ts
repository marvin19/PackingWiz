import type { InsightCategory } from '@/domain/insight';
import type { TripFeatherIcon } from '@/features/trips/utils/trip-context-icon';

const INSIGHT_CATEGORY_ICONS: Record<InsightCategory, TripFeatherIcon> = {
  weather: 'cloud-rain',
  laundry: 'droplet',
  'trip-context': 'compass',
  'special-consideration': 'info',
};

export function getInsightCategoryIcon(category: InsightCategory): TripFeatherIcon {
  return INSIGHT_CATEGORY_ICONS[category];
}
