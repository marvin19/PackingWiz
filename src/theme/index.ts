import { colors } from '@/theme/colors';
import { radii } from '@/theme/radii';
import { spacing } from '@/theme/spacing';
import { fontFamilies, typography } from '@/theme/typography';

export { colors, type ColorToken } from '@/theme/colors';
export { fontAssets, fontFamilyNames } from '@/theme/fonts';
export { fontFamilies, typography, type TypographyToken } from '@/theme/typography';
export { baseRadius, radii, type RadiusToken } from '@/theme/radii';
export { screenPaddingHorizontal, spacing, type SpacingToken } from '@/theme/spacing';

export const theme = {
  colors,
  radii,
  spacing,
  fontFamilies,
  typography,
} as const;

export type Theme = typeof theme;
