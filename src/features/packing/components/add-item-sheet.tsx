import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTextInput } from '@/components/ui/field';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { PACKING_CATEGORY_ORDER, type PackingCategory } from '@/domain/packing-item';
import { useTrips } from '@/hooks/use-trips';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal } from '@/theme/spacing';

type AddItemSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export function AddItemSheet({ visible, onClose }: AddItemSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { addPackingItem, activeTrip } = useTrips();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PackingCategory>('Essentials');
  const [needToBuy, setNeedToBuy] = useState(false);
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const travelers = activeTrip?.travelers ?? [];
  const showAssign = travelers.length > 1;

  const reset = () => {
    setName('');
    setCategory('Essentials');
    setNeedToBuy(false);
    setAssignedTo(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    addPackingItem({ name: trimmed, category, needToBuy, assignedTo: showAssign ? assignedTo : null });
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close add item" onPress={handleClose} style={styles.scrim} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
              paddingBottom: Math.max(insets.bottom, theme.spacing.base),
            },
          ]}>
          <View style={styles.sheetHeader}>
            <AppText variant="bodySemiBold">Add an item</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel adding item"
              onPress={handleClose}
              style={[styles.closeButton, { backgroundColor: theme.colors.muted }]}>
              <Feather name="x" size={16} color={theme.colors.foreground} />
            </Pressable>
          </View>

          <AppTextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Reusable water bottle"
            autoFocus
            focused={focused}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {PACKING_CATEGORY_ORDER.map((entry) => {
              const selected = entry === category;
              return (
                <Pressable
                  key={entry}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setCategory(entry)}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: selected ? theme.colors.primary : theme.colors.card,
                      borderColor: selected ? theme.colors.primary : theme.colors.border,
                    },
                  ]}>
                  <AppText
                    variant="caption"
                    style={{
                      fontFamily: theme.fontFamilies.sansMedium,
                      color: selected ? theme.colors.primaryForeground : theme.colors.foreground,
                    }}>
                    {entry}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>

          {showAssign ? (
            <View style={styles.assignBlock}>
              <AppText variant="sectionLabel" color="mutedForeground">
                Assign to
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: assignedTo === null }}
                  onPress={() => setAssignedTo(null)}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: assignedTo === null ? theme.colors.primary : theme.colors.card,
                      borderColor: assignedTo === null ? theme.colors.primary : theme.colors.border,
                    },
                  ]}>
                  <AppText
                    variant="caption"
                    style={{
                      fontFamily: theme.fontFamilies.sansMedium,
                      color: assignedTo === null ? theme.colors.primaryForeground : theme.colors.foreground,
                    }}>
                    Everyone
                  </AppText>
                </Pressable>
                {travelers.map((traveler) => {
                  const selected = assignedTo === traveler.id;
                  return (
                    <Pressable
                      key={traveler.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setAssignedTo(traveler.id)}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: selected ? theme.colors.primary : theme.colors.card,
                          borderColor: selected ? theme.colors.primary : theme.colors.border,
                        },
                      ]}>
                      <AppText
                        variant="caption"
                        style={{
                          fontFamily: theme.fontFamilies.sansMedium,
                          color: selected ? theme.colors.primaryForeground : theme.colors.foreground,
                        }}>
                        {traveler.name}
                      </AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: needToBuy }}
            accessibilityLabel="Need to buy"
            onPress={() => setNeedToBuy((current) => !current)}
            style={[
              styles.toggleRow,
              {
                backgroundColor: needToBuy ? `${theme.colors.buy}26` : theme.colors.muted,
                borderColor: theme.colors.border,
              },
            ]}>
            <Feather name="shopping-bag" size={16} color={theme.colors.buyForeground} />
            <AppText variant="bodySmall" style={{ fontFamily: theme.fontFamilies.sansMedium }}>
              Need to buy
            </AppText>
          </Pressable>

          <PrimaryButton label="Add to list" disabled={!name.trim()} onPress={handleSubmit} />
        </View>
      </KeyboardAvoidingView>
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
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryRow: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  assignBlock: {
    gap: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
