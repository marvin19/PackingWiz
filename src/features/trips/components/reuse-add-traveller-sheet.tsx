import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import type { PackingProfile } from '@/domain/packing-profile';
import { createDraftProfile } from '@/domain/trip-draft-profiles';
import { AddPackingProfileSheet } from '@/features/trip-creation/components/add-packing-profile-sheet';
import { SavedPackingProfileRow } from '@/features/trip-creation/components/saved-packing-profile-row';
import {
  availableSavedProfilesForReusePlan,
  canAddProfileToReusePlan,
} from '@/features/trips/utils/reuse-plan-profiles';
import type { ReuseTripFormState } from '@/features/trips/utils/reuse-trip-view-model';
import type { Trip } from '@/domain/trip';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal } from '@/theme/spacing';

type ReuseAddTravellerSheetProps = {
  visible: boolean;
  sourceTrip: Trip;
  form: ReuseTripFormState;
  savedPackingProfiles: PackingProfile[];
  loading?: boolean;
  onClose: () => void;
  onConfirm: (profile: PackingProfile, packingMode: 'generated' | 'manual') => void;
};

type AddTravellerStep = 'pick' | 'confirm';

function buildReuseAddTravellerConfirmTitle(profileName: string): string {
  return `Add ${profileName} to this trip`;
}

function buildReuseAddTravellerConfirmBody(profileName: string): string {
  return `PackingWiz will create a new packing list for ${profileName} when you reuse this trip.`;
}

export function ReuseAddTravellerSheet({
  visible,
  sourceTrip,
  form,
  savedPackingProfiles,
  loading = false,
  onClose,
  onConfirm,
}: ReuseAddTravellerSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<AddTravellerStep>('pick');
  const [pendingProfile, setPendingProfile] = useState<PackingProfile | null>(null);
  const [addProfileVisible, setAddProfileVisible] = useState(false);

  const availableSaved = useMemo(
    () => availableSavedProfilesForReusePlan(savedPackingProfiles, sourceTrip, form),
    [form, savedPackingProfiles, sourceTrip],
  );

  const reset = () => {
    setStep('pick');
    setPendingProfile(null);
    setAddProfileVisible(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSelectProfile = (profile: PackingProfile) => {
    if (!canAddProfileToReusePlan(sourceTrip, form, profile)) {
      return;
    }

    setPendingProfile(profile);
    setStep('confirm');
  };

  const handleAddNewProfile = (name: string, age: number, rememberForFutureTrips: boolean) => {
    const profile = createDraftProfile(name, age, rememberForFutureTrips);
    if (!canAddProfileToReusePlan(sourceTrip, form, profile)) {
      return;
    }

    handleSelectProfile(profile);
  };

  const handleBackToPick = () => {
    setPendingProfile(null);
    setStep('pick');
  };

  const handleConfirm = (packingMode: 'generated' | 'manual') => {
    if (!pendingProfile || loading) {
      return;
    }

    onConfirm(pendingProfile, packingMode);
    reset();
    onClose();
  };

  const confirmTitle = pendingProfile ? buildReuseAddTravellerConfirmTitle(pendingProfile.name) : '';
  const confirmBody = pendingProfile ? buildReuseAddTravellerConfirmBody(pendingProfile.name) : '';

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.overlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close add person"
            onPress={handleClose}
            style={styles.scrim}
          />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}>
            <View style={styles.header}>
              {step === 'confirm' ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back to person selection"
                  onPress={handleBackToPick}
                  style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
                  <Feather name="chevron-left" size={20} color={theme.colors.foreground} />
                </Pressable>
              ) : (
                <View style={styles.backPlaceholder} />
              )}
              <AppText variant="bodySemiBold" style={styles.headerTitle}>
                {step === 'pick' ? 'Add person' : confirmTitle}
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close add person"
                onPress={handleClose}
                style={[styles.closeButton, { backgroundColor: theme.colors.muted }]}>
                <Feather name="x" size={16} color={theme.colors.foreground} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              {step === 'pick' ? (
                <View style={styles.pickStep}>
                  <AppText variant="bodySmall" color="mutedForeground" style={styles.lead}>
                    Choose someone to add. Their list will be created when you reuse this trip.
                  </AppText>

                  {availableSaved.length > 0 ? (
                    <View style={styles.section}>
                      <AppText variant="sectionLabel" color="mutedForeground">
                        People you&apos;ve packed for before
                      </AppText>
                      <View style={styles.list}>
                        {availableSaved.map((profile) => (
                          <SavedPackingProfileRow
                            key={profile.id}
                            profile={profile}
                            onSelect={() => handleSelectProfile(profile)}
                          />
                        ))}
                      </View>
                    </View>
                  ) : null}

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Add someone new"
                    onPress={() => setAddProfileVisible(true)}
                    style={({ pressed }) => [
                      styles.addTrigger,
                      { borderColor: theme.colors.border },
                      pressed && styles.pressed,
                    ]}>
                    <Feather name="plus" size={16} color={theme.colors.primary} />
                    <AppText variant="bodySmall" color="primary" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
                      Add someone new
                    </AppText>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.confirmStep}>
                  <AppText variant="bodySmall" color="mutedForeground" style={styles.lead}>
                    {confirmBody}
                  </AppText>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Generate packing list for ${pendingProfile?.name ?? 'traveller'}`}
                    onPress={() => handleConfirm('generated')}
                    disabled={loading}
                    style={({ pressed }) => [
                      styles.modeButton,
                      { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
                      pressed && styles.pressed,
                    ]}>
                    {loading ? (
                      <ActivityIndicator color={theme.colors.primary} />
                    ) : (
                      <>
                        <Feather name="zap" size={18} color={theme.colors.primary} />
                        <View style={styles.modeCopy}>
                          <AppText variant="bodySmall" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
                            Generate packing list
                          </AppText>
                          <AppText variant="caption" color="mutedForeground">
                            Based on trip details and weather
                          </AppText>
                        </View>
                      </>
                    )}
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Create manual list for ${pendingProfile?.name ?? 'traveller'}`}
                    onPress={() => handleConfirm('manual')}
                    disabled={loading}
                    style={({ pressed }) => [
                      styles.modeButton,
                      { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
                      pressed && styles.pressed,
                    ]}>
                    <Feather name="edit-3" size={18} color={theme.colors.foreground} />
                    <View style={styles.modeCopy}>
                      <AppText variant="bodySmall" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
                        Create manually
                      </AppText>
                      <AppText variant="caption" color="mutedForeground">
                        Start with an empty list
                      </AppText>
                    </View>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <AddPackingProfileSheet
        visible={addProfileVisible}
        existingProfiles={[
          ...availableSaved,
          ...form.newTravellers.map((entry) => entry.profile),
          ...sourceTrip.packingLists.map((list) => ({
            id: list.profileSnapshot.id,
            name: list.profileSnapshot.name,
            age: list.profileSnapshot.age,
            birthDate: list.profileSnapshot.birthDate,
            isSelf: list.profileSnapshot.isSelf,
          })),
        ]}
        onClose={() => setAddProfileVisible(false)}
        onAdd={handleAddNewProfile}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {
    width: 36,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: screenPaddingHorizontal,
    paddingBottom: 24,
  },
  pickStep: {
    gap: 16,
  },
  confirmStep: {
    gap: 12,
  },
  lead: {
    lineHeight: 20,
  },
  section: {
    gap: 8,
  },
  list: {
    gap: 8,
  },
  addTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 14,
    minHeight: 48,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 56,
  },
  modeCopy: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    opacity: 0.92,
  },
});
