export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 32,
} as const;

export type SpacingToken = keyof typeof spacing;

/** Standard horizontal screen padding (v0 px-5) */
export const screenPaddingHorizontal = spacing.lg;
