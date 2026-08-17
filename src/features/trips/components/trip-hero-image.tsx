import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import type { Trip } from '@/domain/trip';
import { getTripTypeIcon } from '@/features/trips/utils/trip-type-icon';
import { getTripImageSource, getTripPlaceholderTint } from '@/features/trips/utils/trip-image';
import { useTheme } from '@/hooks/use-theme';

type TripHeroImageProps = {
  trip: Trip;
  height?: number;
  compact?: boolean;
};

export function TripHeroImage({ trip, height = 160, compact = false }: TripHeroImageProps) {
  const theme = useTheme();
  const source = getTripImageSource(trip);
  const typeIcon = getTripTypeIcon(trip.types[0] ?? 'vacation');
  const placeholderTint = getTripPlaceholderTint(trip);

  return (
    <View style={[styles.container, { height }]}>
      {source ? (
        <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: placeholderTint }]}>
          <View style={styles.placeholderIconWrap}>
            <Feather
              name={typeIcon}
              size={compact ? 22 : 32}
              color={theme.colors.primary}
            />
          </View>
        </View>
      )}
      {!compact ? (
        <>
          <View style={styles.lightOverlay} />
          <View style={styles.bottomOverlay} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  placeholderIconWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.45,
  },
  lightOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(58, 63, 71, 0.05)',
  },
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
    backgroundColor: 'rgba(58, 63, 71, 0.55)',
  },
});
