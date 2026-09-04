import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/navigation/screen-header';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { DateField } from '@/components/ui/date-field';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SectionTitle } from '@/components/ui/section-title';
import { parseDate } from '@/domain/dates';
import { startOfLocalCalendarDay } from '@/domain/new-trip-date-validation';
import { ReuseAddTravellerSheet } from '@/features/trips/components/reuse-add-traveller-sheet';
import { ReuseChangesFromOriginal } from '@/features/trips/components/reuse-changes-from-original';
import { ReuseNewTravellerList } from '@/features/trips/components/reuse-new-traveller-list';
import { ReuseTripDetailsSummary } from '@/features/trips/components/reuse-trip-details-summary';
import { ReuseTripSourceSummaryCard } from '@/features/trips/components/reuse-trip-source-summary-card';
import { ReuseTravellerSelection } from '@/features/trips/components/reuse-traveller-selection';
import {
  REUSE_TRIP_CTA_LABEL,
  REUSE_TRIP_SCREEN_TITLE,
} from '@/features/trips/utils/reuse-trip-display';
import {
  buildReuseTripSectionHref,
} from '@/features/trips/utils/reuse-trip-navigation';
import {
  addReuseNewTraveller,
  buildReuseTripInput,
  getReuseNewTravellerRows,
  getReuseSourceSummary,
  getReuseTripChangesSummary,
  getReuseTripExplanation,
  getReuseTravellerRows,
  removeReuseNewTraveller,
  toggleReuseTravellerSelection,
  validateReuseTripForm,
  type ReuseTripFormState,
} from '@/features/trips/utils/reuse-trip-view-model';
import { useProfile } from '@/hooks/use-profile';
import { useTrips } from '@/hooks/use-trips';
import { useReuseTripSession } from '@/providers/reuse-trip-session-provider';
import { useTheme } from '@/hooks/use-theme';
import { goBackOrReplace } from '@/lib/safe-navigation';
import { screenPaddingHorizontal, spacing } from '@/theme/spacing';

function parseTripIdParam(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() || null;
}

