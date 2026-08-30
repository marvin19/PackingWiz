import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ProgressBar } from '@/components/ui/progress-bar';
import { AppText } from '@/components/ui/app-text';
import { getDestinationCountryLabel } from '@/domain/destination';
import { durationDays, formatRange } from '@/domain/dates';
import { packingStats } from '@/domain/packing-stats';
import type { Trip } from '@/domain/trip';
import { getTripName } from '@/domain/trip-name';
import { TripHeroImage } from '@/features/trips/components/trip-hero-image';
import { getTripContextIcon } from '@/features/trips/utils/trip-context-icon';
import { useTheme } from '@/hooks/use-theme';
import { cardShadow } from '@/theme/shadows';

type UpcomingTripCardProps = {
  trip: Trip;
  onPress: (tripId: string) => void;
};

function tripContextBadgeLabel(trip: Trip): string {
  return trip.tripContext[0] ?? 'Trip';
}

export function UpcomingTripCard({ trip, onPress }: UpcomingTripCardProps) {
  const theme = useTheme();
  const stats = packingStats(trip);
  const days = durationDays(trip.startDate, trip.endDate);
  const typeIcon = getTripContextIcon(trip.tripContext[0]);
  const country = getDestinationCountryLabel(trip.destination);
  const tripName = getTripName(trip);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${tripName} packing list`}
      onPress={() => onPress(trip.id)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          ...cardShadow(theme.colors.foreground),
        },
        pressed && styles.pressed,
      ]}>
      <View style={styles.heroWrap}>
        <TripHeroImage trip={trip} />
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: `${theme.colors.background}E6` },
          ]}>
          <Feather name={typeIcon} size={14} color={theme.colors.primary} />
          <AppText variant="caption" style={styles.typeBadgeText}>
            {tripContextBadgeLabel(trip)}
          </AppText>
        </View>
        <View style={styles.heroText}>
          <AppText
            style={[
              styles.tripTitle,
              { color: '#FFFFFF', fontFamily: theme.fontFamilies.display },
            ]}>
            {tripName}
          </AppText>
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={14} color="rgba(255,255,255,0.85)" />
            <AppText variant="bodySmall" style={styles.countryText}>
              {country}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.metaRow}>
          <AppText variant="bodySmall" style={{ fontFamily: theme.fontFamilies.sansMedium }}>
            {formatRange(trip.startDate, trip.endDate)}
          </AppText>
          <AppText variant="bodySmall" color="mutedForeground">
            {days} {days === 1 ? 'day' : 'days'}
            {trip.packingLists.length > 1
              ? ` · ${trip.packingLists.length} people`
              : ''}
          </AppText>
        </View>

        <View style={styles.progressBlock}>
          <View style={styles.progressHeader}>
            <AppText variant="caption" color="mutedForeground" style={{ fontFamily: theme.fontFamilies.sansMedium }}>
              Packing progress
            </AppText>
            <AppText variant="caption" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
              {stats.packed} / {stats.total} packed
            </AppText>
          </View>
          <ProgressBar value={stats.pct} accessibilityLabel={`${tripName} packing progress`} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 24,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.98,
    transform: [{ scale: 0.99 }],
  },
  heroWrap: {
    position: 'relative',
  },
  typeBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  typeBadgeText: {
    fontFamily: 'Inter_600SemiBold',
  },
  heroText: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 12,
  },
  tripTitle: {
    fontSize: 24,
    lineHeight: 28,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  countryText: {
    color: 'rgba(255,255,255,0.85)',
  },
  body: {
    padding: 16,
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBlock: {
    gap: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
