import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { getDestinationLabel } from '@/domain/destination';
import { formatRange } from '@/domain/dates';
import { PackingListOptionRow } from '@/features/packing/components/packing-list-option-row';
import { useTripNavigation } from '@/hooks/use-trip-navigation';
import { useTrips } from '@/hooks/use-trips';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal } from '@/theme/spacing';

export function PackingListPickerScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { activeTrip, activeTripId, beginTripPackEntry } = useTrips();
  const { selectPackingListAndOpenPack } = useTripNavigation();

  useEffect(() => {
    if (!activeTrip || !activeTripId || activeTrip.packingLists.length > 1) {
      return;
    }

    beginTripPackEntry(activeTripId);
    router.replace('/(tabs)/pack');
  }, [activeTrip, activeTripId, beginTripPackEntry, router]);

  if (!activeTrip || !activeTripId) {
    return (
      <AppScreen style={styles.empty}>
        <AppText variant="bodySmall" color="mutedForeground" style={styles.emptyCopy}>
          Choose a trip from Trips to pick a packing list.
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go to trips"
          onPress={() => router.navigate('/(tabs)')}
          style={({ pressed }) => [styles.backLink, pressed && styles.pressed]}>
          <AppText variant="bodySmall" color="primary" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
            Go to trips
          </AppText>
        </Pressable>
      </AppScreen>
    );
  }

  if (activeTrip.packingLists.length <= 1) {
    return (
      <AppScreen style={styles.empty}>
        <AppText variant="bodySmall" color="mutedForeground" style={styles.emptyCopy}>
          This trip has one packing list. Opening Pack…
        </AppText>
      </AppScreen>
    );
  }

  return (
    <AppScreen style={styles.screen}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to trips"
          onPress={() => router.navigate('/(tabs)')}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Feather name="arrow-left" size={18} color={theme.colors.mutedForeground} />
          <AppText variant="caption" color="mutedForeground" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
            Trips
          </AppText>
        </Pressable>

        <AppText variant="title" style={{ fontFamily: theme.fontFamilies.displayExtraBold }}>
          {getDestinationLabel(activeTrip.destination)}
        </AppText>
        <AppText variant="bodySmall" color="mutedForeground">
          {formatRange(activeTrip.startDate, activeTrip.endDate)}
        </AppText>

        <View style={styles.intro}>
          <AppText variant="subheading" style={{ fontFamily: theme.fontFamilies.displayExtraBold }}>
            Who are you packing for?
          </AppText>
          <AppText variant="bodySmall" color="mutedForeground">
            Choose a packing list to continue.
          </AppText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        showsVerticalScrollIndicator={false}>
        {activeTrip.packingLists.map((list) => (
          <PackingListOptionRow
            key={list.id}
            trip={activeTrip}
            list={list}
            onPress={() => selectPackingListAndOpenPack(activeTripId, list.id)}
          />
        ))}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: screenPaddingHorizontal,
    gap: 8,
    paddingBottom: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingVertical: 4,
  },
  intro: {
    marginTop: 8,
    gap: 4,
  },
  list: {
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: 8,
    gap: 10,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: screenPaddingHorizontal,
    gap: 12,
  },
  emptyCopy: {
    textAlign: 'center',
    lineHeight: 20,
  },
  backLink: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  pressed: {
    opacity: 0.9,
  },
});
