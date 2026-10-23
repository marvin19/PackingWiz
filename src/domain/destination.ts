export interface Destination {
  displayName: string;
  placeId?: string;
  latitude?: number;
  longitude?: number;
  countryCode?: string;
  /** Human-readable country/region label until Places provides countryCode */
  countryName?: string;
}

export function emptyDestination(): Destination {
  return { displayName: '' };
}

export function createDestinationFromText(
  displayName: string,
  countryName?: string,
): Destination {
  return {
    displayName,
    countryName: countryName?.trim() || undefined,
  };
}

export function getDestinationLabel(destination: Destination): string {
  return destination.displayName.trim();
}

export function getDestinationCountryLabel(destination: Destination): string {
  return destination.countryName?.trim() ?? '';
}

/** Place name for trip cards — includes country when set and distinct from the place. */
export function formatTripCardLocationLine(destination: Destination): string {
  const place = getDestinationLabel(destination);
  const country = getDestinationCountryLabel(destination);

  if (place && country && !place.toLowerCase().includes(country.toLowerCase())) {
    return `${place}, ${country}`;
  }

  return place || country;
}
