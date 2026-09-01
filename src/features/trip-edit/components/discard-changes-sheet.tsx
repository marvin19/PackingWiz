import { Feather } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal } from '@/theme/spacing';

type DiscardChangesSheetProps = {
  visible: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
};

export function DiscardChangesSheet({ visible, onKeepEditing, onDiscard }: DiscardChangesSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onKeepEditing}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Keep editing"
          onPress={onKeepEditing}
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
            <AppText variant="bodySemiBold">Discard unsaved changes?</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Keep editing"
              onPress={onKeepEditing}
              style={[styles.closeButton, { backgroundColor: theme.colors.muted }]}>
              <Feather name="x" size={16} color={theme.colors.foreground} />
            </Pressable>
          </View>
          <AppText variant="bodySmall" color="mutedForeground" style={styles.body}>
            Your staged trip edits will be lost.
          </AppText>
          <View style={styles.actions}>
            <PrimaryButton label="Keep editing" onPress={onKeepEditing} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Discard changes"
              onPress={onDiscard}
              style={({ pressed }) => [
                styles.discardButton,
                {
                  borderColor: theme.colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <AppText variant="bodySmall" color="destructive" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
                Discard changes
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
    gap: 10,
    marginTop: 4,
  },
  discardButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingVertical: 14,
    minHeight: 44,
  },
});
