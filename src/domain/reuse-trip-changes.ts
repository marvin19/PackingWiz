import type { Bag } from '@/domain/bag';
import type { Destination } from '@/domain/destination';
import { durationDays } from '@/domain/dates';
import { formatNaturalEnglishList } from '@/domain/natural-list-format';
import type { PackingProfileSnapshot } from '@/domain/packing-profile';
import type { AccommodationId, LaundryOption, Trip } from '@/domain/trip';

export type ReuseTripChangesInput = {
  sourceTrip: Trip;
  plannedStartDate: string;
  plannedEndDate: string;
  plannedDestination: Destination;
  plannedTripContext: string[];
  plannedAccommodation: AccommodationId;
  plannedLaundry: LaundryOption;
  plannedBags: Bag[];
  selectedSourceProfileSnapshots: PackingProfileSnapshot[];
  newTravellerSnapshots: PackingProfileSnapshot[];
};

export type ReuseTripChangesSummary = {
  lines: string[];
  durationDiffers: boolean;
};

function profileIdentityKey(snapshot: PackingProfileSnapshot): string {
  return snapshot.isSelf ? 'self' : snapshot.id;
}

function displayProfileName(snapshot: PackingProfileSnapshot): string {
  return snapshot.isSelf ? 'Me' : snapshot.name;
}

function normalizeTags(tags: string[]): string[] {
  return [...tags].map((tag) => tag.trim()).filter(Boolean).sort();
}

function destinationsEqual(a: Destination, b: Destination): boolean {
  return a.displayName.trim().toLowerCase() === b.displayName.trim().toLowerCase();
}

function bagsEqual(a: Bag[], b: Bag[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const normalize = (bags: Bag[]) =>
    bags
      .map((bag) => `${bag.name.trim().toLowerCase()}|${bag.type}`)
      .sort()
      .join(',');

  return normalize(a) === normalize(b);
}

function formatDurationDeltaLine(deltaDays: number): string {
  const magnitude = Math.abs(deltaDays);
  const dayWord = magnitude === 1 ? 'day' : 'days';

  if (deltaDays > 0) {
    return `${magnitude} ${dayWord} longer than the original trip`;
  }

  return `${magnitude} ${dayWord} shorter than the original trip`;
}

function formatRemovedTravellerLine(name: string): string {
  return `${name} won't be included`;
}

function formatAddedTravellerLine(name: string): string {
  return `${name} will be added`;
}

/**
 * Deterministic "Changes from original" lines for reuse confirmation.
 * Omits unchanged fields and returns empty lines when nothing meaningful differs.
 */
export function buildReuseTripChangesSummary(input: ReuseTripChangesInput): ReuseTripChangesSummary {
  const lines: string[] = [];

  const sourceDuration = durationDays(input.sourceTrip.startDate, input.sourceTrip.endDate);
  const plannedDuration = durationDays(input.plannedStartDate, input.plannedEndDate);
  const durationDelta = plannedDuration - sourceDuration;
  const durationDiffers = durationDelta !== 0;

  if (durationDiffers) {
    lines.push(formatDurationDeltaLine(durationDelta));
  }

  const sourceProfiles = input.sourceTrip.packingLists.map((list) => list.profileSnapshot);
  const sourceKeys = new Set(sourceProfiles.map(profileIdentityKey));
  const plannedKeys = new Set([
    ...input.selectedSourceProfileSnapshots.map(profileIdentityKey),
    ...input.newTravellerSnapshots.map(profileIdentityKey),
  ]);

  const removedNames = sourceProfiles
    .filter((snapshot) => !plannedKeys.has(profileIdentityKey(snapshot)))
    .map(displayProfileName);

  for (const name of removedNames) {
    lines.push(formatRemovedTravellerLine(name));
  }

  const addedNames = [
    ...input.newTravellerSnapshots.map(displayProfileName),
    ...input.selectedSourceProfileSnapshots
      .filter((snapshot) => !sourceKeys.has(profileIdentityKey(snapshot)))
      .map(displayProfileName),
  ];

  for (const name of addedNames) {
    lines.push(formatAddedTravellerLine(name));
  }

  if (!destinationsEqual(input.sourceTrip.destination, input.plannedDestination)) {
    const label = input.plannedDestination.displayName.trim() || 'a new destination';
    lines.push(`Destination changed to ${label}`);
  }

  const sourceContext = normalizeTags(input.sourceTrip.tripContext);
  const plannedContext = normalizeTags(input.plannedTripContext);
  if (sourceContext.join('|') !== plannedContext.join('|')) {
    lines.push('Trip context changed');
  }

  if (input.sourceTrip.accommodation !== input.plannedAccommodation) {
    lines.push('Accommodation changed');
  }

  if (input.sourceTrip.laundry !== input.plannedLaundry) {
    lines.push('Laundry option changed');
  }

  if (!bagsEqual(input.sourceTrip.bags, input.plannedBags)) {
    lines.push('Bags changed');
  }

  return {
    lines,
    durationDiffers,
  };
}

export function formatReuseTravellerChangeList(names: string[]): string {
  return formatNaturalEnglishList(names);
}
