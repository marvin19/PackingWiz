import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { PackingListOptionRow } from '@/features/packing/components/packing-list-option-row';
import { formatPackingListProfileName } from '@/domain/packing-list-display';
import type { Trip } from '@/domain/trip';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal } from '@/theme/spacing';

type PackingListPickerSheetProps = {
  visible: boolean;
  trip: Trip;
  selectedListId: string | null;
  onSelect: (listId: string) => void;
  onClose: () => void;
};

export function PackingListPickerSheet({
  visible,
  trip,
  selectedListId,
  onSelect,
  onClose,
}: PackingListPickerSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const activeName = trip.packingLists.find((list) => list.id === selectedListId);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close packing list picker" onPress={onClose} style={styles.scrim} />
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

          <View style={styles.header}>
            <AppText variant="subheading" style={{ fontFamily: theme.fontFamilies.displayExtraBold }}>
              Switch packing list
            </AppText>
            {activeName ? (
              <AppText variant="bodySmall" color="mutedForeground">
                Currently packing for {formatPackingListProfileName(activeName.profileSnapshot)}
              </AppText>
            ) : null}
          </View>

          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {trip.packingLists.map((list) => (
              <PackingListOptionRow
                key={list.id}
                trip={trip}
                list={list}
                selected={list.id === selectedListId}
                onPress={() => {
                  onSelect(list.id);
                  onClose();
                }}
              />
            ))}
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
            <AppText variant="bodySmall" color="mutedForeground" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
              Cancel
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
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: screenPaddingHorizontal,
    maxHeight: '80%',
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
  header: {
    gap: 4,
    paddingBottom: 12,
  },
  list: {
    gap: 10,
    paddingBottom: 8,
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.9,
  },
});
