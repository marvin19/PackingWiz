import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/navigation/screen-header';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { AppTextInput, Field } from '@/components/ui/field';
import { PrimaryButton } from '@/components/ui/primary-button';
import { BAG_TYPES } from '@/domain/catalog';
import type { Bag, BagType } from '@/domain/bag';
import type { PackingProfile } from '@/domain/packing-profile';
import type { AccommodationId, LaundryOption } from '@/domain/trip';
import { findTripContextTag, tripContextIncludes } from '@/domain/trip-context-tags';
import type { TripDraft } from '@/domain/trip-draft';
import { AddTravellerSheet } from '@/features/trip-edit/components/add-traveller-sheet';
import { DiscardChangesSheet } from '@/features/trip-edit/components/discard-changes-sheet';
import { EditTripTravellerRow } from '@/features/trip-edit/components/edit-trip-traveller-row';
import { RemoveTravellerConfirmSheet } from '@/features/trip-edit/components/remove-traveller-confirm-sheet';
import {
  parseEditTripReturnTo,
  resolveEditTripReturnPath,
} from '@/features/trip-edit/utils/edit-trip-navigation';
import {
  buildPostSaveNotice,
  buildSharedDetailsPatch,
  buildTravellerAddedNotice,
  buildTravellerRemovedNotice,
  canRemoveTravellerFromTrip,
  createEditFormStateFromTrip,
  getEditTripPrimaryFooterLabel,
  getEditTripTravellerRows,
  hasStagedSharedChanges,
  isEditTripPrimaryFooterEnabled,
  shouldDiscardStagedEdits,
  shouldExecuteRemoveTraveller,
  shouldProceedWithAddTraveller,
  type TripEditFormState,
} from '@/features/trip-edit/utils/edit-trip-view-model';
import { AccommodationStep } from '@/features/trip-creation/components/steps/accommodation-step';
import { BagsStep } from '@/features/trip-creation/components/steps/bags-step';
import { DestinationStep } from '@/features/trip-creation/components/steps/destination-step';
import { NoteStep } from '@/features/trip-creation/components/steps/note-step';
import { TripContextStep } from '@/features/trip-creation/components/steps/trip-context-step';
import { SummarySection } from '@/features/trip-creation/components/summary-section';
import { useProfile } from '@/hooks/use-profile';
import { useTrips } from '@/hooks/use-trips';
import { useTheme } from '@/hooks/use-theme';
import { blurActiveElement } from '@/lib/blur-active-element';
import { screenPaddingHorizontal } from '@/theme/spacing';

