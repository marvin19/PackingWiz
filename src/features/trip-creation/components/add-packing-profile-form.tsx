import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppTextInput } from '@/components/ui/field';
import { PrimaryButton } from '@/components/ui/primary-button';
import { AppText } from '@/components/ui/app-text';
import type { PackingProfile } from '@/domain/packing-profile';
import {
  hasDuplicateDraftProfileName,
  isValidDraftProfileAge,
  parseDraftProfileAge,
} from '@/domain/trip-draft-profiles';
import { useTheme } from '@/hooks/use-theme';

type AddPackingProfileFormProps = {
  existingProfiles: PackingProfile[];
  onAdd: (name: string, age: number, rememberForFutureTrips: boolean) => void;
  onCancel: () => void;
};

export function AddPackingProfileForm({
  existingProfiles,
  onAdd,
  onCancel,
}: AddPackingProfileFormProps) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [ageText, setAgeText] = useState('');
  const [rememberForFutureTrips, setRememberForFutureTrips] = useState(true);
  const [nameTouched, setNameTouched] = useState(false);
  const [ageTouched, setAgeTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
    setName('');
    setAgeText('');
    setRememberForFutureTrips(true);
    setNameTouched(false);
    setAgeTouched(false);
    setSubmitted(false);
  };

  return (
    <View
      style={[
        styles.form,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}>
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

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel adding person"
          onPress={onCancel}
          style={({ pressed }) => [
            styles.secondaryAction,
            { borderColor: theme.colors.border },
            pressed && styles.pressed,
          ]}>
          <AppText variant="bodySmall" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
            Cancel
          </AppText>
        </Pressable>
        <View style={styles.primaryAction}>
          <PrimaryButton label="Add" onPress={handleAdd} disabled={!canSubmit} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rememberCopy: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryAction: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
  },
  primaryAction: {
    flex: 1,
  },
  pressed: {
    opacity: 0.9,
  },
});
