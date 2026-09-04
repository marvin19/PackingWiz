import { createDestinationFromText } from '@/domain/destination';
import { buildReuseTripChangesSummary } from '@/domain/reuse-trip-changes';
import { normalizeTrip, primaryPackingListId, type TripLike } from '@/domain/trip-compatibility';

const TRIP_ID = 'trip-changes';

function createSourceTrip(): ReturnType<typeof normalizeTrip> {
  const meListId = primaryPackingListId(TRIP_ID);
  const emilieListId = `${TRIP_ID}-list-emilie`;

  const input: TripLike = {
    id: TRIP_ID,
    name: 'Lisbon City Break',
    title: 'Lisbon City Break',
    destination: createDestinationFromText('Lisbon', 'Portugal'),
    startDate: '2025-07-01',
    endDate: '2025-07-05',
    tripContext: ['City'],
    accommodation: 'hotel',
    laundry: 'no',
    travelers: [],
    bags: [{ id: 'bag-1', name: 'Carry-on', type: 'carryon', ownerId: null }],
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
  };

  return normalizeTrip(input);
}

describe('buildReuseTripChangesSummary', () => {
  const sourceTrip = createSourceTrip();
  const meSnapshot = sourceTrip.packingLists[0]!.profileSnapshot;

  it('reports longer duration with singular/plural copy', () => {
    const summary = buildReuseTripChangesSummary({
      sourceTrip,
      plannedStartDate: '2026-08-01',
      plannedEndDate: '2026-08-10',
      plannedDestination: sourceTrip.destination,
      plannedTripContext: sourceTrip.tripContext,
      plannedAccommodation: sourceTrip.accommodation,
      plannedLaundry: sourceTrip.laundry,
      plannedBags: sourceTrip.bags,
      selectedSourceProfileSnapshots: [meSnapshot],
      newTravellerSnapshots: [],
    });

    expect(summary.durationDiffers).toBe(true);
    expect(summary.lines).toContain('5 days longer than the original trip');
  });

  it('reports one day longer with singular copy', () => {
    const summary = buildReuseTripChangesSummary({
      sourceTrip,
      plannedStartDate: '2026-08-01',
      plannedEndDate: '2026-08-06',
      plannedDestination: sourceTrip.destination,
      plannedTripContext: sourceTrip.tripContext,
      plannedAccommodation: sourceTrip.accommodation,
      plannedLaundry: sourceTrip.laundry,
      plannedBags: sourceTrip.bags,
      selectedSourceProfileSnapshots: [meSnapshot],
      newTravellerSnapshots: [],
    });

    expect(summary.lines).toContain('1 day longer than the original trip');
  });

  it('reports shorter duration', () => {
    const summary = buildReuseTripChangesSummary({
      sourceTrip,
      plannedStartDate: '2026-08-01',
      plannedEndDate: '2026-08-03',
      plannedDestination: sourceTrip.destination,
      plannedTripContext: sourceTrip.tripContext,
      plannedAccommodation: sourceTrip.accommodation,
      plannedLaundry: sourceTrip.laundry,
      plannedBags: sourceTrip.bags,
      selectedSourceProfileSnapshots: [meSnapshot],
      newTravellerSnapshots: [],
    });

    expect(summary.lines).toContain('2 days shorter than the original trip');
  });

  it('reports one day shorter with singular copy', () => {
    const summary = buildReuseTripChangesSummary({
      sourceTrip,
      plannedStartDate: '2026-08-01',
      plannedEndDate: '2026-08-04',
      plannedDestination: sourceTrip.destination,
      plannedTripContext: sourceTrip.tripContext,
      plannedAccommodation: sourceTrip.accommodation,
      plannedLaundry: sourceTrip.laundry,
      plannedBags: sourceTrip.bags,
      selectedSourceProfileSnapshots: [meSnapshot],
      newTravellerSnapshots: [],
    });

    expect(summary.lines).toContain('1 day shorter than the original trip');
  });

  it('omits duration when unchanged', () => {
    const summary = buildReuseTripChangesSummary({
      sourceTrip,
      plannedStartDate: '2026-08-01',
      plannedEndDate: '2026-08-05',
      plannedDestination: sourceTrip.destination,
      plannedTripContext: sourceTrip.tripContext,
      plannedAccommodation: sourceTrip.accommodation,
      plannedLaundry: sourceTrip.laundry,
      plannedBags: sourceTrip.bags,
      selectedSourceProfileSnapshots: [meSnapshot],
      newTravellerSnapshots: [],
    });

    expect(summary.durationDiffers).toBe(false);
    expect(summary.lines.some((line) => line.includes('longer') || line.includes('shorter'))).toBe(
      false,
    );
  });

  it('reports removed and added travellers', () => {
    const summary = buildReuseTripChangesSummary({
      sourceTrip,
      plannedStartDate: '2026-08-01',
      plannedEndDate: '2026-08-05',
      plannedDestination: sourceTrip.destination,
      plannedTripContext: sourceTrip.tripContext,
      plannedAccommodation: sourceTrip.accommodation,
      plannedLaundry: sourceTrip.laundry,
      plannedBags: sourceTrip.bags,
      selectedSourceProfileSnapshots: [meSnapshot],
      newTravellerSnapshots: [{ id: 'profile-simen', name: 'Simen', isSelf: false }],
    });

    expect(summary.lines).toContain("Emilie won't be included");
    expect(summary.lines).toContain('Simen will be added');
    expect(summary.lines.some((line) => line.includes('Me'))).toBe(false);
  });

  it('reports destination and trip context changes', () => {
    const summary = buildReuseTripChangesSummary({
      sourceTrip,
      plannedStartDate: '2026-08-01',
      plannedEndDate: '2026-08-05',
      plannedDestination: createDestinationFromText('Porto', 'Portugal'),
      plannedTripContext: ['Beach'],
      plannedAccommodation: sourceTrip.accommodation,
      plannedLaundry: sourceTrip.laundry,
      plannedBags: sourceTrip.bags,
      selectedSourceProfileSnapshots: [meSnapshot],
      newTravellerSnapshots: [],
    });

    expect(summary.lines).toContain('Destination changed to Porto');
    expect(summary.lines).toContain('Trip context changed');
  });
});
