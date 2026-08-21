import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';

type SettingsRowProps = {
  icon: ReactNode;
  label: string;
  hint?: string;
};

export function SettingsRow({ icon, label, hint }: SettingsRowProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.accent }]}>
        {icon}
      </View>
      <AppText variant="bodySmall" style={{ flex: 1, fontFamily: theme.fontFamilies.sansMedium }}>
        {label}
      </AppText>
      {hint ? (
        <AppText variant="caption" color="mutedForeground">
          {hint}
        </AppText>
      ) : null}
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
});
