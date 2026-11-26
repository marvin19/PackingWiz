import { createDestinationFromText } from '@/domain/destination';
import { buildTripSummaryTripIdentityFromDraft } from '@/features/trip-creation/utils/trip-summary-identity';
import { getTripSecondaryLocationLine } from '@/domain/trip-identity-display';

describe('buildTripSummaryTripIdentityFromDraft', () => {
  it('preserves custom draft naming for identity subtitles', () => {
    const identity = buildTripSummaryTripIdentityFromDraft({
      name: 'Festival in London',
      isTripNameUserEdited: true,
      destination: createDestinationFromText('London', 'United Kingdom'),
    });

    expect(identity.title).toBe('Festival in London');
    expect(getTripSecondaryLocationLine(identity)).toBe('London, United Kingdom');
  });

  it('uses destination-owned naming when the trip name was not edited', () => {
    const identity = buildTripSummaryTripIdentityFromDraft({
      name: '',
      isTripNameUserEdited: false,
      destination: createDestinationFromText('Lisbon', 'Portugal'),
    });

    expect(identity.title).toBe('Lisbon');
    expect(getTripSecondaryLocationLine(identity)).toBe('Portugal');
  });
});