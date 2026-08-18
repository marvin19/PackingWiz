import type { SavedTravelerProfile } from '@/domain/user-settings';

export const mockSavedTravelers: SavedTravelerProfile[] = [
  { id: 'traveler-you', name: 'You', role: 'Adult' },
  { id: 'traveler-jordan', name: 'Jordan', role: 'Adult' },
  { id: 'traveler-mia', name: 'Mia', role: 'Child', age: 6 },
];
