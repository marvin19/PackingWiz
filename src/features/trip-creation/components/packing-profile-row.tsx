import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { PackingProfile } from '@/domain/packing-profile';
import { formatPackingProfileLabel } from '@/domain/trip-draft-profiles';
import { useTheme } from '@/hooks/use-theme';

type PackingProfileRowProps = {
  profile: PackingProfile;
  canRemove: boolean;
  onRemove: () => void;
};

export function PackingProfileRow({ profile, canRemove, onRemove }: PackingProfileRowProps) {
  const theme = useTheme();
  const label = formatPackingProfileLabel(profile);

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}>
      <View style={[styles.checkWrap, { backgroundColor: theme.colors.accent }]}>
        <Feather name="check" size={14} color={theme.colors.primary} />
      </View>
      <View style={styles.copy}>
        <AppText
          variant="bodySmall"
          numberOfLines={1}
          style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
          {label}
        </AppText>
        {profile.isSelf ? (
          <AppText variant="caption" color="mutedForeground">
            Your packing list
          </AppText>
        ) : null}
      </View>
      {canRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${profile.name}`}
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
  checkWrap: {
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
