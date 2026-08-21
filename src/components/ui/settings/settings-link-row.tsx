import type { ReactNode } from 'react';
import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';

type SettingsLinkRowProps = {
  icon: ReactNode;
  label: string;
  hint?: string;
  onPress?: () => void;
  disabled?: boolean;
};

export function SettingsLinkRow({
  icon,
  label,
  hint,
  onPress,
  disabled = false,
}: SettingsLinkRowProps) {
  const theme = useTheme();
  const interactive = Boolean(onPress) && !disabled;

  const content = (
    <>
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.accent }]}>
        {icon}
      </View>
      <AppText
        variant="bodySmall"
        color={disabled ? 'mutedForeground' : 'foreground'}
        style={{ flex: 1, fontFamily: theme.fontFamilies.sansMedium }}>
        {label}
      </AppText>
      {hint ? (
        <AppText variant="caption" color="mutedForeground">
          {hint}
        </AppText>
      ) : null}
      {interactive ? (
        <Feather name="chevron-right" size={16} color={theme.colors.mutedForeground} />
      ) : null}
    </>
  );

  if (!interactive) {
    return (
      <View
        accessibilityRole="text"
        accessibilityLabel={hint ? `${label}, ${hint}` : label}
        style={styles.row}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hint ? `${label}, ${hint}` : label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 52,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
