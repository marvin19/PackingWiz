import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ProgressBar } from '@/components/ui/progress-bar';
import { AppText } from '@/components/ui/app-text';
import { TRIP_TYPES } from '@/domain/catalog';
import { durationDays, formatRange } from '@/domain/dates';
import { packingStats } from '@/domain/packing-stats';
import type { Trip } from '@/domain/trip';
import { TripHeroImage } from '@/features/trips/components/trip-hero-image';
import { getTripTypeIcon } from '@/features/trips/utils/trip-type-icon';
import { useTheme } from '@/hooks/use-theme';

type UpcomingTripCardProps = {
  trip: Trip;
  onPress: (tripId: string) => void;
};

function tripTypeLabel(trip: Trip): string {
  const primaryType = trip.types[0];
  return TRIP_TYPES.find((entry) => entry.id === primaryType)?.label ?? 'Trip';
}

export function UpcomingTripCard({ trip, onPress }: UpcomingTripCardProps) {
  const theme = useTheme();
  const stats = packingStats(trip);
  const days = durationDays(trip.startDate, trip.endDate);
  const typeIcon = getTripTypeIcon(trip.types[0] ?? 'vacation');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${trip.title} packing list`}
      onPress={() => onPress(trip.id)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.foreground,
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
            {tripTypeLabel(trip)}
          </AppText>
        </View>
        <View style={styles.heroText}>
          <AppText
            style={[
              styles.tripTitle,
              { color: '#FFFFFF', fontFamily: theme.fontFamilies.display },
            ]}>
            {trip.title}
          </AppText>
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={14} color="rgba(255,255,255,0.85)" />
            <AppText variant="bodySmall" style={styles.countryText}>
              {trip.country}
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
          <ProgressBar value={stats.pct} accessibilityLabel={`${trip.title} packing progress`} />
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
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
