import {
  formatAgeYears,
  formatCountLabel,
  formatItemCount,
  formatTripDurationDays,
  pluralize,
} from '@/domain/count-display';

describe('pluralize', () => {
  it('returns singular for 1 and plural otherwise', () => {
    expect(pluralize(1, 'item', 'items')).toBe('item');
    expect(pluralize(2, 'item', 'items')).toBe('items');
  });
});

describe('formatCountLabel', () => {
  it('uses singular for 1', () => {
    expect(formatCountLabel(1, 'day', 'days')).toBe('1 day');
  });

  it('uses plural for other counts', () => {
    expect(formatCountLabel(0, 'day', 'days')).toBe('0 days');
    expect(formatCountLabel(2, 'day', 'days')).toBe('2 days');
  });
});

describe('formatAgeYears', () => {
  it('formats singular and plural ages', () => {
    expect(formatAgeYears(1)).toBe('1 year');
    expect(formatAgeYears(8)).toBe('8 years');
  });
});

describe('formatTripDurationDays', () => {
  it('formats singular and plural trip durations', () => {
    expect(formatTripDurationDays(1)).toBe('1 day');
    expect(formatTripDurationDays(5)).toBe('5 days');
  });
});

describe('formatItemCount', () => {
  it('formats singular and plural item counts', () => {
    expect(formatItemCount(1)).toBe('1 item');
    expect(formatItemCount(3)).toBe('3 items');
  });
});
