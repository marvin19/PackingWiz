import type { Traveler } from '@/domain/traveler';
import { createDestinationFromText } from '@/domain/destination';

export const WIZARD_STEP_TITLES = [
  'Where are you going?',
  'What kind of trip is this?',
  'Where are you staying?',
  "Who's coming?",
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

export const TRAVELER_PRESETS: { label: string; travelers: Traveler[] }[] = [
  { label: 'Solo', travelers: [{ id: 't-you', name: 'You', role: 'Adult' }] },
  {
    label: 'Partner',
    travelers: [
      { id: 't-you', name: 'You', role: 'Adult' },
      { id: 't-partner', name: 'Partner', role: 'Adult' },
    ],
  },
  {
    label: 'Family',
    travelers: [
      { id: 't-anna', name: 'Anna', role: 'Adult' },
      { id: 't-martin', name: 'Martin', role: 'Adult' },
      { id: 't-emma', name: 'Emma', role: 'Child' },
      { id: 't-oliver', name: 'Oliver', role: 'Child' },
    ],
  },
];
