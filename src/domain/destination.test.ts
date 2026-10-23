import {
  createDestinationFromText,
  formatTripCardLocationLine,
} from '@/domain/destination';

describe('formatTripCardLocationLine', () => {
  it('shows the place when trip name differs and country is unset', () => {
    const destination = createDestinationFromText('Madrid');

    expect(formatTripCardLocationLine(destination)).toBe('Madrid');
  });

  it('combines place and country when both are present', () => {
    const destination = createDestinationFromText('Lisbon', 'Portugal');

    expect(formatTripCardLocationLine(destination)).toBe('Lisbon, Portugal');
  });

  it('falls back to country when place is empty', () => {
    const destination = createDestinationFromText('', 'Spain');

    expect(formatTripCardLocationLine(destination)).toBe('Spain');
  });
});
