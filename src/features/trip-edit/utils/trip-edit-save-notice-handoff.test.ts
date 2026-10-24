import {
  consumeTripEditPackingNotice,
  resetTripEditSaveNoticeHandoffForTests,
  stageTripEditPackingNotice,
} from '@/features/trip-edit/utils/trip-edit-save-notice-handoff';

describe('trip edit packing notice handoff', () => {
  beforeEach(() => {
    resetTripEditSaveNoticeHandoffForTests();
  });

  it('consumes a staged packing notice once', () => {
    stageTripEditPackingNotice();
    expect(consumeTripEditPackingNotice()).toBe(true);
    expect(consumeTripEditPackingNotice()).toBe(false);
  });

  it('keeps the latest stage when two saves happen before consumption', () => {
    stageTripEditPackingNotice();
    stageTripEditPackingNotice();
    expect(consumeTripEditPackingNotice()).toBe(true);
  });
});
