import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ScreenHeader } from '@/components/navigation/screen-header';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { getDestinationLabel } from '@/domain/destination';
import { BAG_TYPES } from '@/domain/catalog';
import type { Bag, BagType } from '@/domain/bag';
import type { AccommodationId, LaundryOption } from '@/domain/trip';
import { findTripContextTag, tripContextIncludes } from '@/domain/trip-context-tags';
import {
  createDraftProfile,
  isProfileSelectedInDraft,
  normalizeTripDraft,
  patchDraftPackingProfiles,
} from '@/domain/trip-draft-profiles';
import type { PackingProfile } from '@/domain/packing-profile';
import { WizardFooter } from '@/features/trip-creation/components/wizard-footer';
import { WizardProgress } from '@/features/trip-creation/components/wizard-progress';
import { AccommodationStep } from '@/features/trip-creation/components/steps/accommodation-step';
import { BagsStep } from '@/features/trip-creation/components/steps/bags-step';
import { DestinationStep } from '@/features/trip-creation/components/steps/destination-step';
import { NoteStep } from '@/features/trip-creation/components/steps/note-step';
import { ImportantSetupStep, type ImportantSetupStepHandle } from '@/features/trip-creation/components/steps/important-setup-step';
import { PackingProfilesStep } from '@/features/trip-creation/components/steps/packing-profiles-step';
import { TripContextStep } from '@/features/trip-creation/components/steps/trip-context-step';
import {
  isWizardEditFromSummary,
  parseWizardReturnToParam,
  parseWizardStepKeyParam,
} from '@/features/trip-creation/utils/wizard-navigation';
import {
  canProceedFromStepId,
  wizardContinueLabel,
} from '@/features/trip-creation/utils/wizard-validation';
import {
  buildActiveWizardSteps,
  clampWizardStepIndex,
  resolveWizardStepIndex,
  wizardStepTitle,
  type WizardStepId,
} from '@/features/trip-creation/utils/wizard-steps';
import { useTrips } from '@/hooks/use-trips';
import { useProfile } from '@/hooks/use-profile';
import { blurActiveElement } from '@/lib/blur-active-element';
import { goBackOrReplace } from '@/lib/safe-navigation';
import { screenPaddingHorizontal } from '@/theme/spacing';

