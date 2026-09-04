import {
  DELETE_TRIP_PERMANENTLY_BODY,
  DELETE_TRIP_PERMANENTLY_TITLE,
} from '@/features/trips/utils/trip-delete-display';

describe('trip delete display', () => {
  it('uses explicit permanent delete confirmation copy', () => {
    expect(DELETE_TRIP_PERMANENTLY_TITLE).toBe('Delete this trip permanently?');
    expect(DELETE_TRIP_PERMANENTLY_BODY).toContain('packing lists');
    expect(DELETE_TRIP_PERMANENTLY_BODY).toContain('Packing Profiles');
    expect(DELETE_TRIP_PERMANENTLY_BODY).toContain('Important items');
  });
});
