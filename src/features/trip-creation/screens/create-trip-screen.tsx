import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
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
import type { AccommodationId, LaundryOption, TripTypeId } from '@/domain/trip';
import { WizardFooter } from '@/features/trip-creation/components/wizard-footer';
import { WizardProgress } from '@/features/trip-creation/components/wizard-progress';
import { AccommodationStep } from '@/features/trip-creation/components/steps/accommodation-step';
import { ActivitiesStep } from '@/features/trip-creation/components/steps/activities-step';
import { BagsStep } from '@/features/trip-creation/components/steps/bags-step';
import { DestinationStep } from '@/features/trip-creation/components/steps/destination-step';
import { NoteStep } from '@/features/trip-creation/components/steps/note-step';
import { TravelersStep } from '@/features/trip-creation/components/steps/travelers-step';
import { TripTypesStep } from '@/features/trip-creation/components/steps/trip-types-step';
import { WIZARD_STEP_COUNT, WIZARD_STEP_TITLES } from '@/features/trip-creation/constants';
import {
  canProceedFromStep,
  wizardContinueLabel,
} from '@/features/trip-creation/utils/wizard-validation';
import { useTrips } from '@/hooks/use-trips';
import { screenPaddingHorizontal } from '@/theme/spacing';

export function CreateTripScreen() {
  const router = useRouter();
  const { draft, setDraft } = useTrips();
  const [step, setStep] = useState(0);

  const canContinue = canProceedFromStep(step, draft);
  const continueLabel = wizardContinueLabel(step, WIZARD_STEP_COUNT);

  const handleBack = useCallback(() => {
    if (step === 0) {
      router.back();
      return;
    }
    setStep((current) => current - 1);
  }, [router, step]);

  const handleContinue = useCallback(() => {
    if (!canContinue) {
      return;
    }
    if (step === WIZARD_STEP_COUNT - 1) {
      router.push('/trip/summary');
      return;
    }
    setStep((current) => current + 1);
  }, [canContinue, router, step]);

  const toggleType = useCallback(
    (typeId: TripTypeId) => {
      setDraft({
        types: draft.types.includes(typeId)
          ? draft.types.filter((entry) => entry !== typeId)
          : [...draft.types, typeId],
      });
    },
    [draft.types, setDraft],
  );

  const toggleActivity = useCallback(
    (activity: string) => {
      setDraft({
        activities: draft.activities.includes(activity)
          ? draft.activities.filter((entry) => entry !== activity)
          : [...draft.activities, activity],
      });
    },
    [draft.activities, setDraft],
  );

  const addActivity = useCallback(
    (activity: string) => {
      if (draft.activities.includes(activity)) {
        return;
      }
      setDraft({ activities: [...draft.activities, activity] });
    },
    [draft.activities, setDraft],
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
        return <TripTypesStep draft={draft} onToggleType={toggleType} />;
      case 2:
        return (
          <ActivitiesStep
            draft={draft}
            onToggleActivity={toggleActivity}
            onAddActivity={addActivity}
          />
        );
      case 3:
        return (
          <AccommodationStep
            draft={draft}
            onSelectAccommodation={(accommodation: AccommodationId) => setDraft({ accommodation })}
            onSelectLaundry={(laundry: LaundryOption) => setDraft({ laundry })}
          />
        );
      case 4:
        return (
          <TravelersStep
            draft={draft}
            onApplyPreset={applyPreset}
            onAddTraveler={addTraveler}
            onRemoveTraveler={removeTraveler}
          />
        );
      case 5:
        return (
          <BagsStep
            draft={draft}
            onAddBag={addBag}
            onUpdateBag={updateBag}
            onRemoveBag={removeBag}
          />
        );
      case 6:
        return <NoteStep draft={draft} onChangeNote={(note) => setDraft({ note })} />;
      default:
        return null;
    }
  };

  return (
    <AppScreen>
      <ScreenHeader title="New trip" onBack={handleBack} />
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
