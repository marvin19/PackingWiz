import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppTextInput } from '@/components/ui/field';
import { PrimaryButton } from '@/components/ui/primary-button';
import { AppText } from '@/components/ui/app-text';
import type { TravelerRole } from '@/domain/traveler';
import { useTheme } from '@/hooks/use-theme';

type AddTravelerFormProps = {
  onAdd: (name: string, role: TravelerRole) => void;
  onCancel: () => void;
};

export function AddTravelerForm({ onAdd, onCancel }: AddTravelerFormProps) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [role, setRole] = useState<TravelerRole>('Adult');

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    onAdd(trimmed, role);
    setName('');
    setRole('Adult');
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
        placeholder="Name"
        autoFocus
        accessibilityLabel="Traveler name"
      />
      <View style={styles.roleRow}>
        {(['Adult', 'Child'] as const).map((option) => {
          const selected = role === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setRole(option)}
              style={[
                styles.roleButton,
                {
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                  backgroundColor: selected ? theme.colors.accent : theme.colors.background,
                },
              ]}>
              <AppText variant="bodySmall" style={{ fontFamily: theme.fontFamilies.sansMedium }}>
                {option}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel adding traveler"
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
          <PrimaryButton label="Add" onPress={handleAdd} disabled={!name.trim()} />
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
  roleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
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
