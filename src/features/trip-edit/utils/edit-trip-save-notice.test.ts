import {
  shouldStageTripEditPackingNotice,
  TRIP_EDIT_PACKING_NOTICE_BODY,
  TRIP_EDIT_PACKING_NOTICE_TITLE,
} from '@/features/trip-edit/utils/edit-trip-view-model';
import { buildTripDetailsReturnHref } from '@/features/trip-edit/utils/trip-details-navigation';
import {
  consumeTripEditPackingNotice,
  resetTripEditSaveNoticeHandoffForTests,
  stageTripEditPackingNotice,
} from '@/features/trip-edit/utils/trip-edit-save-notice-handoff';

describe('trip edit packing notice', () => {
  beforeEach(() => {
    resetTripEditSaveNoticeHandoffForTests();
  });

  it('does not stage a notice for generic-only edits', () => {
    expect(shouldStageTripEditPackingNotice({})).toBe(false);
  });

  it('stages a notice for packing-relevant edits', () => {
    expect(shouldStageTripEditPackingNotice({ tripContext: true })).toBe(true);
  });

  it('uses the product copy constants for the visible banner', () => {
    expect(TRIP_EDIT_PACKING_NOTICE_TITLE).toBe('Trip updated');
    expect(TRIP_EDIT_PACKING_NOTICE_BODY).toBe(
      "Your packing lists haven't changed. They may need updating to match your new trip details.",
    );
  });

  it('does not put notice data on the return href', () => {
    expect(String(buildTripDetailsReturnHref('overview'))).toBe('/trip/edit?returnTo=overview');
    expect(String(buildTripDetailsReturnHref('overview'))).not.toContain('saveNotice');
  });

  it('does not leave a staged notice after a failed save path', () => {
    expect(consumeTripEditPackingNotice()).toBe(false);
  });

  it('stages only when explicitly requested after success', () => {
    stageTripEditPackingNotice();
    expect(consumeTripEditPackingNotice()).toBe(true);
  });
});