export function CreateTripScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ step?: string; returnTo?: string }>();
  const { draft, setDraft, draftWizardStep, setDraftWizardStep, markDraftReachedSummary } = useTrips();
  const { savedPackingProfiles } = useProfile();
  const importantSetupRef = useRef<ImportantSetupStepHandle>(null);
  const appliedStepNavigationRef = useRef<string | null>(null);

  const returnTo = parseWizardReturnToParam(params.returnTo);
  const isEditingFromSummary = isWizardEditFromSummary(returnTo);
  const requestedStepKey = parseWizardStepKeyParam(params.step);
  const normalizedDraft = useMemo(() => normalizeTripDraft(draft), [draft]);

  const activeSteps = useMemo(() => buildActiveWizardSteps(), []);

  const stepIndex = clampWizardStepIndex(activeSteps, draftWizardStep);
  const currentStepId = activeSteps[stepIndex] ?? activeSteps[0];

  const canContinue = canProceedFromStepId(currentStepId, normalizedDraft);
  const continueLabel = wizardContinueLabel(stepIndex, activeSteps.length, {
    returnToSummary: isEditingFromSummary,
  });

  useEffect(() => {
    if (!requestedStepKey) {
      appliedStepNavigationRef.current = null;
      return;
    }

    const navigationToken = `${requestedStepKey}:${returnTo ?? ''}`;
    if (appliedStepNavigationRef.current === navigationToken) {
      return;
    }

    const nextIndex = resolveWizardStepIndex(activeSteps, { stepId: requestedStepKey });
    setDraftWizardStep(nextIndex);
    appliedStepNavigationRef.current = navigationToken;
    router.setParams({ step: undefined });
  }, [activeSteps, requestedStepKey, returnTo, router, setDraftWizardStep]);

  useEffect(() => {
    if (draft.packingProfiles?.length) {
      return;
    }

    const normalized = normalizeTripDraft(draft);
    setDraft({
      packingProfiles: normalized.packingProfiles,
      travelers: normalized.travelers,
    });
  }, [draft, draft.packingProfiles, setDraft]);

  const setStep = useCallback(
    (value: number) => {
      setDraftWizardStep(clampWizardStepIndex(activeSteps, value));
    },
    [activeSteps, setDraftWizardStep],
  );

  const returnToSummary = useCallback(() => {
    router.replace('/trip/summary');
  }, [router]);

  const handleBack = useCallback(() => {
    blurActiveElement();
    if (isEditingFromSummary) {
      returnToSummary();
      return;
    }

    if (stepIndex === 0) {
      goBackOrReplace('/(tabs)');
      return;
    }

    setStep(stepIndex - 1);
  }, [isEditingFromSummary, returnToSummary, setStep, stepIndex]);

  const handleContinue = useCallback(() => {
    if (!canContinue) {
      return;
    }

    blurActiveElement();

    if (currentStepId === 'important') {
      importantSetupRef.current?.commitStagedChanges();
    }

    if (isEditingFromSummary) {
      returnToSummary();
      return;
    }

    if (stepIndex >= activeSteps.length - 1) {
      markDraftReachedSummary();
      router.push('/trip/summary');
      return;
    }

    setStep(stepIndex + 1);
  }, [
    activeSteps.length,
    canContinue,
    currentStepId,
    isEditingFromSummary,
    markDraftReachedSummary,
    returnToSummary,
    router,
    setStep,
    stepIndex,
  ]);

  const toggleTripContextTag = useCallback(
    (tag: string) => {
      const existing = findTripContextTag(normalizedDraft.tripContext, tag);
      if (existing) {
        setDraft({
          tripContext: normalizedDraft.tripContext.filter((entry) => entry !== existing),
        });
        return;
      }

      setDraft({ tripContext: [...normalizedDraft.tripContext, tag] });
    },
    [normalizedDraft.tripContext, setDraft],
  );

  const addTripContextTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim();
      if (!trimmed || tripContextIncludes(normalizedDraft.tripContext, trimmed)) {
        return;
      }
      setDraft({ tripContext: [...normalizedDraft.tripContext, trimmed] });
    },
    [normalizedDraft.tripContext, setDraft],
  );

  const addPackingProfile = useCallback(
    (name: string, age: number, rememberForFutureTrips: boolean) => {
      const profile = createDraftProfile(name, age, rememberForFutureTrips);

      setDraft(
        patchDraftPackingProfiles(normalizedDraft, [...normalizedDraft.packingProfiles, profile]),
      );
    },
    [normalizedDraft, setDraft],
  );

  const addSavedPackingProfile = useCallback(
    (profile: PackingProfile) => {
      if (isProfileSelectedInDraft(normalizedDraft.packingProfiles, profile.id)) {
        return;
      }

      setDraft(
        patchDraftPackingProfiles(normalizedDraft, [...normalizedDraft.packingProfiles, profile]),
      );
    },
    [normalizedDraft, setDraft],
  );

  const removePackingProfile = useCallback(
    (profileId: string) => {
      const profile = normalizedDraft.packingProfiles.find((entry) => entry.id === profileId);
      if (!profile || profile.isSelf) {
        return;
      }

      const nextProfiles = normalizedDraft.packingProfiles.filter((entry) => entry.id !== profileId);
      setDraft({
        ...patchDraftPackingProfiles(normalizedDraft, nextProfiles),
        bags: normalizedDraft.bags.map((bag) =>
          bag.ownerId === profileId ? { ...bag, ownerId: null } : bag,
        ),
      });
    },
    [normalizedDraft, setDraft],
  );

  const addBag = useCallback(
    (type: BagType) => {
      const label = BAG_TYPES.find((entry) => entry.id === type)?.label ?? 'Bag';
      const bag: Bag = {
        id: `bag-${Date.now()}`,
        name: label,
        type,
        ownerId: null,
      };
      setDraft({ bags: [...normalizedDraft.bags, bag] });
    },
    [normalizedDraft.bags, setDraft],
  );

  const updateBag = useCallback(
    (bagId: string, patch: Partial<Bag>) => {
      setDraft({
        bags: normalizedDraft.bags.map((bag) => (bag.id === bagId ? { ...bag, ...patch } : bag)),
      });
    },
    [normalizedDraft.bags, setDraft],
  );

  const removeBag = useCallback(
    (bagId: string) => {
      setDraft({ bags: normalizedDraft.bags.filter((bag) => bag.id !== bagId) });
    },
    [normalizedDraft.bags, setDraft],
  );

  const handleCloseWizard = useCallback(() => {
    blurActiveElement();
    goBackOrReplace('/(tabs)');
  }, []);

  const renderStep = (stepId: WizardStepId) => {
    switch (stepId) {
      case 'destination':
        return <DestinationStep draft={normalizedDraft} onChange={setDraft} />;
      case 'trip-context':
        return (
          <TripContextStep
            draft={normalizedDraft}
            onToggleTag={toggleTripContextTag}
            onAddTag={addTripContextTag}
          />
        );
      case 'accommodation':
        return (
          <AccommodationStep
            draft={normalizedDraft}
            onSelectAccommodation={(accommodation: AccommodationId) => setDraft({ accommodation })}
            onSelectLaundry={(laundry: LaundryOption) => setDraft({ laundry })}
          />
        );
      case 'packing-profiles':
        return (
          <PackingProfilesStep
            draft={normalizedDraft}
            savedPackingProfiles={savedPackingProfiles}
            onAddProfile={addPackingProfile}
            onAddSavedProfile={addSavedPackingProfile}
            onRemoveProfile={removePackingProfile}
          />
        );
      case 'bags':
        return (
          <BagsStep
            draft={normalizedDraft}
            onAddBag={addBag}
            onUpdateBag={updateBag}
            onRemoveBag={removeBag}
          />
        );
      case 'important':
        return <ImportantSetupStep ref={importantSetupRef} profiles={normalizedDraft.packingProfiles} />;
      case 'note':
        return <NoteStep draft={normalizedDraft} onChangeNote={(note) => setDraft({ note })} />;
      default:
        return null;
    }
  };

  const wizardHeaderTitle = isEditingFromSummary
    ? 'Edit trip'
    : getDestinationLabel(normalizedDraft.destination).trim() || 'New trip';

  return (
    <AppScreen>
      <ScreenHeader
        title={wizardHeaderTitle}
        onBack={handleBack}
        onClose={isEditingFromSummary ? undefined : handleCloseWizard}
        closeAccessibilityLabel="Save and close trip"
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <View style={styles.progressWrap}>
          <WizardProgress step={stepIndex} totalSteps={activeSteps.length} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <AppText variant="heading" style={styles.stepTitle}>
            {wizardStepTitle(currentStepId)}
          </AppText>
          {renderStep(currentStepId)}
        </ScrollView>

        <WizardFooter label={continueLabel} disabled={!canContinue} onPress={handleContinue} />
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  progressWrap: {
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: 4,
  },
  scrollContent: {
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: 12,
    paddingBottom: 24,
  },
  stepTitle: {
    marginBottom: 20,
  },
});
