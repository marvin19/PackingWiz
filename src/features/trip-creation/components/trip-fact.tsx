import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';

type TripFactProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

export function TripFact({ icon, label, value }: TripFactProps) {
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
      <View style={styles.labelRow}>
        {icon}
        <AppText variant="caption" color="mutedForeground" style={{ fontFamily: theme.fontFamilies.sansMedium }}>
          {label}
        </AppText>
      </View>
      <AppText variant="bodySmall" numberOfLines={2} style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
