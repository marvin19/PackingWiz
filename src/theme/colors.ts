/**
 * Semantic color tokens derived from the v0 prototype (light mode only).
 * OKLCH source values are noted in comments for design reference.
 */

export const colors = {
  /** oklch(0.98 0.006 95) — warm paper neutral */
  background: '#F9F8F5',
  /** oklch(0.26 0.02 235) */
  foreground: '#3A3F47',
  /** oklch(1 0 0) */
  card: '#FFFFFF',
  cardForeground: '#3A3F47',
  /** oklch(0.52 0.062 192) — pine / deep teal */
  primary: '#3F7F7C',
  /** oklch(0.99 0.01 180) */
  primaryForeground: '#F7FDFC',
  /** oklch(0.955 0.008 120) */
  secondary: '#F2F3EE',
  secondaryForeground: '#454A52',
  /** oklch(0.955 0.006 110) */
  muted: '#F2F2ED',
  /** oklch(0.52 0.014 230) */
  mutedForeground: '#737980',
  /** oklch(0.93 0.024 190) */
  accent: '#E5F2F1',
  /** oklch(0.38 0.05 195) */
  accentForeground: '#3D6468',
  /** oklch(0.585 0.2 22) */
  destructive: '#D64545',
  /** oklch(0.9 0.006 130) */
  border: '#E5E6E0',
  input: '#E5E6E0',
  /** oklch(0.74 0.13 66) — warm amber for shopping */
  buy: '#D4A054',
  /** oklch(0.34 0.08 62) */
  buyForeground: '#6B4E1F',
  /** oklch(0.6 0.11 155) */
  success: '#4A9B6E',
} as const;

export type ColorToken = keyof typeof colors;
