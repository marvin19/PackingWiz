import type { PackingProfile } from '@/domain/packing-profile';
import { createDestinationFromText } from '@/domain/destination';
import { normalizeTrip, primaryPackingListId, type TripLike } from '@/domain/trip-compatibility';
import {
  canAddProfileToReusePlan,
  countReuseResultingLists,
  reusePlanHasProfile,
} from '@/features/trips/utils/reuse-plan-profiles';
import { createReuseFormStateFromTrip } from '@/features/trips/utils/reuse-trip-view-model';

const TRIP_ID = 'trip-plan';

function createTrip(): ReturnType<typeof normalizeTrip> {
  const meListId = primaryPackingListId(TRIP_ID);
  const emilieListId = `${TRIP_ID}-list-emilie`;

  return normalizeTrip({
    id: TRIP_ID,
    name: 'Lisbon',
    title: 'Lisbon',
    destination: createDestinationFromText('Lisbon'),
    startDate: '2025-07-01',
    endDate: '2025-07-05',
    tripContext: ['City'],
    accommodation: 'hotel',
    laundry: 'no',
    travelers: [],
    bags: [],
    note: '',
    weather: { mode: 'climate', summary: 'Warm', detail: '', high: 24, low: 16 },
    insights: [],
    packingLists: [
      {
        id: meListId,
        packingProfileId: `${TRIP_ID}-profile-self`,
        profileSnapshot: { id: `${TRIP_ID}-profile-self`, name: 'Me', isSelf: true },
        packingMode: 'generated',
        items: [],
      },
      {
        id: emilieListId,
        packingProfileId: `${TRIP_ID}-profile-emilie`,
        profileSnapshot: { id: `${TRIP_ID}-profile-emilie`, name: 'Emilie', isSelf: false },
        packingMode: 'manual',
        items: [],
      },
    ],
    items: [],
    packingMode: 'generated',
    generated: true,
    status: 'past',
  } satisfies TripLike);
}

describe('reuse plan profiles', () => {
  const sourceTrip = createTrip();
  const simenProfile: PackingProfile = {
    id: 'profile-simen',
    name: 'Simen',
    age: 12,
    isSelf: false,
  };

  it('counts total resulting lists for validation and supabase guard', () => {
    const form = {
      ...createReuseFormStateFromTrip(sourceTrip),
      selectedPackingListIds: [primaryPackingListId(TRIP_ID)],
      newTravellers: [
        {
          id: 'entry-1',
          profile: simenProfile,
          packingMode: 'generated' as const,
        },
      ],
    };

    expect(countReuseResultingLists(form)).toBe(2);
  });

  it('detects duplicate profile in reuse plan', () => {
    const form = {
      ...createReuseFormStateFromTrip(sourceTrip),
      selectedPackingListIds: [primaryPackingListId(TRIP_ID)],
      newTravellers: [],
    };

    expect(reusePlanHasProfile(sourceTrip, form, { id: `${TRIP_ID}-profile-self`, name: 'Me', isSelf: true })).toBe(
      true,
    );
    expect(canAddProfileToReusePlan(sourceTrip, form, simenProfile)).toBe(true);
    expect(
      canAddProfileToReusePlan(sourceTrip, form, {
        id: `${TRIP_ID}-profile-emilie`,
        name: 'Emilie',
        isSelf: false,
      }),
    ).toBe(true);
  });

  it('rejects duplicate name when adding to plan', () => {
    const form = {
      ...createReuseFormStateFromTrip(sourceTrip),
      selectedPackingListIds: [primaryPackingListId(TRIP_ID)],
      newTravellers: [
        {
          id: 'entry-1',
          profile: simenProfile,
          packingMode: 'generated' as const,
        },
      ],
    };

    expect(canAddProfileToReusePlan(sourceTrip, form, simenProfile)).toBe(false);
  });
});
