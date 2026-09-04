import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { Insight } from '@/domain/insight';
import { getInsightCategoryIcon } from '@/features/packing/utils/insight-category-icon';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme/spacing';

type TripInsightCardProps = {
  insight: Insight;
};

export function TripInsightCard({ insight }: TripInsightCardProps) {
  const theme = useTheme();
  const iconName = getInsightCategoryIcon(insight.category);

  return (
    <View
      accessible
      accessibilityLabel={`${insight.title}. ${insight.body}`}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}>
      <View style={styles.titleRow}>
        <Feather name={iconName} size={16} color={theme.colors.primary} style={styles.icon} />
        <AppText
          variant="bodySmall"
          style={{ fontFamily: theme.fontFamilies.sansSemiBold, flex: 1, flexShrink: 1 }}>
          {insight.title}
        </AppText>
      </View>
      <AppText variant="bodySmall" color="mutedForeground" style={styles.body}>
        {insight.body}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  icon: {
    marginTop: 2,
    flexShrink: 0,
  },
  body: {
    lineHeight: 20,
    paddingLeft: 16 + spacing.sm,
  },
});
