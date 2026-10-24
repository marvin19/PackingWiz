import {
  PACK_SHOPPING_FILTER_INTRO,
  PRODUCT_DISPLAY_NAME,
  TRIP_GENERATING_SUBTITLE,
} from '@/constants/product-brand';

describe('product-brand', () => {
  it('uses PackingWiz as the user-facing product name', () => {
    expect(PRODUCT_DISPLAY_NAME).toBe('PackingWiz');
  });

  it('does not reference legacy Trove branding in exported copy', () => {
    const copy = [PRODUCT_DISPLAY_NAME, TRIP_GENERATING_SUBTITLE, PACK_SHOPPING_FILTER_INTRO].join(
      '\n',
    );
    expect(copy.toLowerCase()).not.toContain('trove');
    expect(TRIP_GENERATING_SUBTITLE).toContain('PackingWiz');
    expect(PACK_SHOPPING_FILTER_INTRO).toContain('PackingWiz');
  });
});
