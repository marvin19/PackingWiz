import { Feather } from '@expo/vector-icons';

export type TripFeatherIcon = keyof typeof Feather.glyphMap;

const CONTEXT_ICON_RULES: { keywords: string[]; icon: TripFeatherIcon }[] = [
  { keywords: ['business'], icon: 'briefcase' },
  { keywords: ['city'], icon: 'home' },
  { keywords: ['beach'], icon: 'umbrella' },
  { keywords: ['hiking', 'outdoor', 'camping'], icon: 'navigation' },
  { keywords: ['ski'], icon: 'cloud' },
  { keywords: ['marathon', 'running', 'training', 'cycling'], icon: 'activity' },
  { keywords: ['wedding', 'dinner'], icon: 'heart' },
  { keywords: ['family'], icon: 'users' },
  { keywords: ['vacation'], icon: 'sun' },
];

const CONTEXT_TINT_RULES: { keywords: string[]; tint: string }[] = [
  { keywords: ['business'], tint: '#DDE3EA' },
  { keywords: ['city'], tint: '#E0E4EC' },
  { keywords: ['beach'], tint: '#E8DFCF' },
  { keywords: ['hiking', 'outdoor', 'camping'], tint: '#D8E6DA' },
  { keywords: ['ski'], tint: '#DDE4EE' },
  { keywords: ['marathon', 'running', 'training', 'cycling'], tint: '#E2E6DE' },
  { keywords: ['wedding', 'dinner'], tint: '#E8E4DC' },
  { keywords: ['family'], tint: '#E8E4DC' },
  { keywords: ['vacation'], tint: '#D4E8E6' },
];

const DEFAULT_ICON: TripFeatherIcon = 'star';
const DEFAULT_TINT = '#E5EAE9';

function matchesKeyword(tag: string, keyword: string): boolean {
  return tag.toLowerCase().includes(keyword);
}

export function getTripContextIcon(tag: string | undefined): TripFeatherIcon {
  if (!tag) {
    return DEFAULT_ICON;
  }

  for (const rule of CONTEXT_ICON_RULES) {
    if (rule.keywords.some((keyword) => matchesKeyword(tag, keyword))) {
      return rule.icon;
    }
  }

  return DEFAULT_ICON;
}

export function getTripContextTint(tag: string | undefined): string {
  if (!tag) {
    return DEFAULT_TINT;
  }

  for (const rule of CONTEXT_TINT_RULES) {
    if (rule.keywords.some((keyword) => matchesKeyword(tag, keyword))) {
      return rule.tint;
    }
  }

  return DEFAULT_TINT;
}

export function formatTripContext(tags: string[]): string {
  if (tags.length === 0) {
    return 'Not specified';
  }

  return tags.join(', ');
}
