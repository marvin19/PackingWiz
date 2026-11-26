import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import {
  formatTripIdentityAccessibilityLabel,
  getTripSecondaryLocationLine,
} from '@/domain/trip-identity-display';
import type { Trip } from '@/domain/trip';
import { getTripName } from '@/domain/trip-name';
import { TripIdentityLocationRow } from '@/features/trips/components/trip-identity-location-row';
import { useTheme } from '@/hooks/use-theme';
import type { TypographyToken } from '@/theme/typography';

/** `inline` — beside header chrome (e.g. Pack progress ring). `stacked` — full-width hero headers. */
export type TripIdentityTitleLayout = 'inline' | 'stacked';

type TripIdentityTitleProps = {
  trip: Pick<Trip, 'name' | 'title' | 'destination' | 'isTripNameUserEdited'>;
  layout?: TripIdentityTitleLayout;
  /** Override default line limit for the layout preset. */
  titleNumberOfLines?: number;
};

const LAYOUT_PRESETS: Record<
  TripIdentityTitleLayout,
  { titleVariant: TypographyToken; titleNumberOfLines: number; maxFontSizeMultiplier: number }
> = {
  inline: {
    titleVariant: 'subheading',
    titleNumberOfLines: 2,
    maxFontSizeMultiplier: 1.25,
  },
  stacked: {
    titleVariant: 'title',
    titleNumberOfLines: 3,
    maxFontSizeMultiplier: 1.3,
  },
};

export function TripIdentityTitle({
  trip,
  layout = 'stacked',
  titleNumberOfLines,
}: TripIdentityTitleProps) {
  const theme = useTheme();
  const tripName = getTripName(trip);
  const locationLine = getTripSecondaryLocationLine(trip);
  const preset = LAYOUT_PRESETS[layout];
  const resolvedTitleLines = titleNumberOfLines ?? preset.titleNumberOfLines;

  return (
    <View
      style={styles.root}
      accessible
      accessibilityRole="header"
      accessibilityLabel={formatTripIdentityAccessibilityLabel(trip)}>
      <AppText
        variant={preset.titleVariant}
        numberOfLines={resolvedTitleLines}
        ellipsizeMode="tail"
        maxFontSizeMultiplier={preset.maxFontSizeMultiplier}
        style={[styles.title, { fontFamily: theme.fontFamilies.displayExtraBold }]}>
        {tripName}
      </AppText>
      {locationLine ? (
        <TripIdentityLocationRow
          locationLine={locationLine}
          pinColor={theme.colors.mutedForeground}
          decorativeForScreenReader
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 4,
    minWidth: 0,
    flexShrink: 1,
    alignSelf: 'stretch',
  },
  title: {
    flexShrink: 1,
    minWidth: 0,
    width: '100%',
  },
});