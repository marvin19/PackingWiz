import { formatTripContext } from '@/features/trips/utils/trip-context-icon';

describe('formatTripContext', () => {
  it('returns Not specified when empty', () => {
    expect(formatTripContext([])).toBe('Not specified');
  });

  it('returns a single tag unchanged', () => {
    expect(formatTripContext(['Business'])).toBe('Business');
  });

  it('joins multiple tags with middle dots', () => {
    expect(formatTripContext(['Business', 'Vacation'])).toBe('Business · Vacation');
    expect(formatTripContext(['Vacation', 'City break'])).toBe('Vacation · City break');
  });

  it('preserves selection ordering', () => {
    expect(formatTripContext(['City break', 'Business', 'Vacation'])).toBe(
      'City break · Business · Vacation',
    );
  });
});
