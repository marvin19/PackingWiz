import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import {
  formatTripIdentityAccessibilityLabel,
  getTripSecondaryLocationLine,
} from '@/domain/trip-identity-display';
import type { Trip } from '@/domain/trip';
import { getTripName } from '@/domain/trip-name';
import { useTheme } from '@/hooks/use-theme';
import type { TypographyToken } from '@/theme/typography';

/** `inline` — beside header chrome (e.g. Pack progress ring). `stacked` — full-width hero headers. */
export type TripIdentityTitleLayout = 'inline' | 'stacked';

type TripIdentityTitleProps = {
  trip: Pick<Trip, 'name' | 'title' | 'destination'>;
  layout?: TripIdentityTitleLayout;
  /** Override default line limit for the layout preset. */
  titleNumberOfLines?: number;
  showLocationPin?: boolean;
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
  showLocationPin = false,
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
        showLocationPin ? (
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={14} color={theme.colors.mutedForeground} />
            <AppText
              variant="bodySmall"
              color="mutedForeground"
              numberOfLines={2}
              ellipsizeMode="tail"
              maxFontSizeMultiplier={1.2}
              style={styles.locationText}>
              {locationLine}
            </AppText>
          </View>
        ) : (
          <AppText
            variant="bodySmall"
            color="mutedForeground"
            numberOfLines={2}
            ellipsizeMode="tail"
            maxFontSizeMultiplier={1.2}
            style={styles.locationText}>
            {locationLine}
          </AppText>
        )
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    minWidth: 0,
  },
  locationText: {
    flex: 1,
    minWidth: 0,
  },
});
