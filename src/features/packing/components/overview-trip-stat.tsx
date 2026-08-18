import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';

type OverviewTripStatProps = {
  value: string;
  label: string;
  icon?: ReactNode;
};

export function OverviewTripStat({ value, label, icon }: OverviewTripStatProps) {
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
      <AppText variant="title" style={{ fontFamily: theme.fontFamilies.displayExtraBold, textAlign: 'center' }}>
        {value}
      </AppText>
      <View style={styles.labelRow}>
        {icon}
        <AppText variant="caption" color="mutedForeground" style={{ textAlign: 'center' }}>
          {label}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
});
