import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
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
import {
  createDestinationFromText,
  getDestinationLabel,
} from '@/domain/destination';
import type { AccommodationId, LaundryOption } from '@/domain/trip';
import type { TripDraft } from '@/domain/trip-draft';
import { findTripContextTag, tripContextIncludes } from '@/domain/trip-context-tags';
import { AccommodationStep } from '@/features/trip-creation/components/steps/accommodation-step';
import { BagsStep } from '@/features/trip-creation/components/steps/bags-step';
import { NoteStep } from '@/features/trip-creation/components/steps/note-step';
import { TripContextStep } from '@/features/trip-creation/components/steps/trip-context-step';
import {
  DESTINATION_SUGGESTIONS,
  suggestionToDestination,
} from '@/features/trip-creation/constants';
import {
  buildReuseTripReturnHref,
  getReuseTripSectionScreenTitle,
  parseReuseTripSection,
} from '@/features/trips/utils/reuse-trip-navigation';
import type { ReuseTripFormState } from '@/features/trips/utils/reuse-trip-view-model';
import { useTrips } from '@/hooks/use-trips';
import { useReuseTripSession } from '@/providers/reuse-trip-session-provider';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal } from '@/theme/spacing';

function parseTripIdParam(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() || null;
}

function formToDraftSlice(form: ReuseTripFormState): TripDraft {
  return {
    id: 'reuse-draft-slice',
    destination: form.destination,
    startDate: form.startDate,
    endDate: form.endDate,
    tripContext: form.tripContext,
    accommodation: form.accommodation,
    laundry: form.laundry,
    packingProfiles: [],
    travelers: [],
    bags: form.bags,
    note: form.note,
  };
}

function ReuseDestinationEditor({
  form,
  onChange,
}: {
  form: ReuseTripFormState;
  onChange: (patch: Partial<ReuseTripFormState>) => void;
}) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.destinationEditor}>
      <Field label="Destination">
        <View>
          <Feather
            name="search"
            size={16}
            color={theme.colors.mutedForeground}
            style={styles.searchIcon}
          />
          <AppTextInput
            value={getDestinationLabel(form.destination)}
            onChangeText={(displayName) =>
              onChange({
                destination: createDestinationFromText(displayName, form.destination.countryName),
              })
            }
            placeholder="Search a city or country"
            focused={focused}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={styles.destinationInput}
            accessibilityLabel="Destination"
          />
        </View>
        <View style={styles.suggestions}>
          {DESTINATION_SUGGESTIONS.map((suggestion) => (
            <Pressable
              key={suggestion.destination}
              accessibilityRole="button"
              accessibilityLabel={`Use ${suggestion.destination}`}
              onPress={() =>
                onChange({
                  destination: suggestionToDestination(suggestion),
                })
              }
              style={({ pressed }) => [
                styles.suggestion,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
                pressed && styles.pressed,
              ]}>
              <Feather name="map-pin" size={12} color={theme.colors.primary} />
              <AppText variant="caption" style={{ fontFamily: theme.fontFamilies.sansMedium }}>
                {suggestion.destination}
              </AppText>
            </Pressable>
          ))}
        </View>
      </Field>
    </View>
  );
}

export function ReuseTripSectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tripId?: string; section?: string }>();
  const sourceTripId = parseTripIdParam(params.tripId);
  const section = parseReuseTripSection(params.section);

  const { trips } = useTrips();
  const { ensureForm, updateForm } = useReuseTripSession();
  const [revision, setRevision] = useState(0);

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

  const toggleTripContextTag = useCallback(
    (tag: string) => {
      if (!form) {
        return;
      }

      const existing = findTripContextTag(form.tripContext, tag);
      if (existing) {
        patchForm({ tripContext: form.tripContext.filter((entry) => entry !== existing) });
        return;
      }

      patchForm({ tripContext: [...form.tripContext, tag] });
    },
    [form, patchForm],
  );

  const addTripContextTag = useCallback(
    (tag: string) => {
      if (!form) {
        return;
      }

      const trimmed = tag.trim();
      if (!trimmed || tripContextIncludes(form.tripContext, trimmed)) {
        return;
      }

      patchForm({ tripContext: [...form.tripContext, trimmed] });
    },
    [form, patchForm],
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
      patchForm({ bags: [...form.bags, bag] });
    },
    [form, patchForm],
  );

  const updateBag = useCallback(
    (bagId: string, patch: Partial<Bag>) => {
      if (!form) {
        return;
      }

      patchForm({
        bags: form.bags.map((bag) => (bag.id === bagId ? { ...bag, ...patch } : bag)),
      });
    },
    [form, patchForm],
  );

  const removeBag = useCallback(
    (bagId: string) => {
      if (!form) {
        return;
      }

      patchForm({ bags: form.bags.filter((bag) => bag.id !== bagId) });
    },
    [form, patchForm],
  );

  const handleDone = useCallback(() => {
    if (!sourceTripId) {
      router.back();
      return;
    }

    router.replace(buildReuseTripReturnHref(sourceTripId));
  }, [router, sourceTripId]);

  if (!sourceTripId || !section || !sourceTrip || !form) {
    return (
      <AppScreen style={styles.emptyScreen}>
        <ScreenHeader title="Edit section" onBack={() => router.back()} />
        <View style={styles.emptyBody}>
          <AppText variant="bodySmall" color="mutedForeground">
            Unable to edit this section.
          </AppText>
        </View>
      </AppScreen>
    );
  }

  const draftSlice = formToDraftSlice(form);

  return (
    <AppScreen style={styles.screen}>
      <ScreenHeader
        title={getReuseTripSectionScreenTitle(section)}
        onClose={handleDone}
        closeAccessibilityLabel="Done editing section"
      />

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
          {section === 'destination' ? (
            <ReuseDestinationEditor form={form} onChange={patchForm} />
          ) : null}

          {section === 'trip-context' ? (
            <TripContextStep
              draft={draftSlice}
              onToggleTag={toggleTripContextTag}
              onAddTag={addTripContextTag}
            />
          ) : null}

          {section === 'accommodation' ? (
            <AccommodationStep
              draft={draftSlice}
              onSelectAccommodation={(id: AccommodationId) => patchForm({ accommodation: id })}
              onSelectLaundry={(id: LaundryOption) => patchForm({ laundry: id })}
            />
          ) : null}

          {section === 'bags' ? (
            <BagsStep
              draft={draftSlice}
              onAddBag={addBag}
              onUpdateBag={updateBag}
              onRemoveBag={removeBag}
            />
          ) : null}

          {section === 'note' ? (
            <NoteStep draft={draftSlice} onChangeNote={(note) => patchForm({ note })} />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <PrimaryButton label="Done" onPress={handleDone} />
      </View>
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
  },
  scrollContent: {
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: 12,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E6E0',
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: 12,
    backgroundColor: '#F9F8F5',
  },
  destinationEditor: {
    gap: 20,
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    top: 16,
    zIndex: 1,
  },
  destinationInput: {
    paddingLeft: 40,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.95,
  },
});
