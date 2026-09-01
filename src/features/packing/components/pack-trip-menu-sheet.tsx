import type { ReactNode } from 'react';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import type { PackingFilter } from '@/features/packing/utils/group-items';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal } from '@/theme/spacing';

export type PackTripMenuAction = 'back-to-trips' | 'filter' | 'insights' | 'edit-trip';

type PackTripMenuButtonProps = {
  onPress: () => void;
};

export function PackTripMenuButton({ onPress }: PackTripMenuButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Trip menu"
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuButton,
        {
          backgroundColor: theme.colors.muted,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}>
      <AppText
        variant="caption"
        style={{
          fontFamily: theme.fontFamilies.sansSemiBold,
          color: theme.colors.mutedForeground,
        }}>
        Trip menu
      </AppText>
      <Feather name="more-horizontal" size={16} color={theme.colors.mutedForeground} />
    </Pressable>
  );
}

type PackTripMenuSheetProps = {
  visible: boolean;
  activeFilter: PackingFilter;
  onSelect: (action: PackTripMenuAction) => void;
  onClose: () => void;
};

function packFilterMenuIndicator(activeFilter: PackingFilter): string | null {
  if (activeFilter === 'all') {
    return null;
  }

  return '· 1';
}

type MenuRow = {
  action: PackTripMenuAction;
  label: string;
  accessibilityLabel: string;
  icon: ReactNode;
  trailing?: string | null;
};

export function PackTripMenuSheet({
  visible,
  activeFilter,
  onSelect,
  onClose,
}: PackTripMenuSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const filterIndicator = packFilterMenuIndicator(activeFilter);

  const rows: MenuRow[] = [
    {
      action: 'back-to-trips',
      label: 'Back to all trips',
      accessibilityLabel: 'Back to all trips',
      icon: <Feather name="briefcase" size={18} color={theme.colors.primary} />,
    },
    {
      action: 'filter',
      label: 'Filter',
      accessibilityLabel:
        activeFilter === 'all'
          ? 'Filter'
          : `Filter, ${activeFilter === 'todo' ? 'To pack' : 'Shopping'} active`,
      icon: <Feather name="sliders" size={18} color={theme.colors.primary} />,
      trailing: filterIndicator,
    },
    {
      action: 'insights',
      label: 'Insights',
      accessibilityLabel: 'Insights',
      icon: <Ionicons name="bulb-outline" size={18} color={theme.colors.primary} />,
    },
    {
      action: 'edit-trip',
      label: 'Edit trip',
      accessibilityLabel: 'Edit trip',
      icon: <Feather name="edit-2" size={18} color={theme.colors.primary} />,
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close trip menu"
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
            Trip menu
          </AppText>

          {rows.map((row) => (
            <Pressable
              key={row.action}
              accessibilityRole="button"
              accessibilityLabel={row.accessibilityLabel}
              onPress={() => {
                onClose();
                onSelect(row.action);
              }}
              style={({ pressed }) => [
                styles.optionRow,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}>
              <View style={[styles.iconWrap, { backgroundColor: theme.colors.accent }]}>{row.icon}</View>
              <AppText variant="bodySmall" style={{ flex: 1, fontFamily: theme.fontFamilies.sansSemiBold }}>
                {row.label}
              </AppText>
              {row.trailing ? (
                <AppText variant="caption" color="primary" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
                  {row.trailing}
                </AppText>
              ) : null}
              <Feather name="chevron-right" size={16} color={theme.colors.mutedForeground} accessibilityElementsHidden />
            </Pressable>
          ))}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close trip menu"
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
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minHeight: 32,
    justifyContent: 'center',
    flexShrink: 0,
  },
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
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    marginBottom: 8,
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
