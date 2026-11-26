import { Feather } from '@expo/vector-icons';
import { StyleSheet, View, type TextStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { ColorToken } from '@/theme/colors';
import { typography } from '@/theme/typography';

export const TRIP_IDENTITY_LOCATION_PIN_SIZE = 14;
const LOCATION_SUBTITLE_LINE_HEIGHT = typography.bodySmall.lineHeight;

/** Nudge the pin to visually center on the first subtitle line (bodySmall lineHeight vs icon size). */
export function tripIdentityLocationPinOffset(
  lineHeight: number = LOCATION_SUBTITLE_LINE_HEIGHT,
  iconSize: number = TRIP_IDENTITY_LOCATION_PIN_SIZE,
): number {
  return Math.max(0, Math.round((lineHeight - iconSize) / 2));
}

export type TripIdentityLocationRowProps = {
  locationLine: string;
  pinColor: string;
  textColor?: ColorToken;
  textStyle?: TextStyle;
  numberOfLines?: number;
  maxFontSizeMultiplier?: number;
  /** When nested in an accessible header, hide the decorative row from the a11y tree. */
  decorativeForScreenReader?: boolean;
};

export function TripIdentityLocationRow({
  locationLine,
  pinColor,
  textColor = 'mutedForeground',
  textStyle,
  numberOfLines = 2,
  maxFontSizeMultiplier = 1.2,
  decorativeForScreenReader = false,
}: TripIdentityLocationRowProps) {
  const pinOffset = tripIdentityLocationPinOffset();

  return (
    <View
      style={styles.row}
      accessibilityElementsHidden={decorativeForScreenReader ? true : undefined}
      importantForAccessibility={decorativeForScreenReader ? 'no-hide-descendants' : undefined}>
      <View style={[styles.pinWrap, { paddingTop: pinOffset }]}>
        <Feather name="map-pin" size={TRIP_IDENTITY_LOCATION_PIN_SIZE} color={pinColor} />
      </View>
      <AppText
        variant="bodySmall"
        color={textColor}
        numberOfLines={numberOfLines}
        ellipsizeMode="tail"
        maxFontSizeMultiplier={maxFontSizeMultiplier}
        style={[styles.text, textStyle, { lineHeight: LOCATION_SUBTITLE_LINE_HEIGHT }]}>
        {locationLine}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    minWidth: 0,
  },
  pinWrap: {
    flexShrink: 0,
  },
  /** Horizontal flex only — safe beside the pin inside a row (PW-TECH-001H-A). */
  text: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
});