import type { PackingProfile } from '@/domain/packing-profile';

/** Session/mock seed — reusable non-self profiles for trip creation suggestions. */
export const mockSavedPackingProfiles: PackingProfile[] = [
  {
    id: 'profile-jonas',
    name: 'Jonas',
    age: 34,
    isSelf: false,
  },
];
