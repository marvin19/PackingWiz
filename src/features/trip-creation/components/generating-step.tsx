import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';

export type GeneratingStepStatus = 'pending' | 'active' | 'done';

type GeneratingStepProps = {
  label: string;
  status: GeneratingStepStatus;
};

export function GeneratingStep({ label, status }: GeneratingStepProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.indicator,
          status === 'done'
            ? { backgroundColor: theme.colors.success }
            : status === 'active'
              ? { backgroundColor: `${theme.colors.primary}26` }
              : { backgroundColor: theme.colors.muted },
        ]}>
        {status === 'done' ? (
          <Feather name="check" size={14} color={theme.colors.primaryForeground} />
        ) : status === 'active' ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <View style={[styles.dot, { backgroundColor: theme.colors.mutedForeground }]} />
        )}
      </View>
      <AppText
        variant="bodySmall"
        color={status === 'pending' ? 'mutedForeground' : 'foreground'}
        style={{ flex: 1 }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  indicator: {
    width: 24,
    height: 24,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 9999,
  },
});
