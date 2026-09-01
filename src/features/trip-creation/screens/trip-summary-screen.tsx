import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ScreenHeader } from '@/components/navigation/screen-header';
import { AppScreen } from '@/components/ui/app-screen';
import { getDestinationCountryLabel, getDestinationLabel } from '@/domain/destination';
import { normalizeTripDraft } from '@/domain/trip-draft-profiles';
import { SummaryImportantSection } from '@/features/trip-creation/components/summary-important-section';
import { SummaryFooter } from '@/features/trip-creation/components/summary-footer';
import { TripSummaryDetailsContent } from '@/features/trip-creation/components/trip-summary-details-content';
import { WeatherPreview } from '@/features/trip-creation/components/weather-preview';
import {
  buildCreateTripEditHref,
  type WizardStepKey,
} from '@/features/trip-creation/utils/wizard-navigation';
import { getPackingForLabel } from '@/features/trip-creation/utils/summary-labels';
import { resolveLastWizardStepIndex } from '@/features/trip-creation/utils/wizard-steps';
import { getTripSummaryDetailsScreenTitle } from '@/features/trip-edit/utils/trip-details-navigation';
import { useProfile } from '@/hooks/use-profile';
import { useTrips } from '@/hooks/use-trips';
import { blurActiveElement } from '@/lib/blur-active-element';
import { spacing, screenPaddingHorizontal } from '@/theme/spacing';

export function TripSummaryScreen() {
  const router = useRouter();
  const { draft, commitDraftTrip, setDraftWizardStep } = useTrips();
  const { importantByProfileId } = useProfile();
  const normalizedDraft = useMemo(() => normalizeTripDraft(draft), [draft]);
  const [manualCreateLoading, setManualCreateLoading] = useState(false);

  const destinationLabel = getDestinationLabel(normalizedDraft.destination);
  const countryLabel = getDestinationCountryLabel(normalizedDraft.destination);
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
      <ScreenHeader title={getTripSummaryDetailsScreenTitle('create')} onBack={handleBack} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <TripSummaryDetailsContent
          mode="create"
          facts={{
            destinationLabel,
            countryLabel,
            startDate: normalizedDraft.startDate,
            endDate: normalizedDraft.endDate,
            tripContext: normalizedDraft.tripContext,
            accommodation: normalizedDraft.accommodation,
            laundry: normalizedDraft.laundry,
            packingForLabel: getPackingForLabel(normalizedDraft.packingProfiles),
            bags: normalizedDraft.bags,
            note: normalizedDraft.note,
          }}
          editHandlers={{
            onEditDestination: () => openEdit('destination'),
            onEditTripContext: () => openEdit('trip-context'),
            onEditStayingIn: () => openEdit('accommodation'),
            onEditPackingFor: () => openEdit('packing-profiles'),
            onEditPackingIn: () => openEdit('bags'),
            onEditNote: () => openEdit('note'),
          }}
          weatherSlot={<WeatherPreview key={weatherKey} draft={normalizedDraft} />}
          importantSlot={
            <SummaryImportantSection
              profiles={normalizedDraft.packingProfiles}
              importantByProfileId={importantByProfileId}
              onEdit={() => openEdit('important')}
            />
          }
        />
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
});
