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

import { AppTextInput, Field } from '@/components/ui/field';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import type { PackingProfile } from '@/domain/packing-profile';
import {
  getDraftProfileAgeValidationMessage,
  hasDuplicateDraftProfileName,
  isValidDraftProfileAge,
  parseDraftProfileAge,
} from '@/domain/trip-draft-profiles';
import {
  ADD_PERSON_AGE_ACCESSIBILITY_LABEL,
  ADD_PERSON_DUPLICATE_NAME_MESSAGE,
  ADD_PERSON_NAME_ACCESSIBILITY_LABEL,
  ADD_PERSON_NAME_REQUIRED_MESSAGE,
  ADD_PERSON_REQUIRED_FIELDS_LEGEND,
} from '@/features/trip-creation/components/add-packing-profile-sheet.copy';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal } from '@/theme/spacing';

type AddPackingProfileSheetProps = {
  visible: boolean;
  existingProfiles: PackingProfile[];
  onAdd: (name: string, age: number, rememberForFutureTrips: boolean) => void;
  onClose: () => void;
};

function requiredInputAccessibilityLabel(label: string): string {
  return `${label}, required`;
}

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
  const nameErrorMessage = showNameRequired
    ? ADD_PERSON_NAME_REQUIRED_MESSAGE
    : showDuplicateName
      ? ADD_PERSON_DUPLICATE_NAME_MESSAGE
      : undefined;

  const ageErrorMessage =
    shouldValidateAge && !validAge ? getDraftProfileAgeValidationMessage(ageText) : null;

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
            <AppText variant="caption" color="mutedForeground" style={styles.requiredLegend}>
              {ADD_PERSON_REQUIRED_FIELDS_LEGEND}
            </AppText>

            <View style={styles.fieldBlock}>
              <Field label="Name" required>
                <AppTextInput
                  value={name}
                  onChangeText={setName}
                  onBlur={() => setNameTouched(true)}
                  placeholder="Name"
                  autoFocus
                  accessibilityLabel={requiredInputAccessibilityLabel(ADD_PERSON_NAME_ACCESSIBILITY_LABEL)}
                  errorMessage={nameErrorMessage ?? undefined}
                />
              </Field>
              {nameErrorMessage ? (
                <AppText
                  variant="caption"
                  style={{ color: theme.colors.destructive }}
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite">
                  {nameErrorMessage}
                </AppText>
              ) : null}
            </View>

            <View style={styles.fieldBlock}>
              <Field label="Age" required>
                <AppTextInput
                  value={ageText}
                  onChangeText={setAgeText}
                  onBlur={() => setAgeTouched(true)}
                  placeholder="Age (years)"
                  keyboardType="number-pad"
                  accessibilityLabel={requiredInputAccessibilityLabel(ADD_PERSON_AGE_ACCESSIBILITY_LABEL)}
                  errorMessage={ageErrorMessage ?? undefined}
                />
              </Field>
              {ageErrorMessage ? (
                <AppText
                  variant="caption"
                  style={{ color: theme.colors.destructive }}
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite">
                  {ageErrorMessage}
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
  requiredLegend: {
    paddingHorizontal: 4,
    marginTop: -4,
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
