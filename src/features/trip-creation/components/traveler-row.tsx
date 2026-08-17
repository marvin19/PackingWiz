import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { Traveler } from '@/domain/traveler';
import { useTheme } from '@/hooks/use-theme';

type TravelerRowProps = {
  traveler: Traveler;
  canRemove: boolean;
  onRemove: () => void;
};

export function TravelerRow({ traveler, canRemove, onRemove }: TravelerRowProps) {
  const theme = useTheme();
  const iconName = traveler.role === 'Child' ? 'smile' : 'user';

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}>
      <View style={[styles.avatar, { backgroundColor: theme.colors.accent }]}>
        <Feather name={iconName} size={16} color={theme.colors.primary} />
      </View>
      <View style={styles.copy}>
        <AppText variant="bodySmall" numberOfLines={1} style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
          {traveler.name}
        </AppText>
        <AppText variant="caption" color="mutedForeground">
          {traveler.role}
        </AppText>
      </View>
      {canRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${traveler.name}`}
          onPress={onRemove}
          hitSlop={8}
          style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}>
          <Feather name="trash-2" size={16} color={theme.colors.mutedForeground} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
