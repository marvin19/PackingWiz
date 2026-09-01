import { Feather } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import type { PackingFilter } from '@/features/packing/utils/group-items';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal } from '@/theme/spacing';

type PackFilterSheetProps = {
  visible: boolean;
  activeFilter: PackingFilter;
  todoCount: number;
  buyCount: number;
  onSelect: (filter: PackingFilter) => void;
  onClose: () => void;
};

type FilterOption = {
  id: PackingFilter;
  label: string;
  detail?: string;
};

export function PackFilterSheet({
  visible,
  activeFilter,
  todoCount,
  buyCount,
  onSelect,
  onClose,
}: PackFilterSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const options: FilterOption[] = [
    { id: 'all', label: 'All' },
    { id: 'todo', label: 'To pack', detail: String(todoCount) },
    { id: 'buy', label: 'Shopping', detail: String(buyCount) },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close filter menu" onPress={onClose} style={styles.scrim} />
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
            Filter list
          </AppText>

          {options.map((option) => {
            const selected = activeFilter === option.id;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={
                  option.detail !== undefined ? `${option.label}, ${option.detail} items` : option.label
                }
                onPress={() => {
                  onSelect(option.id);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.optionRow,
                  {
                    backgroundColor: selected ? theme.colors.accent : theme.colors.card,
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}>
                <AppText variant="bodySmall" style={{ flex: 1, fontFamily: theme.fontFamilies.sansSemiBold }}>
                  {option.label}
                </AppText>
                {option.detail !== undefined ? (
                  <AppText variant="caption" color="mutedForeground">
                    {option.detail}
                  </AppText>
                ) : null}
                {selected ? (
                  <Feather name="check" size={16} color={theme.colors.primary} accessibilityElementsHidden />
                ) : null}
              </Pressable>
            );
          })}

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
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    marginBottom: 8,
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
