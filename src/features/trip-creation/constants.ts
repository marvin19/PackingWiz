import { createDestinationFromText } from '@/domain/destination';

export const WIZARD_STEP_TITLES = [
  'Where are you going?',
  'What kind of trip is this?',
  'Where are you staying?',
  'Who are you packing for?',
  'What are you packing in?',
  'Anything else?',
] as const;

export const WIZARD_STEP_COUNT = WIZARD_STEP_TITLES.length;

export const DESTINATION_SUGGESTIONS = [
  { destination: 'Tokyo & Kyoto', country: 'Japan' },
  { destination: 'Lisbon', country: 'Portugal' },
  { destination: 'Chamonix', country: 'France' },
  { destination: 'Bali', country: 'Indonesia' },
] as const;

export function suggestionToDestination(suggestion: (typeof DESTINATION_SUGGESTIONS)[number]) {
  return createDestinationFromText(suggestion.destination, suggestion.country);
}
