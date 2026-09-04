import {
  HOME_AFTER_DRAFTS_SPACING,
  HOME_FOOTER_SPACING,
  HOME_SCROLL_TOP_PADDING,
  HOME_SECTION_SPACING,
  HOME_VIEW_ALL_LINK_SPACING,
} from '@/features/trips/utils/home-screen-spacing';
import {
  MANAGE_ALL_TRIPS_ACCESSIBILITY_LABEL,
  MANAGE_ALL_TRIPS_LABEL,
} from '@/features/trips/components/home-view-all-link';
import { buildTripsBrowseHref } from '@/features/trips/utils/trips-browse-navigation';
import { buildViewAllDraftsLabel } from '@/features/trips/utils/draft-home-preview';
import { buildViewAllPreviousTripsLabel } from '@/features/trips/utils/previous-home-preview';

describe('home navigation contract', () => {
  it('exposes permanent Manage all trips entry to the All filter', () => {
    expect(MANAGE_ALL_TRIPS_LABEL).toBe('Manage all trips');
    expect(MANAGE_ALL_TRIPS_ACCESSIBILITY_LABEL).toBe('Manage all trips');
    expect(String(buildTripsBrowseHref('all'))).toBe('/trip/browse');
  });

  it('keeps contextual View all drafts and previous deep links', () => {
    expect(String(buildTripsBrowseHref('drafts'))).toBe('/trip/browse?filter=drafts');
    expect(String(buildTripsBrowseHref('previous'))).toBe('/trip/browse?filter=previous');
    expect(buildViewAllDraftsLabel(3)).toBe('View all drafts (3)');
    expect(buildViewAllPreviousTripsLabel(3)).toBe('View all previous trips (3)');
  });

  it('uses shared home section spacing tokens', () => {
    expect(HOME_SECTION_SPACING).toBe(24);
    expect(HOME_AFTER_DRAFTS_SPACING).toBe(12);
    expect(HOME_FOOTER_SPACING).toBe(28);
    expect(HOME_SCROLL_TOP_PADDING).toBe(8);
    expect(HOME_VIEW_ALL_LINK_SPACING).toBe(8);
  });
});
