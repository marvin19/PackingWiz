import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { ReuseTripSourceSummary } from '@/features/trips/utils/reuse-trip-view-model';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme/spacing';

type ReuseTripSourceSummaryCardProps = {
  summary: ReuseTripSourceSummary;
};

export function ReuseTripSourceSummaryCard({ summary }: ReuseTripSourceSummaryCardProps) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={summary.accessibilityLabel}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}>
      <AppText variant="bodySmall" color="mutedForeground" style={styles.eyebrow}>
        Reusing
      </AppText>
      <AppText variant="subheading" numberOfLines={2} style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
        {summary.tripName}
      </AppText>
      <AppText variant="bodySmall" color="mutedForeground" numberOfLines={1}>
        {summary.dateRangeLabel}
      </AppText>
      <AppText variant="bodySmall" color="mutedForeground" numberOfLines={1}>
        {summary.peopleLabel}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: spacing.base,
    gap: 4,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
});
