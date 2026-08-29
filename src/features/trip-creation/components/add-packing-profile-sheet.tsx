import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTextInput } from '@/components/ui/field';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import type { PackingProfile } from '@/domain/packing-profile';
import {
  hasDuplicateDraftProfileName,
  isValidDraftProfileAge,
  parseDraftProfileAge,
} from '@/domain/trip-draft-profiles';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal } from '@/theme/spacing';

type AddPackingProfileSheetProps = {
  visible: boolean;
  existingProfiles: PackingProfile[];
  onAdd: (name: string, age: number, rememberForFutureTrips: boolean) => void;
  onClose: () => void;
};

export function AddPackingProfileSheet({
  visible,
  existingProfiles,
  onAdd,
  onClose,
}: AddPackingProfileSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [ageText, setAgeText] = useState('');
  const [rememberForFutureTrips, setRememberForFutureTrips] = useState(true);
  const [nameTouched, setNameTouched] = useState(false);
  const [ageTouched, setAgeTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reset = () => {
    setName('');
    setAgeText('');
    setRememberForFutureTrips(true);
    setNameTouched(false);
    setAgeTouched(false);
    setSubmitted(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const trimmedName = name.trim();
  const duplicateName = hasDuplicateDraftProfileName(existingProfiles, trimmedName);
  const validAge = isValidDraftProfileAge(ageText);
  const shouldValidateName = nameTouched || submitted;
  const shouldValidateAge = ageTouched || submitted;

  const showNameRequired = shouldValidateName && !trimmedName;
  const showDuplicateName = trimmedName.length > 0 && duplicateName;
  const showAgeError = shouldValidateAge && !validAge;

  const canSubmit = useMemo(() => {
    return trimmedName.length > 0 && validAge && !duplicateName;
  }, [duplicateName, trimmedName.length, validAge]);

  const handleAdd = () => {
    setSubmitted(true);
    setNameTouched(true);
    setAgeTouched(true);

    if (!trimmedName || !validAge || duplicateName) {
      return;
    }

    const age = parseDraftProfileAge(ageText);
    if (age === null) {
      return;
    }

    onAdd(trimmedName, age, rememberForFutureTrips);
    reset();
    onClose();
  };

  return (
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
              paddingBottom: Math.max(insets.bottom, theme.spacing.base),
            },
          ]}>
          <View style={styles.sheetHeader}>
            <AppText variant="bodySemiBold">Add someone</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close add person"
              onPress={handleClose}
              style={[styles.closeButton, { backgroundColor: theme.colors.muted }]}>
              <Feather name="x" size={16} color={theme.colors.foreground} />
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.form}>
            <View style={styles.fieldBlock}>
              <AppText variant="sectionLabel" color="mutedForeground">
                Name
              </AppText>
              <AppTextInput
                value={name}
                onChangeText={setName}
                onBlur={() => setNameTouched(true)}
                placeholder="Name"
                autoFocus
                accessibilityLabel="Person name"
              />
              {showNameRequired ? (
                <AppText variant="caption" style={{ color: theme.colors.destructive }}>
                  Name is required
                </AppText>
              ) : null}
              {showDuplicateName ? (
                <AppText variant="caption" style={{ color: theme.colors.destructive }}>
                  This person is already added.
                </AppText>
              ) : null}
            </View>

            <View style={styles.fieldBlock}>
              <AppText variant="sectionLabel" color="mutedForeground">
                Age
              </AppText>
              <AppTextInput
                value={ageText}
                onChangeText={setAgeText}
                onBlur={() => setAgeTouched(true)}
                placeholder="Age (years)"
                keyboardType="number-pad"
                accessibilityLabel="Age in whole years"
              />
              {showAgeError ? (
                <AppText variant="caption" style={{ color: theme.colors.destructive }}>
                  Invalid age
                </AppText>
              ) : null}
            </View>

            <View style={styles.rememberRow}>
              <View style={styles.rememberCopy}>
                <AppText variant="bodySmall" style={{ fontFamily: theme.fontFamilies.sansMedium }}>
                  Remember this person for future trips
                </AppText>
              </View>
              <Switch
                accessibilityLabel="Remember this person for future trips"
                accessibilityRole="switch"
                value={rememberForFutureTrips}
                onValueChange={setRememberForFutureTrips}
                trackColor={{
                  false: theme.colors.muted,
                  true: theme.colors.primary,
                }}
                thumbColor={theme.colors.background}
                ios_backgroundColor={theme.colors.muted}
              />
            </View>

            <PrimaryButton label="Add person" onPress={handleAdd} disabled={!canSubmit} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    gap: 16,
    paddingBottom: 8,
  },
  fieldBlock: {
    gap: 8,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rememberCopy: {
    flex: 1,
  },
});
