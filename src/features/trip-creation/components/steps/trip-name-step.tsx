import { StyleSheet, View } from 'react-native';

import { AppTextInput, Field } from '@/components/ui/field';
import { AppText } from '@/components/ui/app-text';
import type { TripDraft } from '@/domain/trip-draft';

type TripNameStepProps = {
  draft: TripDraft;
  onChangeName: (name: string) => void;
};

export function TripNameStep({ draft, onChangeName }: TripNameStepProps) {
  return (
    <View style={styles.container}>
      <AppText variant="bodySmall" color="mutedForeground" style={styles.hint}>
        This is how your trip will appear in PackingWiz. You can keep the destination label or choose
        something more personal.
      </AppText>
      <Field label="Trip name">
        <AppTextInput
          value={draft.name}
          onChangeText={onChangeName}
          placeholder="Trip name"
          accessibilityLabel="Trip name"
        />
      </Field>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  hint: {
    marginTop: -8,
  },
});
