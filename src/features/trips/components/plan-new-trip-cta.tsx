import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';

type PlanNewTripCtaProps = {
  onPress: () => void;
};

export function PlanNewTripCta({ onPress }: PlanNewTripCtaProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Plan a new trip"
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.colors.primary,
          shadowColor: theme.colors.foreground,
        },
        pressed && styles.pressed,
      ]}>
      <View
        style={[
          styles.iconBox,
          { backgroundColor: `${theme.colors.primaryForeground}26` },
        ]}>
        <Feather name="plus" size={24} color={theme.colors.primaryForeground} />
      </View>
      <View style={styles.copy}>
        <AppText
          variant="bodySemiBold"
          style={[styles.title, { color: theme.colors.primaryForeground, fontFamily: theme.fontFamilies.display }]}>
          Plan a new trip
        </AppText>
        <AppText variant="bodySmall" style={{ color: `${theme.colors.primaryForeground}CC` }}>
          Tell us where you&apos;re going — we&apos;ll pack it
        </AppText>
      </View>
      <Feather name="arrow-right" size={20} color={`${theme.colors.primaryForeground}CC`} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
  },
});
