export const fontFamilies = {
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
  display: 'Manrope_700Bold',
  displayExtraBold: 'Manrope_800ExtraBold',
} as const;

export const typography = {
  micro: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fontFamilies.sansMedium,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamilies.sansMedium,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fontFamilies.sans,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fontFamilies.sans,
  },
  bodySemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fontFamilies.sansSemiBold,
  },
  subheading: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fontFamilies.displayExtraBold,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fontFamilies.displayExtraBold,
  },
  heading: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: fontFamilies.displayExtraBold,
  },
  hero: {
    fontSize: 30,
    lineHeight: 36,
    fontFamily: fontFamilies.displayExtraBold,
  },
  sectionLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamilies.sansSemiBold,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
} as const;

export type TypographyToken = keyof typeof typography;
