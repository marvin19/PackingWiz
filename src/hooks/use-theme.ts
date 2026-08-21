import { theme, type Theme } from '@/theme';

export function useTheme() {
  return theme;
}

export { theme, type Theme };
export { colors, type ColorToken } from '@/theme/colors';
export { typography, fontFamilies, type TypographyToken } from '@/theme/typography';
export { spacing, screenPaddingHorizontal, type SpacingToken } from '@/theme/spacing';
export { radii, baseRadius, type RadiusToken } from '@/theme/radii';