export function ReuseTripScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tripId?: string }>();
  const sourceTripId = parseTripIdParam(params.tripId);

  const { trips, reuseTrip, repositoryError, beginTripPackEntry } = useTrips();
  const { savedPackingProfiles } = useProfile();
  const { ensureForm, updateForm, clearForm } = useReuseTripSession();
  const theme = useTheme();

  const [submitting, setSubmitting] = useState(false);
  const [addPersonVisible, setAddPersonVisible] = useState(false);
  const [revision, setRevision] = useState(0);
  const submitGuardRef = useRef(false);

  const sourceTrip = useMemo(
    () => (sourceTripId ? trips.find((entry) => entry.id === sourceTripId) ?? null : null),
    [sourceTripId, trips],
  );

  const form = useMemo(() => {
    if (!sourceTrip) {
      return null;
    }

    ensureForm(sourceTrip);
    void revision;
    return ensureForm(sourceTrip);
  }, [ensureForm, revision, sourceTrip]);

  const patchForm = useCallback(
    (patch: Partial<ReuseTripFormState>) => {
      if (!sourceTripId) {
        return;
      }

      updateForm(sourceTripId, patch);
      setRevision((value) => value + 1);
    },
    [sourceTripId, updateForm],
  );

  const validation = useMemo(
    () => (form ? validateReuseTripForm(form) : null),
    [form],
  );

  const sourceSummary = useMemo(
    () => (sourceTrip ? getReuseSourceSummary(sourceTrip) : null),
    [sourceTrip],
  );

  const travellerRows = useMemo(
    () => (sourceTrip && form ? getReuseTravellerRows(sourceTrip, form.selectedPackingListIds) : []),
    [form, sourceTrip],
  );

  const newTravellerRows = useMemo(
    () => (form ? getReuseNewTravellerRows(form) : []),
    [form],
  );

  const changesSummary = useMemo(
    () => (sourceTrip && form ? getReuseTripChangesSummary(sourceTrip, form) : null),
    [form, sourceTrip],
  );

  const explanation = useMemo(
    () =>
      form && changesSummary ? getReuseTripExplanation(form, changesSummary) : null,
    [changesSummary, form],
  );

  const minimumStartDate = startOfLocalCalendarDay(new Date());

  const handleBack = useCallback(() => {
    if (sourceTripId) {
      clearForm(sourceTripId);
    }
    goBackOrReplace('/trip/browse?filter=previous');
  }, [clearForm, sourceTripId]);

  const handleEditSection = useCallback(
    (section: Parameters<typeof buildReuseTripSectionHref>[1]) => {
      if (!sourceTripId) {
        return;
      }

      router.push(buildReuseTripSectionHref(sourceTripId, section));
    },
    [router, sourceTripId],
  );

  const handleAddPerson = useCallback(
    (profile: Parameters<typeof addReuseNewTraveller>[1], packingMode: 'generated' | 'manual') => {
      if (!form) {
        return;
      }

      const next = addReuseNewTraveller(form, profile, packingMode);
      patchForm({ newTravellers: next.newTravellers });
    },
    [form, patchForm],
  );

  const handleSubmit = useCallback(async () => {
    if (!sourceTrip || !form || !validation?.canSubmit || submitGuardRef.current) {
      return;
    }

    submitGuardRef.current = true;
    setSubmitting(true);

    try {
      const created = await reuseTrip(sourceTrip.id, buildReuseTripInput(form));
      clearForm(sourceTrip.id);

      const destination = beginTripPackEntry(created.id);
      if (destination === 'select-list') {
        router.replace('/(tabs)/pack/select-list');
        return;
      }

      router.replace('/(tabs)/pack');
    } catch {
      // repositoryError surfaced below; remain on screen with preserved form state
    } finally {
      submitGuardRef.current = false;
      setSubmitting(false);
    }
  }, [beginTripPackEntry, clearForm, form, reuseTrip, router, sourceTrip, validation?.canSubmit]);

  if (!sourceTripId || !sourceTrip || !form || !sourceSummary || !validation || !changesSummary || !explanation) {
    return (
      <AppScreen style={styles.emptyScreen}>
        <ScreenHeader title={REUSE_TRIP_SCREEN_TITLE} onBack={handleBack} />
        <View style={styles.emptyBody}>
          <AppText variant="bodySmall" color="mutedForeground" style={styles.emptyCopy}>
            This trip is no longer available.
          </AppText>
          <PrimaryButton label="Back to Trips" onPress={handleBack} />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen style={styles.screen}>
      <ScreenHeader title={REUSE_TRIP_SCREEN_TITLE} onBack={handleBack} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 96 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <ReuseTripSourceSummaryCard summary={sourceSummary} />

          <View style={styles.section}>
            <SectionTitle>Dates</SectionTitle>
            <View style={styles.dateRow}>
              <DateField
                label="Departure"
                value={form.startDate}
                onChange={(startDate) => patchForm({ startDate })}
                minimumDate={minimumStartDate}
              />
              <DateField
                label="Return"
                value={form.endDate}
                onChange={(endDate) => patchForm({ endDate })}
                minimumDate={form.startDate ? parseDate(form.startDate) : minimumStartDate}
              />
            </View>
            {validation.dateError ? (
              <AppText variant="bodySmall" color="destructive" style={styles.inlineError}>
                {validation.dateError}
              </AppText>
            ) : null}
          </View>

          <View style={styles.section}>
            <SectionTitle>Packing for</SectionTitle>
            <ReuseTravellerSelection
              rows={travellerRows}
              error={validation.travellerError}
              onToggle={(listId) =>
                patchForm({
                  selectedPackingListIds: toggleReuseTravellerSelection(
                    form.selectedPackingListIds,
                    listId,
                  ),
                })
              }
              onAddPerson={() => setAddPersonVisible(true)}
            />
            <ReuseNewTravellerList
              rows={newTravellerRows}
              onRemove={(entryId) => patchForm(removeReuseNewTraveller(form, entryId))}
            />
          </View>

          <View style={styles.section}>
            <SectionTitle>Trip details</SectionTitle>
            <ReuseTripDetailsSummary form={form} onEditSection={handleEditSection} />
          </View>

          <ReuseChangesFromOriginal summary={changesSummary} />

          <AppText variant="bodySmall" color="mutedForeground" style={styles.explanation}>
            {explanation}
          </AppText>

          {validation.persistenceError ? (
            <AppText variant="bodySmall" color="destructive" style={styles.inlineError}>
              {validation.persistenceError}
            </AppText>
          ) : null}

          {repositoryError ? (
            <AppText variant="bodySmall" color="destructive" style={styles.inlineError}>
              {repositoryError}
            </AppText>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, 16),
            borderTopColor: theme.colors.border,
            backgroundColor: theme.colors.background,
          },
        ]}>
        <PrimaryButton
          label={submitting ? 'Creating trip…' : REUSE_TRIP_CTA_LABEL}
          onPress={handleSubmit}
          disabled={!validation.canSubmit || submitting}
        />
      </View>

      <ReuseAddTravellerSheet
        visible={addPersonVisible}
        sourceTrip={sourceTrip}
        form={form}
        savedPackingProfiles={savedPackingProfiles}
        onClose={() => setAddPersonVisible(false)}
        onConfirm={handleAddPerson}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
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
    gap: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  explanation: {
    lineHeight: 20,
  },
  inlineError: {
    lineHeight: 20,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: 12,
  },
});
