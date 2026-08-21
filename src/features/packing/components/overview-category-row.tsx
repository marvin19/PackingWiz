import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ProgressBar } from '@/components/ui/progress-bar';
import type { CategoryProgress } from '@/domain/packing-stats';
import { getCategoryIcon } from '@/features/packing/utils/category-icons';
import { useTheme } from '@/hooks/use-theme';

type OverviewCategoryRowProps = {
  progress: CategoryProgress;
};

export function OverviewCategoryRow({ progress }: OverviewCategoryRowProps) {
  const theme = useTheme();
  const icon = getCategoryIcon(progress.category);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.accent }]}>
        <Feather name={icon} size={16} color={theme.colors.accentForeground} />
      </View>
      <View style={styles.copy}>
        <View style={styles.topRow}>
          <AppText variant="bodySmall" style={{ fontFamily: theme.fontFamilies.sansMedium }}>
            {progress.category}
          </AppText>
          <AppText variant="caption" color="mutedForeground">
            {progress.packed}/{progress.total}
          </AppText>
        </View>
        <ProgressBar
          value={progress.pct}
          trackHeight={6}
          accessibilityLabel={`${progress.category} packing progress`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
});
