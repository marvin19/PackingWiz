import { createDestinationFromText } from '@/domain/destination';

export const DESTINATION_SUGGESTIONS = [
  { destination: 'Tokyo & Kyoto', country: 'Japan' },
  { destination: 'Lisbon', country: 'Portugal' },
  { destination: 'Chamonix', country: 'France' },
  { destination: 'Bali', country: 'Indonesia' },
] as const;

export function suggestionToDestination(suggestion: (typeof DESTINATION_SUGGESTIONS)[number]) {
  return createDestinationFromText(suggestion.destination, suggestion.country);
}
