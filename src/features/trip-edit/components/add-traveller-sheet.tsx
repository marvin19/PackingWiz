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
  availableSavedProfilesForTrip,
  buildAddTravellerConfirmBody,
  buildAddTravellerConfirmTitle,
  getEditTripTravellerRows,
} from '@/features/trip-edit/utils/edit-trip-view-model';
import type { Trip } from '@/domain/trip';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal } from '@/theme/spacing';

type AddTravellerSheetProps = {
  visible: boolean;
  trip: Trip;
  savedPackingProfiles: PackingProfile[];
  loading?: boolean;
  onClose: () => void;
  onConfirm: (profile: PackingProfile, packingMode: 'generated' | 'manual') => void;
};

type AddTravellerStep = 'pick' | 'confirm';

export function AddTravellerSheet({
  visible,
  trip,
  savedPackingProfiles,
  loading = false,
  onClose,
  onConfirm,
}: AddTravellerSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<AddTravellerStep>('pick');
  const [pendingProfile, setPendingProfile] = useState<PackingProfile | null>(null);
  const [addProfileVisible, setAddProfileVisible] = useState(false);

  const availableSaved = useMemo(
    () => availableSavedProfilesForTrip(savedPackingProfiles, trip),
    [savedPackingProfiles, trip],
  );

  const existingNames = useMemo(
    () => getEditTripTravellerRows(trip).map((row) => row.name),
    [trip],
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
    setPendingProfile(profile);
    setStep('confirm');
  };

  const handleAddNewProfile = (name: string, age: number, rememberForFutureTrips: boolean) => {
    handleSelectProfile(createDraftProfile(name, age, rememberForFutureTrips));
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
  };

  const confirmTitle = pendingProfile ? buildAddTravellerConfirmTitle(pendingProfile.name) : '';
  const confirmBody = pendingProfile
    ? buildAddTravellerConfirmBody(pendingProfile.name, existingNames)
    : '';

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.overlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close add traveller"
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
                  accessibilityLabel="Back to traveller selection"
                  onPress={handleBackToPick}
                  style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
                  <Feather name="chevron-left" size={20} color={theme.colors.foreground} />
                </Pressable>
              ) : (
                <View style={styles.backPlaceholder} />
              )}
              <AppText variant="bodySemiBold" style={styles.headerTitle}>
                {step === 'pick' ? 'Add traveller' : confirmTitle}
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close add traveller"
                onPress={handleClose}
                style={[styles.closeButton, { backgroundColor: theme.colors.muted }]}>
                <Feather name="x" size={16} color={theme.colors.foreground} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              {step === 'pick' ? (
                <View style={styles.pickStep}>
                  <AppText variant="bodySmall" color="mutedForeground" style={styles.lead}>
                    Choose someone to add. Existing packing lists won&apos;t be changed.
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
                    accessibilityLabel="Generate packing list"
                    accessibilityState={{ disabled: loading }}
                    disabled={loading}
                    onPress={() => handleConfirm('generated')}
                    style={({ pressed }) => [
                      styles.primaryAction,
                      {
                        backgroundColor: theme.colors.primary,
                        opacity: loading ? 0.5 : pressed ? 0.92 : 1,
                      },
                    ]}>
                    {loading ? (
                      <ActivityIndicator size="small" color={theme.colors.primaryForeground} />
                    ) : (
                      <>
                        <Feather name="star" size={18} color={theme.colors.primaryForeground} />
                        <AppText
                          variant="bodySmall"
                          style={{
                            color: theme.colors.primaryForeground,
                            fontFamily: theme.fontFamilies.sansBold,
                          }}>
                          Generate packing list
                        </AppText>
                      </>
                    )}
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Create manually"
                    accessibilityState={{ disabled: loading }}
                    disabled={loading}
                    onPress={() => handleConfirm('manual')}
                    style={({ pressed }) => [
                      styles.secondaryAction,
                      {
                        borderColor: theme.colors.border,
                        opacity: loading ? 0.5 : pressed ? 0.85 : 1,
                      },
                    ]}>
                    <AppText variant="bodySmall" color="primary" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
                      Create manually
                    </AppText>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <AddPackingProfileSheet
        visible={addProfileVisible}
        existingProfiles={trip.packingLists.map((list) => list.profileSnapshot)}
        onAdd={handleAddNewProfile}
        onClose={() => setAddProfileVisible(false)}
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
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  sheet: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: 12,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: 8,
  },
  pickStep: {
    gap: 20,
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
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 9999,
    paddingVertical: 14,
    minHeight: 44,
  },
  secondaryAction: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 9999,
    paddingVertical: 14,
    minHeight: 44,
  },
  pressed: {
    opacity: 0.9,
  },
});
