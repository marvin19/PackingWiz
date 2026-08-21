import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';

type TripsEmptyStateProps = {
  message: string;
};

export function TripsEmptyState({ message }: TripsEmptyStateProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.muted,
        },
      ]}>
      <AppText variant="bodySmall" color="mutedForeground" style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    borderStyle: 'dashed',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  text: {
    textAlign: 'center',
  },
});
