import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { durationDays, formatRange } from '@/domain/dates';
import { formatTripPeopleCount, getTripPackingPeopleCount } from '@/domain/packing-list-display';
import type { Trip } from '@/domain/trip';
import { getTripName } from '@/domain/trip-name';
import { buildPreviousTripMenuAccessibilityLabel } from '@/features/trips/utils/trip-delete-display';
import { TripHeroImage } from '@/features/trips/components/trip-hero-image';
import { useTheme } from '@/hooks/use-theme';

type PastTripManagementCardProps = {
  trip: Trip;
  onPress: (tripId: string) => void;
  onOpenMenu: (tripId: string) => void;
};

export function PastTripManagementCard({ trip, onPress, onOpenMenu }: PastTripManagementCardProps) {
  const theme = useTheme();
  const days = durationDays(trip.startDate, trip.endDate);
  const tripName = getTripName(trip);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${tripName}`}
        onPress={() => onPress(trip.id)}
        style={({ pressed }) => [styles.mainPressable, pressed && styles.pressed]}>
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
          <AppText variant="bodySmall" color="mutedForeground" numberOfLines={1}>
            {formatTripPeopleCount(getTripPackingPeopleCount(trip))}
          </AppText>
        </View>
        <Feather name="chevron-right" size={16} color={theme.colors.mutedForeground} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={buildPreviousTripMenuAccessibilityLabel(trip)}
        onPress={() => onOpenMenu(trip.id)}
        style={({ pressed }) => [
          styles.menuButton,
          {
            backgroundColor: theme.colors.muted,
            borderLeftColor: theme.colors.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}>
        <Feather name="more-horizontal" size={18} color={theme.colors.foreground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  mainPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 10,
    minHeight: 44,
  },
  pressed: {
    opacity: 0.95,
  },
  thumbnailWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  menuButton: {
    width: 44,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
});
