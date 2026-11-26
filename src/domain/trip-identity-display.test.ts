import { createDestinationFromText } from '@/domain/destination';
import {
  formatTripIdentityAccessibilityLabel,
  getTripSecondaryLocationLine,
} from '@/domain/trip-identity-display';

describe('getTripSecondaryLocationLine', () => {
  it('returns full formatted destination when the title is a distinct custom name', () => {
    expect(
      getTripSecondaryLocationLine({
        name: 'Skiferie',
        title: 'Skiferie',
        destination: createDestinationFromText('Chamonix', 'France'),
      }),
    ).toBe('Chamonix, France');
  });

  it('returns only the country when the title matches the place name', () => {
    expect(
      getTripSecondaryLocationLine({
        name: 'Chamonix',
        title: 'Chamonix',
        destination: createDestinationFromText('Chamonix', 'France'),
      }),
    ).toBe('France');
    expect(
      getTripSecondaryLocationLine({
        name: 'Lisbon',
        title: 'Lisbon',
        destination: createDestinationFromText('Lisbon', 'Portugal'),
      }),
    ).toBe('Portugal');
  });

  it('returns nothing when the title matches the complete formatted destination', () => {
    expect(
      getTripSecondaryLocationLine({
        name: 'Chamonix, France',
        title: 'Chamonix, France',
        destination: createDestinationFromText('Chamonix', 'France'),
      }),
    ).toBe('');
    expect(
      getTripSecondaryLocationLine({
        name: 'Lisbon',
        title: 'Lisbon',
        destination: createDestinationFromText('Lisbon'),
      }),
    ).toBe('');
  });

  it('keeps composite destinations intact for distinct custom titles', () => {
    expect(
      getTripSecondaryLocationLine({
        name: 'Kirsebærblomstring',
        title: 'Kirsebærblomstring',
        destination: createDestinationFromText('Tokyo & Kyoto', 'Japan'),
      }),
    ).toBe('Tokyo & Kyoto, Japan');
  });

  it('shows only Japan when the title matches the composite place', () => {
    expect(
      getTripSecondaryLocationLine({
        name: 'Tokyo & Kyoto',
        title: 'Tokyo & Kyoto',
        destination: createDestinationFromText('Tokyo & Kyoto', 'Japan'),
      }),
    ).toBe('Japan');
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

  it('does not treat partial title matches as place matches', () => {
    expect(
      getTripSecondaryLocationLine({
        name: 'Lisbon Weekend',
        title: 'Lisbon Weekend',
        destination: createDestinationFromText('Lisbon', 'Portugal'),
      }),
    ).toBe('Lisbon, Portugal');
  });

  it('matches place and destination case-insensitively', () => {
    expect(
      getTripSecondaryLocationLine({
        name: 'CHAMONIX',
        title: 'CHAMONIX',
        destination: createDestinationFromText('Chamonix', 'France'),
      }),
    ).toBe('France');
    expect(
      getTripSecondaryLocationLine({
        name: 'chamonix, france',
        title: 'chamonix, france',
        destination: createDestinationFromText('Chamonix', 'France'),
      }),
    ).toBe('');
  });

  it('trims surrounding whitespace before comparing', () => {
    expect(
      getTripSecondaryLocationLine({
        name: '  Lisbon  ',
        title: '  Lisbon  ',
        destination: createDestinationFromText('Lisbon', 'Portugal'),
      }),
    ).toBe('Portugal');
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

  it('does not add a subtitle when the title matches a country-only destination', () => {
    expect(
      getTripSecondaryLocationLine({
        name: 'Spain',
        title: 'Spain',
        destination: createDestinationFromText('', 'Spain'),
      }),
    ).toBe('');
  });

  it('applies the same rules to automatically derived titles', () => {
    expect(
      getTripSecondaryLocationLine({
        name: '',
        title: 'Oslo',
        destination: createDestinationFromText('Oslo', 'Norway'),
      }),
    ).toBe('Norway');
  });
});

describe('formatTripIdentityAccessibilityLabel', () => {
  it('combines trip name and secondary location for distinct custom names', () => {
    expect(
      formatTripIdentityAccessibilityLabel({
        name: 'Hyttetur',
        title: 'Hyttetur',
        destination: createDestinationFromText('Norefjell', 'Norway'),
      }),
    ).toBe('Hyttetur, Norefjell, Norway');
  });

  it('announces place title with country only once', () => {
    expect(
      formatTripIdentityAccessibilityLabel({
        name: 'Chamonix',
        title: 'Chamonix',
        destination: createDestinationFromText('Chamonix', 'France'),
      }),
    ).toBe('Chamonix, France');
  });

  it('uses trip name only when secondary location is omitted', () => {
    expect(
      formatTripIdentityAccessibilityLabel({
        name: 'Madrid',
        title: 'Madrid',
        destination: createDestinationFromText('Madrid'),
      }),
    ).toBe('Madrid');
    expect(
      formatTripIdentityAccessibilityLabel({
        name: 'Kirsebærblomstring',
        title: 'Kirsebærblomstring',
        destination: createDestinationFromText('Tokyo & Kyoto', 'Japan'),
      }),
    ).toBe('Kirsebærblomstring, Tokyo & Kyoto, Japan');
  });
});