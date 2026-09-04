import { getDestinationCountryLabel, getDestinationLabel } from '@/domain/destination';
import type { Trip } from '@/domain/trip';
import type { TripSummaryDetailsFacts } from '@/features/trip-creation/components/trip-summary-details-content';
import { getPackingForLabel } from '@/features/trip-creation/utils/summary-labels';

export function getTripDetailsFactsFromTrip(trip: Trip): TripSummaryDetailsFacts {
  return {
    destinationLabel: getDestinationLabel(trip.destination),
    countryLabel: getDestinationCountryLabel(trip.destination),
    startDate: trip.startDate,
    endDate: trip.endDate,
    tripContext: trip.tripContext,
    accommodation: trip.accommodation,
    laundry: trip.laundry,
    packingForLabel: getPackingForLabel(trip.packingLists.map((list) => list.profileSnapshot)),
    bags: trip.bags,
    note: trip.note,
  };
}
