import {
  defaultPersistedUserPreferences,
  type PersistedUserPreferences,
} from '@/domain/user-settings';

export type DbUserPreferencesRow = {
  user_id: string;
  smart_quantities: boolean;
  metric_units: boolean;
};

export function mapDbUserPreferencesRow(row: DbUserPreferencesRow): PersistedUserPreferences {
  return {
    smartQuantities: row.smart_quantities,
    metricUnits: row.metric_units,
  };
}

export function mapUserPreferencesToDbRow(
  userId: string,
  preferences: PersistedUserPreferences,
): DbUserPreferencesRow {
  return {
    user_id: userId,
    smart_quantities: preferences.smartQuantities,
    metric_units: preferences.metricUnits,
  };
}

export function normalizeLoadedUserPreferences(
  row: DbUserPreferencesRow | null | undefined,
): PersistedUserPreferences {
  if (!row) {
    return { ...defaultPersistedUserPreferences };
  }

  return mapDbUserPreferencesRow(row);
}
