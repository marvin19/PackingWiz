/** Base radius token: 16px (--radius: 1rem in v0) */
export const baseRadius = 16;

export const radii = {
  sm: 10,
  md: 13,
  lg: baseRadius,
  xl: 22,
  '2xl': 24,
  '3xl': 35,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radii;
