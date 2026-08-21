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
