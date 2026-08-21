import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';

type OverviewInsightCardProps = {
  text: string;
};

export function OverviewInsightCard({ text }: OverviewInsightCardProps) {
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
      <Feather name="zap" size={16} color={theme.colors.buyForeground} style={styles.icon} />
      <AppText variant="bodySmall" style={styles.text}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  icon: {
    marginTop: 2,
  },
  text: {
    flex: 1,
    lineHeight: 20,
  },
});
