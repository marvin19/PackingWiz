import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { SummaryEditButton } from '@/features/trip-creation/components/summary-edit-button';
import { spacing } from '@/theme/spacing';

type SummarySectionProps = {
  title: string;
  children: React.ReactNode;
  editAccessibilityLabel?: string;
  onEdit?: () => void;
};

export function SummarySection({ title, children, editAccessibilityLabel, onEdit }: SummarySectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <AppText variant="sectionLabel" color="mutedForeground" style={styles.title}>
            {title}
          </AppText>
        </View>
        {onEdit && editAccessibilityLabel ? (
          <SummaryEditButton accessibilityLabel={editAccessibilityLabel} onPress={onEdit} />
        ) : null}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    lineHeight: 16,
  },
  body: {
    paddingHorizontal: spacing.xs,
  },
});
