import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { getDestinationLabel } from '@/domain/destination';
import type { Trip } from '@/domain/trip';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal } from '@/theme/spacing';

type PackedCelebrationProps = {
  visible: boolean;
  trip: Trip;
  itemCount: number;
  onViewOverview: () => void;
  onDismiss: () => void;
};

export function PackedCelebration({
  visible,
  trip,
  itemCount,
  onViewOverview,
  onDismiss,
}: PackedCelebrationProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const total = itemCount;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) {
        setReduceMotion(enabled);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Modal
      visible={visible}
      animationType={reduceMotion ? 'none' : 'fade'}
      transparent
      onRequestClose={onDismiss}>
      <View style={[styles.overlay, { backgroundColor: `${theme.colors.primary}F2`, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={[styles.iconWrap, { backgroundColor: `${theme.colors.primaryForeground}26` }]}>
          <Feather name="check-circle" size={56} color={theme.colors.primaryForeground} />
        </View>

        <AppText
          variant="hero"
          style={{
            color: theme.colors.primaryForeground,
            fontFamily: theme.fontFamilies.displayExtraBold,
            textAlign: 'center',
            marginTop: 24,
          }}>
          You&apos;re all packed!
        </AppText>
        <AppText
          variant="bodySmall"
          style={{
            color: `${theme.colors.primaryForeground}CC`,
            textAlign: 'center',
            marginTop: 8,
            lineHeight: 20,
            paddingHorizontal: screenPaddingHorizontal,
          }}>
          Every one of your {total} items for {getDestinationLabel(trip.destination)} is packed and ready. Have an amazing trip.
        </AppText>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View Insights"
            onPress={onViewOverview}
            style={[styles.primaryAction, { backgroundColor: theme.colors.primaryForeground }]}>
            <Feather name="list" size={16} color={theme.colors.primary} />
            <AppText variant="bodySmall" style={{ color: theme.colors.primary, fontFamily: theme.fontFamilies.displayExtraBold }}>
              View Insights
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to my list"
            onPress={onDismiss}
            style={[styles.secondaryAction, { borderColor: `${theme.colors.primaryForeground}66` }]}>
            <Feather name="smile" size={16} color={theme.colors.primaryForeground} />
            <AppText variant="bodySmall" style={{ color: theme.colors.primaryForeground, fontFamily: theme.fontFamilies.sansSemiBold }}>
              Back to my list
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: screenPaddingHorizontal,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    width: '100%',
    maxWidth: 320,
    marginTop: 32,
    gap: 10,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 9999,
    paddingVertical: 14,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 9999,
    paddingVertical: 14,
  },
});
