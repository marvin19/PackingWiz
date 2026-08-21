import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ProgressBar } from '@/components/ui/progress-bar';
import type { TravelerProgress } from '@/domain/packing-stats';
import { useTheme } from '@/hooks/use-theme';

type OverviewTravelerRowProps = {
  progress: TravelerProgress;
};

export function OverviewTravelerRow({ progress }: OverviewTravelerRowProps) {
  const theme = useTheme();
  const done = progress.packed === progress.total;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}>
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: progress.shared ? theme.colors.secondary : `${theme.colors.primary}26`,
          },
        ]}>
        {progress.shared ? (
          <Feather name="users" size={16} color={theme.colors.secondaryForeground} />
        ) : (
          <AppText variant="bodySmall" style={{ fontFamily: theme.fontFamilies.displayExtraBold, color: theme.colors.primary }}>
            {progress.name.charAt(0)}
          </AppText>
        )}
      </View>
      <View style={styles.copy}>
        <View style={styles.topRow}>
          <View style={styles.nameRow}>
            <AppText variant="bodySmall" numberOfLines={1} style={{ fontFamily: theme.fontFamilies.sansMedium }}>
              {progress.name}
            </AppText>
            <AppText variant="caption" color="mutedForeground">
              {progress.sub}
            </AppText>
          </View>
          <AppText
            variant="caption"
            style={{
              fontFamily: theme.fontFamilies.sansSemiBold,
              color: done ? theme.colors.success : theme.colors.mutedForeground,
            }}>
            {progress.packed}/{progress.total}
          </AppText>
        </View>
        <ProgressBar
          value={progress.pct}
          trackHeight={6}
          accessibilityLabel={`${progress.name} packing progress`}
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
    paddingVertical: 12,
  },
  avatar: {
    width: 36,
    height: 36,
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
    gap: 8,
  },
  nameRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
