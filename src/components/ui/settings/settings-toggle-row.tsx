import type { ReactNode } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';

type SettingsToggleRowProps = {
  icon: ReactNode;
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

export function SettingsToggleRow({
  icon,
  label,
  hint,
  value,
  onValueChange,
  disabled = false,
}: SettingsToggleRowProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.accent }]}>
        {icon}
      </View>
      <View style={styles.copy}>
        <AppText variant="bodySmall" style={{ fontFamily: theme.fontFamilies.sansMedium }}>
          {label}
        </AppText>
        {hint ? (
          <AppText variant="caption" color="mutedForeground" numberOfLines={1}>
            {hint}
          </AppText>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        accessibilityHint={hint}
        accessibilityRole="switch"
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: theme.colors.muted,
          true: theme.colors.primary,
        }}
        thumbColor={theme.colors.background}
        ios_backgroundColor={theme.colors.muted}
      />
    </View>
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
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
});
