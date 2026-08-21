import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';

type ProfileStatCardProps = {
  value: string;
  label: string;
  icon: ReactNode;
};

export function ProfileStatCard({ value, label, icon }: ProfileStatCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}>
      <View style={styles.iconRow}>{icon}</View>
      <AppText
        variant="title"
        style={{ fontFamily: theme.fontFamilies.displayExtraBold, textAlign: 'center' }}>
        {value}
      </AppText>
      <AppText variant="caption" color="mutedForeground" style={{ textAlign: 'center' }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
  },
  iconRow: {
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
