import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type ProgressBarProps = {
  value: number;
  trackHeight?: number;
  accessibilityLabel?: string;
};

export function ProgressBar({
  value,
  trackHeight = 8,
  accessibilityLabel = 'Packing progress',
}: ProgressBarProps) {
  const theme = useTheme();
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
      style={[
        styles.track,
        {
          height: trackHeight,
          borderRadius: trackHeight / 2,
          backgroundColor: theme.colors.muted,
        },
      ]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clamped}%`,
            borderRadius: trackHeight / 2,
            backgroundColor: theme.colors.primary,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
