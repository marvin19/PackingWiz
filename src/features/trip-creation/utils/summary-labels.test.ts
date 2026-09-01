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

  it('formats unsure as laundry not sure', () => {
    expect(getLaundrySummaryLabel('unsure')).toBe('Laundry not sure');
  });
});

describe('getStayingInSummaryLabel', () => {
  it('combines accommodation and laundry with a middle dot', () => {
    expect(getStayingInSummaryLabel('hotel', 'yes')).toBe('Hotel · Laundry available');
    expect(getStayingInSummaryLabel('hotel', 'no')).toBe('Hotel · No laundry available');
    expect(getStayingInSummaryLabel('hotel', 'unsure')).toBe('Hotel · Laundry not sure');
  });

  it('uses friends / family accommodation label', () => {
    expect(getStayingInSummaryLabel('friends', 'yes')).toBe('Friends / family · Laundry available');
    expect(getStayingInSummaryLabel('friends', 'no')).toBe('Friends / family · No laundry available');
    expect(getStayingInSummaryLabel('friends', 'unsure')).toBe('Friends / family · Laundry not sure');
  });

  it('falls back to accommodation only when laundry is missing', () => {
    expect(getStayingInSummaryLabel('hotel', null)).toBe('Hotel');
  });
});
