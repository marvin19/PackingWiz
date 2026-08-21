export type TravelerRole = 'Adult' | 'Child';

export type SavedTravelerProfile = {
  id: string;
  name: string;
  role: TravelerRole;
  age?: number;
};

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