export function EditTripScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const returnTo = parseEditTripReturnTo(params.returnTo);

  const {
    activeTrip,
    activeTripId,
    updateTripSharedDetails,
    addTravellerToTrip,
    removeTravellerFromTrip,
    repositoryError,
  } = useTrips();
  const { savedPackingProfiles, rememberPackingProfile } = useProfile();

  const [stagedForm, setStagedForm] = useState<{ tripId: string; form: TripEditFormState } | null>(
    null,
  );
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [addTravellerLoading, setAddTravellerLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [discardVisible, setDiscardVisible] = useState(false);
  const [addTravellerVisible, setAddTravellerVisible] = useState(false);
  const [addTravellerSession, setAddTravellerSession] = useState(0);
  const [pendingRemoveListId, setPendingRemoveListId] = useState<string | null>(null);

  const form = useMemo(() => {
    if (!activeTrip) {
      return null;
    }

    if (stagedForm?.tripId === activeTrip.id) {
      return stagedForm.form;
    }

    return createEditFormStateFromTrip(activeTrip);
  }, [activeTrip, stagedForm]);

  const setForm = useCallback(
    (updater: TripEditFormState | ((current: TripEditFormState) => TripEditFormState)) => {
      if (!activeTrip) {
        return;
      }

      setStagedForm((current) => {
        const base =
          current?.tripId === activeTrip.id ? current.form : createEditFormStateFromTrip(activeTrip);
        const next = typeof updater === 'function' ? updater(base) : updater;
        return { tripId: activeTrip.id, form: next };
      });
    },
    [activeTrip],
  );

  const hasChanges = useMemo(() => {
    if (!form || !activeTrip) {
      return false;
    }

    return hasStagedSharedChanges(form, activeTrip);
  }, [activeTrip, form]);

  const travellerRows = useMemo(
    () => (activeTrip ? getEditTripTravellerRows(activeTrip) : []),
    [activeTrip],
  );

  const pendingRemoveRow = useMemo(
    () => travellerRows.find((row) => row.listId === pendingRemoveListId) ?? null,
    [pendingRemoveListId, travellerRows],
  );

  const patchDraft = useCallback(
    (patch: Partial<TripDraft>) => {
      setForm((current) => ({
        ...current,
        draft: {
          ...current.draft,
          ...patch,
        },
      }));
    },
    [setForm],
  );

  const toggleTripContextTag = useCallback(
    (tag: string) => {
      if (!form) {
        return;
      }

      const existing = findTripContextTag(form.draft.tripContext, tag);
      if (existing) {
        patchDraft({
          tripContext: form.draft.tripContext.filter((entry) => entry !== existing),
        });
        return;
      }

      patchDraft({ tripContext: [...form.draft.tripContext, tag] });
    },
    [form, patchDraft],
  );

  const addTripContextTag = useCallback(
    (tag: string) => {
      if (!form) {
        return;
      }

      const trimmed = tag.trim();
      if (!trimmed || tripContextIncludes(form.draft.tripContext, trimmed)) {
        return;
      }

      patchDraft({ tripContext: [...form.draft.tripContext, trimmed] });
    },
    [form, patchDraft],
  );

  const addBag = useCallback(
    (type: BagType) => {
      if (!form) {
        return;
      }

      const label = BAG_TYPES.find((entry) => entry.id === type)?.label ?? 'Bag';
      const bag: Bag = {
        id: `bag-${Date.now()}`,
        name: label,
        type,
        ownerId: null,
      };
      patchDraft({ bags: [...form.draft.bags, bag] });
    },
    [form, patchDraft],
  );

  const updateBag = useCallback(
    (bagId: string, patch: Partial<Bag>) => {
      if (!form) {
        return;
      }

      patchDraft({
        bags: form.draft.bags.map((bag) => (bag.id === bagId ? { ...bag, ...patch } : bag)),
      });
    },
    [form, patchDraft],
  );

  const removeBag = useCallback(
    (bagId: string) => {
      if (!form) {
        return;
      }

      patchDraft({ bags: form.draft.bags.filter((bag) => bag.id !== bagId) });
    },
    [form, patchDraft],
  );

  const navigateAway = useCallback(() => {
    router.replace(resolveEditTripReturnPath(returnTo));
  }, [returnTo, router]);

  const handleAttemptClose = useCallback(() => {
    blurActiveElement();

    if (shouldDiscardStagedEdits(hasChanges, false)) {
      navigateAway();
      return;
    }

    setDiscardVisible(true);
  }, [hasChanges, navigateAway]);

  const handlePrimaryFooterPress = useCallback(async () => {
    if (!activeTrip || !form || saveLoading) {
      return;
    }

    blurActiveElement();

    if (!hasChanges) {
      navigateAway();
      return;
    }

    const patch = buildSharedDetailsPatch(form, activeTrip);
    if (Object.keys(patch).length === 0) {
      navigateAway();
      return;
    }

    setSaveLoading(true);
    setFeedbackNotice(null);

    try {
      const { trip: saved, packingRelevantChanges } = await updateTripSharedDetails(
        activeTrip.id,
        patch,
      );
      setStagedForm({ tripId: saved.id, form: createEditFormStateFromTrip(saved) });
      setFeedbackNotice(buildPostSaveNotice(packingRelevantChanges));
      navigateAway();
    } catch {
      // repositoryError is set in TripsProvider; staged form is preserved.
    } finally {
      setSaveLoading(false);
    }
  }, [activeTrip, form, hasChanges, navigateAway, saveLoading, updateTripSharedDetails]);

  const handleAddTraveller = useCallback(
    async (profile: PackingProfile, packingMode: 'generated' | 'manual') => {
      if (!activeTrip || addTravellerLoading) {
        return;
      }

      if (!shouldProceedWithAddTraveller(profile, packingMode, true)) {
        return;
      }

      setAddTravellerLoading(true);

      try {
        await addTravellerToTrip(activeTrip.id, profile, packingMode);

        if (!profile.isSelf && profile.rememberForFutureTrips) {
          rememberPackingProfile(profile);
        }

        setFeedbackNotice(buildTravellerAddedNotice(profile.name));
        setAddTravellerVisible(false);
      } catch {
        // repositoryError is set in TripsProvider.
      } finally {
        setAddTravellerLoading(false);
      }
    },
    [activeTrip, addTravellerLoading, addTravellerToTrip, rememberPackingProfile],
  );

  const handleRemovePress = useCallback((listId: string) => {
    setPendingRemoveListId(listId);
  }, []);

  const handleRemoveCancel = useCallback(() => {
    setPendingRemoveListId(null);
  }, []);

  const handleRemoveConfirm = useCallback(async () => {
    if (!activeTrip || removeLoading) {
      return;
    }

    if (!shouldExecuteRemoveTraveller(pendingRemoveListId, true)) {
      return;
    }

    setRemoveLoading(true);

    try {
      const removedName = pendingRemoveRow?.name ?? 'Traveller';
      await removeTravellerFromTrip(activeTrip.id, { packingListId: pendingRemoveListId! });
      setPendingRemoveListId(null);
      setFeedbackNotice(buildTravellerRemovedNotice(removedName));
    } catch {
      // repositoryError is set in TripsProvider.
    } finally {
      setRemoveLoading(false);
    }
  }, [activeTrip, pendingRemoveListId, pendingRemoveRow, removeLoading, removeTravellerFromTrip]);

  if (!activeTrip || !form) {
    const emptyMessage = activeTripId
      ? 'This trip is no longer available. Choose another trip from Trips.'
      : 'No trip selected.';

    return (
      <AppScreen style={styles.emptyScreen}>
        <ScreenHeader title="Edit trip" onClose={() => router.replace('/(tabs)')} />
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
        title="Edit trip"
        onClose={handleAttemptClose}
        closeAccessibilityLabel="Close edit trip"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 24) + 96 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {feedbackNotice ? (
            <View style={[styles.noticeBanner, { backgroundColor: theme.colors.muted }]}>
              <Feather name="check-circle" size={16} color={theme.colors.primary} />
              <AppText variant="caption" color="mutedForeground" style={styles.noticeCopy}>
                {feedbackNotice}
              </AppText>
            </View>
          ) : null}

          {repositoryError ? (
            <View style={[styles.errorBanner, { backgroundColor: `${theme.colors.destructive}14` }]}>
              <AppText variant="caption" style={{ color: theme.colors.destructive }}>
                {repositoryError}
              </AppText>
            </View>
          ) : null}

          <SummarySection title="Trip name">
            <Field label="Name">
              <AppTextInput
                value={form.name}
                onChangeText={(name) => setForm((current) => ({ ...current, name }))}
                placeholder="Trip name"
                accessibilityLabel="Trip name"
              />
            </Field>
          </SummarySection>

          <SummarySection title="Destination">
            <DestinationStep draft={form.draft} onChange={patchDraft} />
          </SummarySection>

          <SummarySection title="Trip type / context">
            <TripContextStep
              draft={form.draft}
              onToggleTag={toggleTripContextTag}
              onAddTag={addTripContextTag}
            />
          </SummarySection>

          <SummarySection title="Accommodation">
            <AccommodationStep
              draft={form.draft}
              onSelectAccommodation={(id: AccommodationId) => patchDraft({ accommodation: id })}
              onSelectLaundry={(id: LaundryOption) => patchDraft({ laundry: id })}
            />
          </SummarySection>

          <SummarySection title="Packing for">
            <AppText variant="caption" color="mutedForeground" style={styles.preservationCopy}>
              Your existing packing lists won&apos;t be changed.
            </AppText>
            <View style={styles.travellerList}>
              {travellerRows.map((row) => (
                <EditTripTravellerRow
                  key={row.listId}
                  row={row}
                  onRemovePress={() => handleRemovePress(row.listId)}
                />
              ))}
            </View>
            {!canRemoveTravellerFromTrip(activeTrip) ? (
              <AppText variant="caption" color="mutedForeground" style={styles.singleTravellerNote}>
                A trip needs at least one person.
              </AppText>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add traveller"
              onPress={() => {
                setAddTravellerSession((current) => current + 1);
                setAddTravellerVisible(true);
              }}
              style={({ pressed }) => [
                styles.addTravellerTrigger,
                { borderColor: theme.colors.border },
                pressed && styles.pressed,
              ]}>
              <Feather name="plus" size={16} color={theme.colors.primary} />
              <AppText variant="bodySmall" color="primary" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
                Add traveller
              </AppText>
            </Pressable>
          </SummarySection>

          <SummarySection title="Bags">
            <BagsStep
              draft={form.draft}
              onAddBag={addBag}
              onUpdateBag={updateBag}
              onRemoveBag={removeBag}
            />
          </SummarySection>

          <SummarySection title="Additional information">
            <NoteStep draft={form.draft} onChangeNote={(note) => patchDraft({ note })} />
          </SummarySection>
        </ScrollView>
      </KeyboardAvoidingView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.border,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}>
        <PrimaryButton
          label={getEditTripPrimaryFooterLabel(hasChanges, saveLoading)}
          onPress={handlePrimaryFooterPress}
          disabled={!isEditTripPrimaryFooterEnabled(saveLoading)}
        />
        {saveLoading ? <ActivityIndicator size="small" color={theme.colors.primary} style={styles.saveSpinner} /> : null}
      </View>

      <DiscardChangesSheet
        visible={discardVisible}
        onKeepEditing={() => setDiscardVisible(false)}
        onDiscard={() => {
          setDiscardVisible(false);
          navigateAway();
        }}
      />

      <AddTravellerSheet
        key={addTravellerSession}
        visible={addTravellerVisible}
        trip={activeTrip}
        savedPackingProfiles={savedPackingProfiles}
        loading={addTravellerLoading}
        onClose={() => setAddTravellerVisible(false)}
        onConfirm={handleAddTraveller}
      />

      <RemoveTravellerConfirmSheet
        visible={pendingRemoveListId !== null}
        travellerName={pendingRemoveRow?.name ?? null}
        loading={removeLoading}
        onCancel={handleRemoveCancel}
        onConfirm={handleRemoveConfirm}
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
  content: {
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: 16,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  noticeCopy: {
    flex: 1,
    lineHeight: 18,
  },
  errorBanner: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  preservationCopy: {
    lineHeight: 18,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  travellerList: {
    gap: 8,
    marginBottom: 12,
  },
  singleTravellerNote: {
    lineHeight: 18,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  addTravellerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: 12,
    gap: 8,
  },
  saveSpinner: {
    alignSelf: 'center',
  },
  pressed: {
    opacity: 0.95,
  },
});
