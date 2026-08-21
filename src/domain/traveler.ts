export type TravelerRole = 'Adult' | 'Child';

export interface Traveler {
  id: string;
  name: string;
  role: TravelerRole;
  age?: number;
  /** ISO yyyy-mm-dd; when set, age is derived from it */
  birthDate?: string;
}
