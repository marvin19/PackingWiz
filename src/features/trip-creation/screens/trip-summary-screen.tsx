import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ScreenHeader } from '@/components/navigation/screen-header';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { getDestinationCountryLabel, getDestinationLabel } from '@/domain/destination';
import { durationDays, formatRange } from '@/domain/dates';
import { SummaryDetailCard } from '@/features/trip-creation/components/summary-detail-card';
import { SummaryEditButton } from '@/features/trip-creation/components/summary-edit-button';
import { SummaryFooter } from '@/features/trip-creation/components/summary-footer';
import { TripFact } from '@/features/trip-creation/components/trip-fact';
import { WeatherPreview } from '@/features/trip-creation/components/weather-preview';
import { getAccommodationIcon, getBagIcon } from '@/features/trip-creation/utils/catalog-icons';
import {
  buildCreateTripEditHref,
  type WizardStepKey,
} from '@/features/trip-creation/utils/wizard-navigation';
import {
  getAccommodationLabel,
  getBagsSummaryLabel,
  getTravelerCountLabel,
  getTripContextLabel,
} from '@/features/trip-creation/utils/summary-labels';
import { getCategoryIcon } from '@/features/packing/utils/category-icons';
import { useTheme } from '@/hooks/use-theme';
import { useTrips } from '@/hooks/use-trips';
import { blurActiveElement } from '@/lib/blur-active-element';
import { spacing, screenPaddingHorizontal } from '@/theme/spacing';

export function TripSummaryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { draft, commitDraftTrip } = useTrips();
  const [manualCreateLoading, setManualCreateLoading] = useState(false);

  const days = useMemo(
    () => (draft.startDate && draft.endDate ? durationDays(draft.startDate, draft.endDate) : 0),
    [draft.endDate, draft.startDate],
  );

  const destinationLabel = getDestinationLabel(draft.destination);
  const countryLabel = getDestinationCountryLabel(draft.destination);
  const tripContextIcon = getCategoryIcon('Clothing');
  const accommodationIcon = getAccommodationIcon(draft.accommodation ?? 'hotel');
  const packingInIcon = getBagIcon('carryon');
  const weatherKey = `${destinationLabel}-${draft.startDate}-${draft.endDate}-${countryLabel}`;

  const openEdit = useCallback(
    (stepKey: WizardStepKey) => {
      blurActiveElement();
      router.push(buildCreateTripEditHref(stepKey));
    },
    [router],
  );

  const handleBack = () => {
    blurActiveElement();
    router.replace('/trip/create');
  };

  const handleGenerate = () => {
    blurActiveElement();
    router.push('/trip/generating');
  };

  const handleManualCreate = async () => {
    if (manualCreateLoading) {
      return;
    }

    blurActiveElement();
    setManualCreateLoading(true);

    try {
      await commitDraftTrip('manual');
      router.replace('/(tabs)/pack');
    } catch {
      // Draft is preserved; repositoryError is set in TripsProvider.
    } finally {
      setManualCreateLoading(false);
    }
  };

  return (
    <AppScreen>
      <ScreenHeader title="Trip summary" onBack={handleBack} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroHeader}>
            <View style={styles.heroCopy}>
              <AppText variant="title" style={{ fontFamily: theme.fontFamilies.displayExtraBold }}>
                {destinationLabel || 'Your trip'}
              </AppText>
              <AppText variant="bodySmall" color="mutedForeground" style={styles.heroMeta}>
                {countryLabel ? `${countryLabel} · ` : ''}
                {formatRange(draft.startDate, draft.endDate)}
                {days > 0 ? ` · ${days} ${days === 1 ? 'day' : 'days'}` : ''}
              </AppText>
            </View>
            <SummaryEditButton
              accessibilityLabel="Edit destination and dates"
              onPress={() => openEdit('destination')}
              compact
            />
          </View>
        </View>

        <View style={styles.factsGrid}>
          <View style={styles.factsRow}>
            <TripFact
              icon={<Feather name={tripContextIcon} size={16} color={theme.colors.mutedForeground} />}
              label="Trip context"
              value={getTripContextLabel(draft.tripContext)}
              editAccessibilityLabel="Edit trip context"
              onEdit={() => openEdit('trip-context')}
            />
            <TripFact
              icon={<Feather name={accommodationIcon} size={16} color={theme.colors.mutedForeground} />}
              label="Staying in"
              value={getAccommodationLabel(draft.accommodation)}
              editAccessibilityLabel="Edit accommodation and laundry"
              onEdit={() => openEdit('accommodation')}
            />
          </View>
          <View style={styles.factsRow}>
            <TripFact
              icon={<Feather name="users" size={16} color={theme.colors.mutedForeground} />}
              label="Travelers"
              value={getTravelerCountLabel(draft.travelers.length)}
              editAccessibilityLabel="Edit travelers"
              onEdit={() => openEdit('travelers')}
            />
            <TripFact
              icon={<Feather name={packingInIcon} size={16} color={theme.colors.mutedForeground} />}
              label="Packing in"
              value={getBagsSummaryLabel(draft.bags)}
              editAccessibilityLabel="Edit bags"
              onEdit={() => openEdit('bags')}
            />
          </View>
        </View>

        <WeatherPreview key={weatherKey} draft={draft} />

        <SummaryDetailCard
          icon={<Feather name="file-text" size={16} color={theme.colors.primary} />}
          title="Additional information"
          editAccessibilityLabel="Edit additional information"
          onEdit={() => openEdit('note')}>
          {draft.note ? (
            <AppText variant="bodySmall" color="mutedForeground" style={styles.noteBody}>
              {draft.note}
            </AppText>
          ) : (
            <AppText variant="bodySmall" color="mutedForeground" style={styles.noteBody}>
              No information added
            </AppText>
          )}
        </SummaryDetailCard>
      </ScrollView>

      <SummaryFooter
        onGenerate={handleGenerate}
        onManualCreate={handleManualCreate}
        manualCreateLoading={manualCreateLoading}
        manualCreateDisabled={manualCreateLoading}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  hero: {
    marginBottom: spacing.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  heroMeta: {
    lineHeight: 20,
  },
  factsGrid: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  factsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  noteBody: {
    lineHeight: 20,
  },
});
