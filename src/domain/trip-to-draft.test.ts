import type { Trip } from '@/domain/trip';
import { createDestinationFromText } from '@/domain/destination';
import { normalizeTrip, primaryPackingListId, type TripLike } from '@/domain/trip-compatibility';
import { tripToTripDraft } from '@/domain/trip-to-draft';

function createGenerationTrip(): Trip {
  const tripId = 'trip-draft-fidelity';
  const input: TripLike = {
    id: tripId,
    name: 'Summer trip',
    title: 'Summer trip',
    destination: createDestinationFromText('Barcelona', 'Spain'),
    startDate: '2026-07-01',
    endDate: '2026-07-10',
    tripContext: ['Beach', 'City'],
    accommodation: 'apartment',
    laundry: 'unsure',
    travelers: [
      { id: 't-you', name: 'You', role: 'Adult', birthDate: '1990-01-01' },
      { id: 'profile-emilie', name: 'Emilie', role: 'Child', age: 8 },
    ],
    bags: [{ id: 'bag-1', name: 'Carry-on', type: 'carryon', ownerId: 't-you' }],
    note: 'Window seat please',
    weather: {
      mode: 'climate',
      summary: 'Hot',
      detail: 'Heatwave',
      high: 32,
      low: 22,
    },
    insights: ['Bring sunscreen'],
    status: 'upcoming',
    image: 'trip-image.jpg',
    packingLists: [
      {
        id: primaryPackingListId(tripId),
        packingProfileId: `${tripId}-profile-self`,
        profileSnapshot: {
          id: `${tripId}-profile-self`,
          name: 'Me',
          isSelf: true,
        },
        packingMode: 'generated',
        items: [
          {
            id: 'item-1',
            name: 'Packed shirt',
            quantity: 1,
            category: 'Clothing',
            packed: true,
            needToBuy: false,
            assignedTo: null,
          },
        ],
      },
      {
        id: `${tripId}-list-emilie`,
        packingProfileId: 'profile-emilie',
        profileSnapshot: {
          id: 'profile-emilie',
          name: 'Emilie',
          age: 8,
          isSelf: false,
        },
        packingMode: 'manual',
        items: [],
      },
    ],
    items: [],
    packingMode: 'generated',
    generated: true,
  };

  return normalizeTrip(input);
}

describe('tripToTripDraft', () => {
  it('preserves generation-relevant shared context from an existing Trip', () => {
    const trip = createGenerationTrip();
    const draft = tripToTripDraft(trip);

    expect(draft.destination).toEqual(trip.destination);
    expect(draft.startDate).toBe(trip.startDate);
    expect(draft.endDate).toBe(trip.endDate);
    expect(draft.tripContext).toEqual(trip.tripContext);
    expect(draft.accommodation).toBe(trip.accommodation);
    expect(draft.laundry).toBe(trip.laundry);
    expect(draft.bags).toEqual(trip.bags);
    expect(draft.note).toBe(trip.note);
    expect(draft.travelers).toEqual(trip.travelers);
    expect(draft.packingProfiles).toHaveLength(2);
    expect(draft.packingProfiles[0].isSelf).toBe(true);
    expect(draft.packingProfiles[1].name).toBe('Emilie');
  });

  it('does not copy Trip runtime/generated fields into TripDraft', () => {
    const trip = createGenerationTrip();
    const draft = tripToTripDraft(trip);

    expect(draft).not.toHaveProperty('weather');
    expect(draft).not.toHaveProperty('insights');
    expect(draft).not.toHaveProperty('packingLists');
    expect(draft).not.toHaveProperty('items');
    expect(draft).not.toHaveProperty('status');
    expect(draft).not.toHaveProperty('image');
    expect(draft).not.toHaveProperty('name');
  });
});
