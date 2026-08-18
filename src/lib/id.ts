const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function createUuid(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, '0')}`;
}

export function createPackingItemId(): string {
  return `pack-item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ensureTripUuid(tripId: string): string {
  return isUuid(tripId) ? tripId : createUuid();
}
