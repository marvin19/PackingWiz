import { createDestinationFromText } from '@/domain/destination';
import { normalizeTrip, primaryPackingListId, type TripLike } from '@/domain/trip-compatibility';
import {
  isCanonicalTripShape,
  resolveExplicitPackingListId,
  tripHasMixedPackingModes,
} from '@/domain/trip-canonical';
import { mockSeedTrips } from '@/mocks/seed-trips';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function verifyCanonicalSeedFixtures(): void {
  const multi = mockSeedTrips.find((trip) => trip.packingLists.length > 1);
  assert(Boolean(multi), 'seed includes a multi-list trip');
  assert(isCanonicalTripShape(multi!), 'multi-list seed is canonical');
  assert(
    multi!.packingLists.every((list) => list.profileSnapshot.id && list.profileSnapshot.name),
    'each seed list has a profile snapshot',
  );
}

function verifyMixedPackingModesPreserved(): void {
  const lisbon = mockSeedTrips.find((trip) => trip.id === 'lisbon');
  assert(Boolean(lisbon), 'Lisbon reuse fixture present');
  assert(lisbon!.packingLists.length >= 2, 'Lisbon is multi-person');
  assert(tripHasMixedPackingModes(lisbon!), 'Lisbon seed preserves mixed generated/manual lists');

  const normalized = normalizeTrip(lisbon!);
  assert(
    normalized.packingLists.some((list) => list.packingMode === 'generated') &&
      normalized.packingLists.some((list) => list.packingMode === 'manual'),
    'normalize preserves mixed packing modes on canonical fixture',
  );
}

function verifyNormalizationIdempotentOnSeed(): void {
  for (const trip of mockSeedTrips) {
    const once = normalizeTrip(trip);
    const twice = normalizeTrip(once);
    assert(
      twice.packingLists.map((list) => list.id).join(',') ===
        once.packingLists.map((list) => list.id).join(','),
      `${trip.id}: list ids stable across normalize`,
    );
  }
}

function verifyExplicitListRequiredForMultiList(): void {
  const multi = mockSeedTrips.find((trip) => trip.packingLists.length > 1)!;
  let threw = false;
  try {
    resolveExplicitPackingListId(multi, null);
  } catch {
    threw = true;
  }
  assert(threw, 'multi-list trip rejects implicit list targeting');
}

function verifyLegacyIngressMigration(): void {
  const legacy: TripLike = {
    id: 'mp6a-legacy',
    title: 'Legacy flat',
    destination: createDestinationFromText('Trondheim'),
    startDate: '2025-01-01',
    endDate: '2025-01-03',
    tripContext: [],
    accommodation: 'hotel',
    laundry: 'no',
    travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
    bags: [],
    note: '',
    weather: { mode: 'climate', summary: 'Cold', detail: '', high: 0, low: -5 },
    insights: [],
    items: [],
    packingMode: 'generated',
    generated: true,
    status: 'past',
  };

  const normalized = normalizeTrip(legacy);
  assert(
    normalized.packingLists[0]?.id === primaryPackingListId('mp6a-legacy'),
    'legacy ingress migrates to deterministic primary list id',
  );
}

export async function runMp6aInvariantChecks(): Promise<void> {
  verifyCanonicalSeedFixtures();
  verifyMixedPackingModesPreserved();
  verifyNormalizationIdempotentOnSeed();
  verifyExplicitListRequiredForMultiList();
  verifyLegacyIngressMigration();
}
