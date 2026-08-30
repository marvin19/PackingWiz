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
  getPackingForLabel,
  getTripContextLabel,
} from '@/features/trip-creation/utils/summary-labels';
import { normalizeTripDraft } from '@/domain/trip-draft-profiles';
import { getTripContextIcon } from '@/features/trips/utils/trip-context-icon';
import { useTheme } from '@/hooks/use-theme';
import { useTrips } from '@/hooks/use-trips';
import { useProfile } from '@/hooks/use-profile';
import { blurActiveElement } from '@/lib/blur-active-element';
import { spacing, screenPaddingHorizontal } from '@/theme/spacing';
import { resolveLastWizardStepIndex } from '@/features/trip-creation/utils/wizard-steps';
import { SummaryImportantSection } from '@/features/trip-creation/components/summary-important-section';

export function TripSummaryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { draft, commitDraftTrip, setDraftWizardStep } = useTrips();
  const { importantByProfileId } = useProfile();
  const normalizedDraft = useMemo(() => normalizeTripDraft(draft), [draft]);
  const [manualCreateLoading, setManualCreateLoading] = useState(false);

  const days = useMemo(
    () =>
      normalizedDraft.startDate && normalizedDraft.endDate
        ? durationDays(normalizedDraft.startDate, normalizedDraft.endDate)
        : 0,
    [normalizedDraft.endDate, normalizedDraft.startDate],
  );

  const destinationLabel = getDestinationLabel(normalizedDraft.destination);
  const countryLabel = getDestinationCountryLabel(normalizedDraft.destination);
  const tripContextIcon = getTripContextIcon(normalizedDraft.tripContext[0]);
  const accommodationIcon = getAccommodationIcon(normalizedDraft.accommodation ?? 'hotel');
  const packingInIcon = getBagIcon('carryon');
  const weatherKey = `${destinationLabel}-${normalizedDraft.startDate}-${normalizedDraft.endDate}-${countryLabel}`;

  const openEdit = useCallback(
    (stepKey: WizardStepKey) => {
      blurActiveElement();
      router.push(buildCreateTripEditHref(stepKey));
    },
    [router],
  );

  const handleBack = () => {
    blurActiveElement();
    setDraftWizardStep(resolveLastWizardStepIndex());
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
                {formatRange(normalizedDraft.startDate, normalizedDraft.endDate)}
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
              value={getTripContextLabel(normalizedDraft.tripContext)}
              editAccessibilityLabel="Edit trip context"
              onEdit={() => openEdit('trip-context')}
            />
            <TripFact
              icon={<Feather name={accommodationIcon} size={16} color={theme.colors.mutedForeground} />}
              label="Staying in"
              value={getAccommodationLabel(normalizedDraft.accommodation)}
              editAccessibilityLabel="Edit accommodation and laundry"
              onEdit={() => openEdit('accommodation')}
            />
          </View>
          <View style={styles.factsRow}>
            <TripFact
              icon={<Feather name="users" size={16} color={theme.colors.mutedForeground} />}
              label="Packing for"
              value={getPackingForLabel(normalizedDraft.packingProfiles)}
              editAccessibilityLabel="Edit who you are packing for"
              onEdit={() => openEdit('packing-profiles')}
            />
            <TripFact
              icon={<Feather name={packingInIcon} size={16} color={theme.colors.mutedForeground} />}
              label="Packing in"
              value={getBagsSummaryLabel(normalizedDraft.bags)}
              editAccessibilityLabel="Edit bags"
              onEdit={() => openEdit('bags')}
            />
          </View>
        </View>

        <WeatherPreview key={weatherKey} draft={normalizedDraft} />

        <SummaryImportantSection
          profiles={normalizedDraft.packingProfiles}
          importantByProfileId={importantByProfileId}
          onEdit={() => openEdit('important')}
        />

        <SummaryDetailCard
          icon={<Feather name="file-text" size={16} color={theme.colors.primary} />}
          title="Additional information"
          editAccessibilityLabel="Edit additional information"
          onEdit={() => openEdit('note')}>
          {normalizedDraft.note ? (
            <AppText variant="bodySmall" color="mutedForeground" style={styles.noteBody}>
              {normalizedDraft.note}
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
        multiplePackingLists={normalizedDraft.packingProfiles.length > 1}
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
