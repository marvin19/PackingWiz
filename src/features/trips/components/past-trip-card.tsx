import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { durationDays, formatRange } from '@/domain/dates';
import type { Trip } from '@/domain/trip';
import { getTripName } from '@/domain/trip-name';
import { TripHeroImage } from '@/features/trips/components/trip-hero-image';
import { useTheme } from '@/hooks/use-theme';

type PastTripCardProps = {
  trip: Trip;
  onPress?: (tripId: string) => void;
};

export function PastTripCard({ trip, onPress }: PastTripCardProps) {
  const theme = useTheme();
  const days = durationDays(trip.startDate, trip.endDate);
  const tripName = getTripName(trip);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${tripName}`}
      disabled={!onPress}
      onPress={() => onPress?.(trip.id)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
        onPress && pressed && styles.pressed,
      ]}>
      <View style={styles.thumbnailWrap}>
        <TripHeroImage trip={trip} height={56} compact />
      </View>
      <View style={styles.copy}>
        <AppText variant="bodySmall" numberOfLines={1} style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
          {tripName}
        </AppText>
        <AppText variant="bodySmall" color="mutedForeground" numberOfLines={1}>
          {formatRange(trip.startDate, trip.endDate)} · {days} {days === 1 ? 'day' : 'days'}
        </AppText>
      </View>
      <Feather name="chevron-right" size={16} color={theme.colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  thumbnailWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
});
