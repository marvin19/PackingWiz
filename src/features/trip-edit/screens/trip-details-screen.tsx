import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/navigation/screen-header';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TripSummaryDetailsContent } from '@/features/trip-creation/components/trip-summary-details-content';
import {
  parseEditTripReturnTo,
  resolveEditTripReturnPath,
} from '@/features/trip-edit/utils/edit-trip-navigation';
import { getTripDetailsFactsFromTrip } from '@/features/trip-edit/utils/trip-details-facts';
import {
  buildTripDetailsSectionHref,
  getTripSummaryDetailsScreenTitle,
} from '@/features/trip-edit/utils/trip-details-navigation';
import { getTripDetailsDoneLabel } from '@/features/trip-edit/utils/edit-trip-view-model';
import { useTrips } from '@/hooks/use-trips';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal, spacing } from '@/theme/spacing';

export function TripDetailsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const returnTo = parseEditTripReturnTo(params.returnTo);
  const { activeTrip, activeTripId } = useTrips();

  const facts = useMemo(
    () => (activeTrip ? getTripDetailsFactsFromTrip(activeTrip) : null),
    [activeTrip],
  );

  const openSection = useCallback(
    (section: Parameters<typeof buildTripDetailsSectionHref>[0]) => {
      router.push(buildTripDetailsSectionHref(section, returnTo));
    },
    [returnTo, router],
  );

  const handleDone = useCallback(() => {
    router.replace(resolveEditTripReturnPath(returnTo));
  }, [returnTo, router]);

  if (!activeTrip || !facts) {
    const emptyMessage = activeTripId
      ? 'This trip is no longer available. Choose another trip from Trips.'
      : 'No trip selected.';

    return (
      <AppScreen style={styles.emptyScreen}>
        <ScreenHeader title={getTripSummaryDetailsScreenTitle('existing')} onClose={handleDone} />
        <View style={styles.emptyBody}>
          <Feather name="edit-2" size={32} color={theme.colors.mutedForeground} />
          <AppText variant="bodySmall" color="mutedForeground" style={styles.emptyCopy}>
            {emptyMessage}
          </AppText>
          <PrimaryButton label="Go to Trips" onPress={() => router.navigate('/(tabs)')} />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen style={styles.screen}>
      <ScreenHeader
        title={getTripSummaryDetailsScreenTitle('existing')}
        onClose={handleDone}
        closeAccessibilityLabel="Done editing trip details"
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 96 },
        ]}
        showsVerticalScrollIndicator={false}>
        <TripSummaryDetailsContent
          mode="existing"
          facts={facts}
          editHandlers={{
            onEditDestination: () => openSection('destination'),
            onEditTripContext: () => openSection('trip-context'),
            onEditStayingIn: () => openSection('accommodation'),
            onEditPackingFor: () => openSection('packing-for'),
            onEditPackingIn: () => openSection('bags'),
            onEditNote: () => openSection('note'),
          }}
        />
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.border,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}>
        <PrimaryButton label={getTripDetailsDoneLabel()} onPress={handleDone} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  emptyScreen: {
    flex: 1,
  },
  emptyBody: {
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
  scrollContent: {
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: spacing.sm,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: 12,
  },
});
