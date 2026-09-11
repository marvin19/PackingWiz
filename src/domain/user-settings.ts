export type UserPreferences = {
  smartQuantities: boolean;
  metricUnits: boolean;
  packingReminders: boolean;
};

/** Preferences persisted to Supabase — excludes coming-soon session-only fields. */
export type PersistedUserPreferences = Pick<UserPreferences, 'smartQuantities' | 'metricUnits'>;

export const defaultUserPreferences: UserPreferences = {
  smartQuantities: true,
  metricUnits: true,
  packingReminders: true,
};

export const defaultPersistedUserPreferences: PersistedUserPreferences = {
  smartQuantities: defaultUserPreferences.smartQuantities,
  metricUnits: defaultUserPreferences.metricUnits,
};

export function isPersistedPreferenceKey(key: keyof UserPreferences): key is keyof PersistedUserPreferences {
  return key === 'smartQuantities' || key === 'metricUnits';
}

export function toPersistedUserPreferences(preferences: UserPreferences): PersistedUserPreferences {
  return {
    smartQuantities: preferences.smartQuantities,
    metricUnits: preferences.metricUnits,
  };
}

/** Hydrate runtime preferences from persisted row — packingReminders stays session default. */
export function mergeLoadedUserPreferences(
  loaded: Partial<PersistedUserPreferences> | null | undefined,
): UserPreferences {
  return {
    ...defaultUserPreferences,
    smartQuantities: loaded?.smartQuantities ?? defaultUserPreferences.smartQuantities,
    metricUnits: loaded?.metricUnits ?? defaultUserPreferences.metricUnits,
  };
}
