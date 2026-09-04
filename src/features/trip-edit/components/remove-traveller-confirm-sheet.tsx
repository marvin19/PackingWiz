import { Feather } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import {
  buildRemoveTravellerConfirmBody,
  buildRemoveTravellerConfirmTitle,
} from '@/features/trip-edit/utils/edit-trip-view-model';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal } from '@/theme/spacing';

type RemoveTravellerConfirmSheetProps = {
  visible: boolean;
  travellerName: string | null;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function RemoveTravellerConfirmSheet({
  visible,
  travellerName,
  loading = false,
  onCancel,
  onConfirm,
}: RemoveTravellerConfirmSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  if (!travellerName) {
    return null;
  }

  const title = buildRemoveTravellerConfirmTitle(travellerName);
  const body = buildRemoveTravellerConfirmBody(travellerName);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel remove traveller"
          onPress={onCancel}
          style={styles.scrim}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}>
          <View style={styles.header}>
            <AppText variant="bodySemiBold">{title}</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel remove traveller"
              onPress={onCancel}
              style={[styles.closeButton, { backgroundColor: theme.colors.muted }]}>
              <Feather name="x" size={16} color={theme.colors.foreground} />
            </Pressable>
          </View>

          <AppText variant="bodySmall" color="mutedForeground" style={styles.body}>
            {body}
          </AppText>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              disabled={loading}
              onPress={onCancel}
              style={({ pressed }) => [
                styles.cancelButton,
                {
                  borderColor: theme.colors.border,
                  opacity: loading ? 0.5 : pressed ? 0.85 : 1,
                },
              ]}>
              <AppText variant="bodySmall" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
                Cancel
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove ${travellerName}`}
              accessibilityState={{ disabled: loading }}
              disabled={loading}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.removeButton,
                {
                  backgroundColor: theme.colors.destructive,
                  opacity: loading ? 0.5 : pressed ? 0.9 : 1,
                },
              ]}>
              <AppText
                variant="bodySmall"
                style={{ color: theme.colors.background, fontFamily: theme.fontFamilies.sansBold }}>
                Remove {travellerName}
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  sheet: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: 12,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingVertical: 14,
    minHeight: 44,
  },
  removeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    minHeight: 44,
  },
});
