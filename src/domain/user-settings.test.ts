import {
  defaultPersistedUserPreferences,
  defaultUserPreferences,
  isPersistedPreferenceKey,
  mergeLoadedUserPreferences,
  toPersistedUserPreferences,
} from '@/domain/user-settings';

describe('UserPreferences persistence helpers', () => {
  it('identifies persisted preference keys', () => {
    expect(isPersistedPreferenceKey('smartQuantities')).toBe(true);
    expect(isPersistedPreferenceKey('metricUnits')).toBe(true);
    expect(isPersistedPreferenceKey('packingReminders')).toBe(false);
  });

  it('returns defaults when no persisted row exists', () => {
    expect(mergeLoadedUserPreferences(null)).toEqual(defaultUserPreferences);
    expect(mergeLoadedUserPreferences(undefined)).toEqual(defaultUserPreferences);
  });

  it('hydrates persisted fields and keeps packingReminders session-default', () => {
    const merged = mergeLoadedUserPreferences({
      smartQuantities: false,
      metricUnits: false,
    });

    expect(merged).toEqual({
      smartQuantities: false,
      metricUnits: false,
      packingReminders: defaultUserPreferences.packingReminders,
    });
  });

  it('maps runtime preferences to persisted payload', () => {
    expect(
      toPersistedUserPreferences({
        smartQuantities: false,
        metricUnits: true,
        packingReminders: false,
      }),
    ).toEqual({
      smartQuantities: false,
      metricUnits: true,
    });
    expect(toPersistedUserPreferences(defaultUserPreferences)).toEqual(defaultPersistedUserPreferences);
  });
});
