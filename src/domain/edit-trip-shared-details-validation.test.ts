import { createDestinationFromText } from '@/domain/destination';
import {
  EDIT_TRIP_DESTINATION_REQUIRED_MESSAGE,
  EDIT_TRIP_TRIP_CONTEXT_REQUIRED_MESSAGE,
  validateEditTripDestinationInPatch,
  validateEditTripTripContextInPatch,
} from '@/domain/edit-trip-shared-details-validation';

describe('edit trip shared-details validation', () => {
  const trip = {
    destination: createDestinationFromText('Oslo', 'Norway'),
    tripContext: ['City'],
  };

  it('rejects an empty destination patch', () => {
    const result = validateEditTripDestinationInPatch(trip, {
      destination: createDestinationFromText(''),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe(EDIT_TRIP_DESTINATION_REQUIRED_MESSAGE);
    }
  });

  it('rejects a whitespace-only destination patch', () => {
    const result = validateEditTripDestinationInPatch(trip, {
      destination: createDestinationFromText('   '),
    });

    expect(result.ok).toBe(false);
  });

  it('allows a valid destination patch', () => {
    expect(
      validateEditTripDestinationInPatch(trip, {
        destination: createDestinationFromText('Bergen', 'Norway'),
      }).ok,
    ).toBe(true);
  });

  it('skips destination validation when destination is omitted', () => {
    expect(validateEditTripDestinationInPatch(trip, { note: 'Hi' }).ok).toBe(true);
  });

  it('rejects an empty trip context patch', () => {
    const result = validateEditTripTripContextInPatch({ tripContext: [] });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe(EDIT_TRIP_TRIP_CONTEXT_REQUIRED_MESSAGE);
    }
  });

  it('allows a non-empty trip context patch', () => {
    expect(validateEditTripTripContextInPatch({ tripContext: ['Beach'] }).ok).toBe(true);
  });
});
