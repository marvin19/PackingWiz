import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';

type ProgressRingProps = {
  value: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
};

export function ProgressRing({ value, size = 58, stroke = 6, children }: ProgressRingProps) {
  const theme = useTheme();
  const clamped = Math.min(100, Math.max(0, value));
  const complete = clamped === 100;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Packing progress"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
      style={[styles.wrap, { width: size, height: size }]}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: stroke,
            borderColor: complete ? theme.colors.success : theme.colors.muted,
          },
        ]}
      />
      {!complete && clamped > 0 ? (
        <View
          style={[
            styles.ring,
            {
              width: size - stroke * 2,
              height: size - stroke * 2,
              borderRadius: (size - stroke * 2) / 2,
              borderWidth: 2,
              borderColor: `${theme.colors.primary}55`,
            },
          ]}
        />
      ) : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

type ProgressRingLabelProps = {
  value: number;
};

export function ProgressRingLabel({ value }: ProgressRingLabelProps) {
  const theme = useTheme();
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <AppText
      variant="bodySmall"
      style={{ fontFamily: theme.fontFamilies.displayExtraBold, color: theme.colors.foreground }}>
      {clamped}%
    </AppText>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
