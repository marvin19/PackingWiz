import {
  getLaundrySummaryLabel,
  getStayingInSummaryLabel,
} from '@/features/trip-creation/utils/summary-labels';

describe('getLaundrySummaryLabel', () => {
  it('formats yes as laundry available', () => {
    expect(getLaundrySummaryLabel('yes')).toBe('Laundry available');
  });

  it('formats no as no laundry available', () => {
    expect(getLaundrySummaryLabel('no')).toBe('No laundry available');
  });

  it('formats unsure as not sure about laundry', () => {
    expect(getLaundrySummaryLabel('unsure')).toBe('Not sure about laundry');
  });
});

describe('getStayingInSummaryLabel', () => {
  it('combines accommodation and laundry with a middle dot', () => {
    expect(getStayingInSummaryLabel('hotel', 'yes')).toBe('Hotel · Laundry available');
    expect(getStayingInSummaryLabel('hotel', 'no')).toBe('Hotel · No laundry available');
    expect(getStayingInSummaryLabel('hotel', 'unsure')).toBe('Hotel · Not sure about laundry');
  });

  it('uses friends / family accommodation label', () => {
    expect(getStayingInSummaryLabel('friends', 'yes')).toBe('Friends / family · Laundry available');
    expect(getStayingInSummaryLabel('friends', 'no')).toBe('Friends / family · No laundry available');
    expect(getStayingInSummaryLabel('friends', 'unsure')).toBe('Friends / family · Not sure about laundry');
  });

  it('falls back to accommodation only when laundry is missing', () => {
    expect(getStayingInSummaryLabel('hotel', null)).toBe('Hotel');
  });
});
