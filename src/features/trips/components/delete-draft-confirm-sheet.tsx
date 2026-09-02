import { Feather } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal } from '@/theme/spacing';

type DeleteDraftConfirmSheetProps = {
  visible: boolean;
  draftTitle: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteDraftConfirmSheet({
  visible,
  draftTitle,
  onCancel,
  onConfirm,
}: DeleteDraftConfirmSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  if (!draftTitle) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel delete draft"
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
            <AppText variant="bodySemiBold">Delete this draft?</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel delete draft"
              onPress={onCancel}
              style={[styles.closeButton, { backgroundColor: theme.colors.muted }]}>
              <Feather name="x" size={16} color={theme.colors.foreground} />
            </Pressable>
          </View>

          <AppText variant="bodySmall" color="mutedForeground" style={styles.body}>
            Your unfinished trip planning for {draftTitle} will be removed.
          </AppText>
          <AppText variant="bodySmall" color="mutedForeground" style={styles.body}>
            This will not delete saved Packing Profiles or their reusable Important items.
          </AppText>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              onPress={onCancel}
              style={({ pressed }) => [
                styles.cancelButton,
                {
                  borderColor: theme.colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <AppText variant="bodySmall" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
                Cancel
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Delete ${draftTitle} draft`}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.deleteButton,
                {
                  backgroundColor: theme.colors.destructive,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}>
              <AppText
                variant="bodySmall"
                style={{ color: theme.colors.background, fontFamily: theme.fontFamilies.sansBold }}>
                Delete draft
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
  deleteButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    minHeight: 44,
  },
});
