import {
  TRIP_IDENTITY_LOCATION_PIN_SIZE,
  tripIdentityLocationPinOffset,
} from '@/features/trips/components/trip-identity-location-row';
import { typography } from '@/theme/typography';

describe('tripIdentityLocationPinOffset', () => {
  it('centers the pin on the bodySmall subtitle line height', () => {
    expect(tripIdentityLocationPinOffset(typography.bodySmall.lineHeight, TRIP_IDENTITY_LOCATION_PIN_SIZE)).toBe(3);
  });
});