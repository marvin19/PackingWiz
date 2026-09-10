export type UserPreferences = {
  smartQuantities: boolean;
  metricUnits: boolean;
  packingReminders: boolean;
};

export const defaultUserPreferences: UserPreferences = {
  smartQuantities: true,
  metricUnits: true,
  packingReminders: true,
};
