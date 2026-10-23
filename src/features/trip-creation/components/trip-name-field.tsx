import { StyleSheet, View } from 'react-native';

import { AppTextInput, Field } from '@/components/ui/field';
import { AppText } from '@/components/ui/app-text';
import type { TripDraft } from '@/domain/trip-draft';

export const TRIP_NAME_FIELD_HELPER_TEXT = 'e.g. Hyttetur. Leave blank to use destination.';

type TripNameFieldProps = {
  draft: TripDraft;
  onChangeName: (name: string) => void;
  label?: string;
  /** When omitted, uses {@link TRIP_NAME_FIELD_HELPER_TEXT}. Pass `null` to hide helper copy. */
  helperText?: string | null;
};

export function tripNameFieldDisplayValue(draft: Pick<TripDraft, 'name' | 'isTripNameUserEdited'>): string {
  return draft.isTripNameUserEdited ? (draft.name ?? '') : '';
}

export function TripNameField({
  draft,
  onChangeName,
  label = 'Trip name',
  helperText = TRIP_NAME_FIELD_HELPER_TEXT,
}: TripNameFieldProps) {
  const resolvedHelper = helperText ?? null;

  return (
    <View style={styles.container}>
      <Field label={label}>
        <View style={styles.fieldBody}>
          {resolvedHelper ? (
            <AppText
              variant="bodySmall"
              color="mutedForeground"
              style={styles.helper}
              maxFontSizeMultiplier={1.3}>
              {resolvedHelper}
            </AppText>
          ) : null}
          <AppTextInput
            value={tripNameFieldDisplayValue(draft)}
            onChangeText={onChangeName}
            placeholder="Trip name"
            accessibilityLabel="Trip name"
            accessibilityHint={resolvedHelper ?? undefined}
            maxFontSizeMultiplier={1.3}
          />
        </View>
      </Field>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  fieldBody: {
    gap: 6,
  },
  helper: {
    paddingHorizontal: 4,
    lineHeight: 18,
  },
});
