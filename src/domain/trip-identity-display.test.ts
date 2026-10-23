import { createDestinationFromText } from '@/domain/destination';
import {
  formatTripIdentityAccessibilityLabel,
  getTripSecondaryLocationLine,
} from '@/domain/trip-identity-display';

describe('getTripSecondaryLocationLine', () => {
  it('returns formatted destination when trip name differs', () => {
    expect(
      getTripSecondaryLocationLine({
        name: 'Hyttetur',
        title: 'Hyttetur',
        destination: createDestinationFromText('Norefjell', 'Norway'),
      }),
    ).toBe('Norefjell, Norway');
  });

  it('returns place-only line for free-text destination without country', () => {
    expect(
      getTripSecondaryLocationLine({
        name: 'Sommerferie',
        title: 'Sommerferie',
        destination: createDestinationFromText('Madrid'),
      }),
    ).toBe('Madrid');
  });

  it('hides secondary line when it would duplicate the default trip name', () => {
    expect(
      getTripSecondaryLocationLine({
        name: 'Madrid',
        title: 'Madrid',
        destination: createDestinationFromText('Madrid'),
      }),
    ).toBe('');
  });

  it('shows country when trip name is only the place', () => {
    expect(
      getTripSecondaryLocationLine({
        name: 'Lisbon',
        title: 'Lisbon',
        destination: createDestinationFromText('Lisbon', 'Portugal'),
      }),
    ).toBe('Lisbon, Portugal');
  });

  it('returns empty when destination has no display information', () => {
    expect(
      getTripSecondaryLocationLine({
        name: 'Road trip',
        title: 'Road trip',
        destination: createDestinationFromText(''),
      }),
    ).toBe('');
  });
});

describe('formatTripIdentityAccessibilityLabel', () => {
  it('combines trip name and secondary location', () => {
    expect(
      formatTripIdentityAccessibilityLabel({
        name: 'Hyttetur',
        title: 'Hyttetur',
        destination: createDestinationFromText('Norefjell', 'Norway'),
      }),
    ).toBe('Hyttetur, Norefjell, Norway');
  });

  it('uses trip name only when secondary location is omitted', () => {
    expect(
      formatTripIdentityAccessibilityLabel({
        name: 'Madrid',
        title: 'Madrid',
        destination: createDestinationFromText('Madrid'),
      }),
    ).toBe('Madrid');
  });
});
