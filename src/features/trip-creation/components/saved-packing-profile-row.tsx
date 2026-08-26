import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { PackingProfile } from '@/domain/packing-profile';
import { formatPackingProfileLabel } from '@/domain/trip-draft-profiles';
import { useTheme } from '@/hooks/use-theme';

type SavedPackingProfileRowProps = {
  profile: PackingProfile;
  onSelect: () => void;
};

export function SavedPackingProfileRow({ profile, onSelect }: SavedPackingProfileRowProps) {
  const theme = useTheme();
  const label = formatPackingProfileLabel(profile);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Add ${label} to this trip`}
      onPress={onSelect}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.muted }]}>
        <Feather name="user" size={16} color={theme.colors.primary} />
      </View>
      <AppText variant="bodySmall" style={{ flex: 1, fontFamily: theme.fontFamilies.sansMedium }}>
        {label}
      </AppText>
      <Feather name="plus" size={16} color={theme.colors.primary} />
    </Pressable>
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
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.95,
  },
});
