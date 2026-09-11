import { SELF_IMPORTANT_PROFILE_ID } from '@/domain/profile-important-items';
import { createCanonicalSelfPackingProfile } from '@/domain/self-packing-profile';
import { mapUserPreferencesToDbRow } from '@/repositories/preferences/user-preferences-mapper';
import { mapPackingProfileToDbRow } from '@/repositories/trips/mappers/supabase-canonical-mapper';

const AUTH_USER_ID = '11111111-1111-4111-8111-111111111111';

describe('persistence ownership boundary', () => {
  it('keeps profile-self as packing-domain Me identity, not auth user ownership', () => {
    const self = createCanonicalSelfPackingProfile();

    expect(self.id).toBe(SELF_IMPORTANT_PROFILE_ID);
    expect(self.id).not.toBe(AUTH_USER_ID);
    expect(self.id).not.toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-/i);
  });

  it('scopes packing profile persistence rows by auth user id separately from profile-self', () => {
    const selfRow = mapPackingProfileToDbRow(AUTH_USER_ID, createCanonicalSelfPackingProfile());

    expect(selfRow.user_id).toBe(AUTH_USER_ID);
    expect(selfRow.id).toBe(SELF_IMPORTANT_PROFILE_ID);
    expect(selfRow.user_id).not.toBe(selfRow.id);
  });

  it('scopes user preferences by auth user id only', () => {
    const row = mapUserPreferencesToDbRow(AUTH_USER_ID, {
      smartQuantities: true,
      metricUnits: false,
    });

    expect(row.user_id).toBe(AUTH_USER_ID);
    expect(row).not.toHaveProperty('packing_profile_id');
    expect(Object.keys(row)).not.toContain(SELF_IMPORTANT_PROFILE_ID);
  });
});
