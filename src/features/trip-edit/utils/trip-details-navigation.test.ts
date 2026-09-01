import {
  buildTripDetailsReturnHref,
  buildTripDetailsSectionHref,
  getTripSummaryDetailsScreenTitle,
  parseTripDetailsSection,
} from '@/features/trip-edit/utils/trip-details-navigation';
import {
  parseEditTripReturnTo,
  resolveEditTripReturnPath,
} from '@/features/trip-edit/utils/edit-trip-navigation';
import { getTripDetailsDoneLabel } from '@/features/trip-edit/utils/edit-trip-view-model';

describe('trip details navigation', () => {
  it('uses Trip summary title for create mode and Trip details for existing mode', () => {
    expect(getTripSummaryDetailsScreenTitle('create')).toBe('Trip summary');
    expect(getTripSummaryDetailsScreenTitle('existing')).toBe('Trip details');
  });

  it('builds section edit routes with return target', () => {
    expect(String(buildTripDetailsSectionHref('destination', 'pack'))).toBe(
      '/trip/edit-section?section=destination&returnTo=pack',
    );
    expect(String(buildTripDetailsReturnHref('overview'))).toBe('/trip/edit?returnTo=overview');
  });

  it('parses section aliases', () => {
    expect(parseTripDetailsSection('trip-context')).toBe('trip-context');
    expect(parseTripDetailsSection('travelers')).toBe('packing-for');
  });

  it('returns to Pack when opened from Pack', () => {
    expect(String(resolveEditTripReturnPath(parseEditTripReturnTo('pack')))).toBe('/(tabs)/pack');
  });

  it('returns to Insights when opened from Insights', () => {
    expect(String(resolveEditTripReturnPath(parseEditTripReturnTo('overview')))).toBe(
      '/(tabs)/pack/overview',
    );
  });

  it('uses Done label on Trip Details main screen', () => {
    expect(getTripDetailsDoneLabel()).toBe('Done');
  });
});
