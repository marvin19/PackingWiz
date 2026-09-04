import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { SectionTitle } from '@/components/ui/section-title';
import type { ReuseTripChangesSummary } from '@/domain/reuse-trip-changes';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme/spacing';

type ReuseChangesFromOriginalProps = {
  summary: ReuseTripChangesSummary;
};

export function ReuseChangesFromOriginal({ summary }: ReuseChangesFromOriginalProps) {
  const theme = useTheme();

  if (summary.lines.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <SectionTitle>Changes from original</SectionTitle>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}>
        {summary.lines.map((line) => (
          <AppText key={line} variant="bodySmall" style={styles.line}>
            {line}
          </AppText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  line: {
    lineHeight: 20,
  },
});
