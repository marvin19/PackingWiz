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

  it('supports irregular plurals via explicit singular and plural args', () => {
    expect(pluralize(1, 'person', 'people')).toBe('person');
    expect(pluralize(2, 'person', 'people')).toBe('people');
  });
});

describe('formatCountLabel', () => {
  it('formats zero, one, and many', () => {
    expect(formatCountLabel(0, 'day', 'days')).toBe('0 days');
    expect(formatCountLabel(1, 'day', 'days')).toBe('1 day');
    expect(formatCountLabel(2, 'day', 'days')).toBe('2 days');
  });

  it('supports irregular plurals via explicit singular and plural args', () => {
    expect(formatCountLabel(1, 'person', 'people')).toBe('1 person');
    expect(formatCountLabel(2, 'person', 'people')).toBe('2 people');
  });
});

describe('formatAgeYears', () => {
  it('formats zero, one, and many', () => {
    expect(formatAgeYears(0)).toBe('0 years');
    expect(formatAgeYears(1)).toBe('1 year');
    expect(formatAgeYears(8)).toBe('8 years');
  });
});

describe('formatTripDurationDays', () => {
  it('formats zero, one, and many', () => {
    expect(formatTripDurationDays(0)).toBe('0 days');
    expect(formatTripDurationDays(1)).toBe('1 day');
    expect(formatTripDurationDays(5)).toBe('5 days');
  });
});

describe('formatItemCount', () => {
  it('formats zero, one, and many', () => {
    expect(formatItemCount(0)).toBe('0 items');
    expect(formatItemCount(1)).toBe('1 item');
    expect(formatItemCount(3)).toBe('3 items');
  });
});
