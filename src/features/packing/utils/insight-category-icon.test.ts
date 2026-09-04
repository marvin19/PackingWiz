import { getInsightCategoryIcon } from '@/features/packing/utils/insight-category-icon';
import type { InsightCategory } from '@/domain/insight';

describe('getInsightCategoryIcon', () => {
  it.each<[InsightCategory, string]>([
    ['weather', 'cloud-rain'],
    ['laundry', 'droplet'],
    ['trip-context', 'compass'],
    ['special-consideration', 'info'],
  ])('maps %s to %s', (category, icon) => {
    expect(getInsightCategoryIcon(category)).toBe(icon);
  });
});
