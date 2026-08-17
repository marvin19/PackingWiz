import { StyleSheet, View } from 'react-native';

import { AppTextInput } from '@/components/ui/field';
import { AppText } from '@/components/ui/app-text';
import type { TripDraft } from '@/domain/trip-draft';

type NoteStepProps = {
  draft: TripDraft;
  onChangeNote: (note: string) => void;
};

export function NoteStep({ draft, onChangeNote }: NoteStepProps) {
  return (
    <View style={styles.container}>
      <AppText variant="bodySmall" color="mutedForeground" style={styles.hint}>
        Add anything that would change what you pack. Optional, but it helps.
      </AppText>
      <AppTextInput
        value={draft.note}
        onChangeText={onChangeNote}
        placeholder="I'm running a half marathon, we'll have one nice dinner, and I don't want to overpack."
        multiline
        numberOfLines={5}
        textAlignVertical="top"
        style={styles.textarea}
        accessibilityLabel="Additional trip notes"
      />
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
  textarea: {
    minHeight: 140,
    paddingTop: 16,
    lineHeight: 22,
  },
});
