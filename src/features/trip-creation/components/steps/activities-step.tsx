import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppTextInput } from '@/components/ui/field';
import { Chip } from '@/components/ui/chip';
import { AppText } from '@/components/ui/app-text';
import { ACTIVITIES } from '@/domain/catalog';
import type { TripDraft } from '@/domain/trip-draft';
import { useTheme } from '@/hooks/use-theme';

type ActivitiesStepProps = {
  draft: TripDraft;
  onToggleActivity: (activity: string) => void;
  onAddActivity: (activity: string) => void;
};

export function ActivitiesStep({ draft, onToggleActivity, onAddActivity }: ActivitiesStepProps) {
  const theme = useTheme();
  const [customValue, setCustomValue] = useState('');
  const catalogSet = new Set<string>(ACTIVITIES);
  const customActivities = draft.activities.filter((activity) => !catalogSet.has(activity));

  const submitCustom = () => {
    const trimmed = customValue.trim();
    if (!trimmed) {
      return;
    }
    onAddActivity(trimmed);
    setCustomValue('');
  };

  return (
    <View style={styles.container}>
      <AppText variant="bodySmall" color="mutedForeground" style={styles.hint}>
        Pick anything that applies — this helps us pack for what you&apos;ll actually do.
      </AppText>
      <View style={styles.chips}>
        {ACTIVITIES.map((activity) => (
          <Chip
            key={activity}
            label={activity}
            selected={draft.activities.includes(activity)}
            onPress={() => onToggleActivity(activity)}
          />
        ))}
        {customActivities.map((activity) => (
          <Chip
            key={activity}
            label={activity}
            selected
            onPress={() => onToggleActivity(activity)}
          />
        ))}
      </View>
      <View style={styles.customRow}>
        <AppTextInput
          value={customValue}
          onChangeText={setCustomValue}
          placeholder="Add your own activity"
          onSubmitEditing={submitCustom}
          returnKeyType="done"
          style={styles.customInput}
          accessibilityLabel="Custom activity"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add activity"
          onPress={submitCustom}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: theme.colors.primary },
            pressed && styles.pressed,
          ]}>
          <Feather name="plus" size={16} color={theme.colors.primaryForeground} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  hint: {
    marginTop: -8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  customRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  customInput: {
    flex: 1,
    borderRadius: 9999,
    paddingVertical: 10,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.9,
  },
});
