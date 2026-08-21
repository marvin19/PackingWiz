import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
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
import { BAG_TYPES } from '@/domain/catalog';
import type { Bag, BagType } from '@/domain/bag';
import type { Traveler, TravelerRole } from '@/domain/traveler';
import type { AccommodationId, LaundryOption } from '@/domain/trip';
import { findTripContextTag, tripContextIncludes } from '@/domain/trip-context-tags';
import { WizardFooter } from '@/features/trip-creation/components/wizard-footer';
import { WizardProgress } from '@/features/trip-creation/components/wizard-progress';
import { AccommodationStep } from '@/features/trip-creation/components/steps/accommodation-step';
import { BagsStep } from '@/features/trip-creation/components/steps/bags-step';
import { DestinationStep } from '@/features/trip-creation/components/steps/destination-step';
import { NoteStep } from '@/features/trip-creation/components/steps/note-step';
import { TravelersStep } from '@/features/trip-creation/components/steps/travelers-step';
import { TripContextStep } from '@/features/trip-creation/components/steps/trip-context-step';
import { WIZARD_STEP_COUNT, WIZARD_STEP_TITLES } from '@/features/trip-creation/constants';
import {
  isWizardEditFromSummary,
  parseWizardReturnToParam,
  parseWizardStepParam,
} from '@/features/trip-creation/utils/wizard-navigation';
import {
  canProceedFromStep,
  wizardContinueLabel,
} from '@/features/trip-creation/utils/wizard-validation';
import { useTrips } from '@/hooks/use-trips';
import { blurActiveElement } from '@/lib/blur-active-element';
import { goBackOrReplace } from '@/lib/safe-navigation';
import { screenPaddingHorizontal } from '@/theme/spacing';

export function CreateTripScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ step?: string; returnTo?: string }>();
  const { draft, setDraft, draftWizardStep, setDraftWizardStep, markDraftReachedSummary } = useTrips();

  const returnTo = parseWizardReturnToParam(params.returnTo);
  const isEditingFromSummary = isWizardEditFromSummary(returnTo);
  const step = draftWizardStep;

  const canContinue = canProceedFromStep(step, draft);
  const continueLabel = wizardContinueLabel(step, WIZARD_STEP_COUNT, {
    returnToSummary: isEditingFromSummary,
  });

  useEffect(() => {
    const entryStep = parseWizardStepParam(params.step);
    if (entryStep !== null) {
      setDraftWizardStep(entryStep);
    }
  }, [params.step, setDraftWizardStep]);

  const setStep = useCallback(
    (value: number | ((current: number) => number)) => {
      setDraftWizardStep(typeof value === 'function' ? value(draftWizardStep) : value);
    },
    [draftWizardStep, setDraftWizardStep],
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

    if (step === 0) {
      goBackOrReplace('/(tabs)');
      return;
    }

    setStep((current) => current - 1);
  }, [isEditingFromSummary, returnToSummary, setStep, step]);

  const handleContinue = useCallback(() => {
    if (!canContinue) {
      return;
    }

    blurActiveElement();

    if (isEditingFromSummary) {
      returnToSummary();
      return;
    }

    if (step === WIZARD_STEP_COUNT - 1) {
      markDraftReachedSummary();
      router.push('/trip/summary');
      return;
    }

    setStep((current) => current + 1);
  }, [
    canContinue,
    isEditingFromSummary,
    markDraftReachedSummary,
    returnToSummary,
    router,
    setStep,
    step,
  ]);

  const toggleTripContextTag = useCallback(
    (tag: string) => {
      const existing = findTripContextTag(draft.tripContext, tag);
      if (existing) {
        setDraft({
          tripContext: draft.tripContext.filter((entry) => entry !== existing),
        });
        return;
      }

      setDraft({ tripContext: [...draft.tripContext, tag] });
    },
    [draft.tripContext, setDraft],
  );

  const addTripContextTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim();
      if (!trimmed || tripContextIncludes(draft.tripContext, trimmed)) {
        return;
      }
      setDraft({ tripContext: [...draft.tripContext, trimmed] });
    },
    [draft.tripContext, setDraft],
  );

  const applyPreset = useCallback(
    (travelers: Traveler[]) => {
      setDraft({
        travelers: travelers.map((traveler) => ({ ...traveler })),
      });
    },
    [setDraft],
  );

  const addTraveler = useCallback(
    (name: string, role: TravelerRole) => {
      const traveler: Traveler = {
        id: `t-${Date.now()}`,
        name,
        role,
      };
      setDraft({ travelers: [...draft.travelers, traveler] });
    },
    [draft.travelers, setDraft],
  );

  const removeTraveler = useCallback(
    (travelerId: string) => {
      setDraft({
        travelers: draft.travelers.filter((traveler) => traveler.id !== travelerId),
        bags: draft.bags.map((bag) =>
          bag.ownerId === travelerId ? { ...bag, ownerId: null } : bag,
        ),
      });
    },
    [draft.bags, draft.travelers, setDraft],
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
      setDraft({ bags: [...draft.bags, bag] });
    },
    [draft.bags, setDraft],
  );

  const updateBag = useCallback(
    (bagId: string, patch: Partial<Bag>) => {
      setDraft({
        bags: draft.bags.map((bag) => (bag.id === bagId ? { ...bag, ...patch } : bag)),
      });
    },
    [draft.bags, setDraft],
  );

  const removeBag = useCallback(
    (bagId: string) => {
      setDraft({ bags: draft.bags.filter((bag) => bag.id !== bagId) });
    },
    [draft.bags, setDraft],
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return <DestinationStep draft={draft} onChange={setDraft} />;
      case 1:
        return (
          <TripContextStep
            draft={draft}
            onToggleTag={toggleTripContextTag}
            onAddTag={addTripContextTag}
          />
        );
      case 2:
        return (
          <AccommodationStep
            draft={draft}
            onSelectAccommodation={(accommodation: AccommodationId) => setDraft({ accommodation })}
            onSelectLaundry={(laundry: LaundryOption) => setDraft({ laundry })}
          />
        );
      case 3:
        return (
          <TravelersStep
            draft={draft}
            onApplyPreset={applyPreset}
            onAddTraveler={addTraveler}
            onRemoveTraveler={removeTraveler}
          />
        );
      case 4:
        return (
          <BagsStep
            draft={draft}
            onAddBag={addBag}
            onUpdateBag={updateBag}
            onRemoveBag={removeBag}
          />
        );
      case 5:
        return <NoteStep draft={draft} onChangeNote={(note) => setDraft({ note })} />;
      default:
        return null;
    }
  };

  return (
    <AppScreen>
      <ScreenHeader title={isEditingFromSummary ? 'Edit trip' : 'New trip'} onBack={handleBack} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <View style={styles.progressWrap}>
          <WizardProgress step={step} totalSteps={WIZARD_STEP_COUNT} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <AppText variant="heading" style={styles.stepTitle}>
            {WIZARD_STEP_TITLES[step]}
          </AppText>
          {renderStep()}
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
