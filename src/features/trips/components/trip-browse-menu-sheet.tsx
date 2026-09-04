import { Feather } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import type { Trip } from '@/domain/trip';
import {
  buildReuseTripActionAccessibilityLabel,
  buildReuseTripMenuAccessibilityLabel,
  REUSE_TRIP_ACTION_LABEL,
} from '@/features/trips/utils/reuse-trip-display';
import { buildDeleteTripPermanentlyAccessibilityLabel } from '@/features/trips/utils/trip-delete-display';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal } from '@/theme/spacing';

type TripBrowseMenuSheetProps = {
  visible: boolean;
  trip: Trip | null;
  showDeletePermanently: boolean;
  onClose: () => void;
  onReuseTrip: (tripId: string) => void;
  onDeletePermanently?: (tripId: string) => void;
};

export function TripBrowseMenuSheet({
  visible,
  trip,
  showDeletePermanently,
  onClose,
  onReuseTrip,
  onDeletePermanently,
}: TripBrowseMenuSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  if (!trip) {
    return null;
  }

  const reuseLabel = buildReuseTripActionAccessibilityLabel(trip);
  const deleteLabel = buildDeleteTripPermanentlyAccessibilityLabel(trip);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close trip options"
          onPress={onClose}
          style={styles.scrim}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.background,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}>
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
          </View>

          <AppText variant="subheading" style={[styles.title, { fontFamily: theme.fontFamilies.displayExtraBold }]}>
            Trip options
          </AppText>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={reuseLabel}
            onPress={() => {
              onClose();
              onReuseTrip(trip.id);
            }}
            style={({ pressed }) => [
              styles.optionRow,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.92 : 1,
              },
            ]}>
            <View style={[styles.iconWrap, { backgroundColor: theme.colors.accent }]}>
              <Feather name="copy" size={18} color={theme.colors.primary} />
            </View>
            <AppText
              variant="bodySmall"
              style={{ flex: 1, fontFamily: theme.fontFamilies.sansSemiBold, color: theme.colors.foreground }}>
              {REUSE_TRIP_ACTION_LABEL}
            </AppText>
            <Feather name="chevron-right" size={16} color={theme.colors.mutedForeground} accessibilityElementsHidden />
          </Pressable>

          {showDeletePermanently && onDeletePermanently ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={deleteLabel}
              onPress={() => {
                onClose();
                onDeletePermanently(trip.id);
              }}
              style={({ pressed }) => [
                styles.optionRow,
                styles.destructiveRow,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}>
              <View style={[styles.iconWrap, { backgroundColor: `${theme.colors.destructive}14` }]}>
                <Feather name="trash-2" size={18} color={theme.colors.destructive} />
              </View>
              <AppText
                variant="bodySmall"
                style={{ flex: 1, fontFamily: theme.fontFamilies.sansSemiBold, color: theme.colors.destructive }}>
                Delete permanently
              </AppText>
              <Feather name="chevron-right" size={16} color={theme.colors.mutedForeground} accessibilityElementsHidden />
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={onClose}
            style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
            <AppText variant="bodySmall" color="mutedForeground" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
              Cancel
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function buildTripBrowseMenuAccessibilityLabel(trip: Trip): string {
  return buildReuseTripMenuAccessibilityLabel(trip);
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: screenPaddingHorizontal,
  },
  handleRow: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 9999,
  },
  title: {
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    marginBottom: 8,
  },
  destructiveRow: {
    marginTop: 4,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: 8,
  },
  pressed: {
    opacity: 0.9,
  },
});
