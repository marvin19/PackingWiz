import { reconcileActivePackingListId } from '@/domain/active-packing-list';
import type { Trip } from '@/domain/trip';
import { createDestinationFromText } from '@/domain/destination';

function createTrip(listIds: string[]): Trip {
  return {
    id: 'trip-1',
    name: 'Trip',
    title: 'Trip',
    destination: createDestinationFromText('Oslo', 'Norway'),
    startDate: '2026-06-01',
    endDate: '2026-06-07',
    tripContext: ['Vacation'],
    accommodation: 'hotel',
    laundry: 'no',
    travelers: [],
    bags: [],
    note: '',
    weather: {
      mode: 'climate',
      summary: 'Fixture',
      detail: '',
      high: 20,
      low: 10,
    },
    packingLists: listIds.map((listId, index) => ({
      id: listId,
      packingProfileId: `profile-${index}`,
      profileSnapshot: {
        id: `profile-${index}`,
        name: index === 0 ? 'Me' : `Person ${index}`,
        isSelf: index === 0,
      },
      packingMode: 'generated' as const,
      items: [],
    })),
    items: [],
    insights: [],
    packingMode: 'generated',
    generated: true,
    status: 'upcoming',
  };
}

describe('reconcileActivePackingListId', () => {
  it('auto-resolves the only PackingList on a single-list trip', () => {
    const trip = createTrip(['list-me']);
    const resolution = reconcileActivePackingListId('trip-1', null, [trip]);

    expect(resolution.activePackingListId).toBe('list-me');
    expect(resolution.autoResolved).toBe(true);
    expect(resolution.selectionRequired).toBe(false);
  });

  it('requires explicit selection for multi-list trips without a carried list id', () => {
    const trip = createTrip(['list-me', 'list-emilie']);
    const resolution = reconcileActivePackingListId('trip-1', null, [trip]);

    expect(resolution.activePackingListId).toBeNull();
    expect(resolution.selectionRequired).toBe(true);
    expect(resolution.autoResolved).toBe(false);
  });

  it('preserves a carried list id when it belongs to the active trip', () => {
    const trip = createTrip(['list-me', 'list-emilie']);
    const resolution = reconcileActivePackingListId('trip-1', 'list-emilie', [trip]);

    expect(resolution.activePackingListId).toBe('list-emilie');
    expect(resolution.selectionRequired).toBe(false);
  });
});
