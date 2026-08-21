import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';

type FilterPillProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
};

export function FilterPill({ label, active, onPress, icon }: FilterPillProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: active ? theme.colors.foreground : theme.colors.muted,
        },
        pressed && styles.pressed,
      ]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <AppText
        variant="caption"
        style={{
          fontFamily: theme.fontFamilies.sansSemiBold,
          color: active ? theme.colors.background : theme.colors.mutedForeground,
        }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  icon: {
    marginTop: 1,
  },
  pressed: {
    opacity: 0.9,
  },
});
