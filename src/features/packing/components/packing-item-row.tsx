import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { PackingItem } from '@/domain/packing-item';
import type { Traveler } from '@/domain/traveler';
import { useTheme } from '@/hooks/use-theme';

export type PackingCheckboxIntent = 'packed' | 'purchased';

type PackingItemRowProps = {
  item: PackingItem;
  travelers: Traveler[];
  checkboxIntent: PackingCheckboxIntent;
  onCheckboxPress: (itemId: string) => void;
  onOpenSettings: (itemId: string) => void;
};

export function PackingItemRow({
  item,
  travelers,
  checkboxIntent,
  onCheckboxPress,
  onOpenSettings,
}: PackingItemRowProps) {
  const theme = useTheme();

  const assigned = travelers.find((traveler) => traveler.id === item.assignedTo);
  const isPurchasedIntent = checkboxIntent === 'purchased';
  const checkboxChecked = isPurchasedIntent ? false : item.packed;
  const checkboxLabel = isPurchasedIntent
    ? `Mark ${item.name} as purchased`
    : item.packed
      ? `Mark ${item.name} as not packed`
      : `Mark ${item.name} as packed`;
  const personalNote = item.note?.trim();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: item.packed ? theme.colors.muted : theme.colors.card,
          borderColor: item.source === 'important' ? `${theme.colors.important}66` : theme.colors.border,
          opacity: item.packed ? 0.92 : 1,
        },
      ]}>
      <View style={styles.mainRow}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel={checkboxLabel}
          accessibilityState={{ checked: checkboxChecked }}
          onPress={() => onCheckboxPress(item.id)}
          style={[
            styles.checkButton,
            {
              borderColor: checkboxChecked ? theme.colors.success : theme.colors.border,
              backgroundColor: checkboxChecked ? theme.colors.success : theme.colors.card,
            },
          ]}>
          {checkboxChecked ? (
            <Feather name="check" size={16} color={theme.colors.primaryForeground} />
          ) : null}
        </Pressable>

        <View style={styles.nameBlock}>
          <AppText
            variant="bodySmall"
            style={[
              styles.titleText,
              {
                fontFamily: theme.fontFamilies.sansMedium,
                color: item.packed ? theme.colors.mutedForeground : theme.colors.foreground,
                textDecorationLine: item.packed ? 'line-through' : 'none',
              },
            ]}>
            {item.name}
            {item.quantity > 1 ? (
              <AppText variant="caption" color="mutedForeground" style={styles.quantitySuffix}>
                {` · ×${item.quantity}`}
              </AppText>
            ) : null}
          </AppText>

          {(item.source === 'important' || item.needToBuy || assigned) ? (
            <View style={styles.metaRow}>
              {item.source === 'important' ? (
                <View style={[styles.importantBadge, { backgroundColor: `${theme.colors.important}26` }]}>
                  <Feather name="alert-triangle" size={11} color={theme.colors.important} />
                  <AppText variant="micro" style={{ color: theme.colors.importantForeground, fontFamily: theme.fontFamilies.sansSemiBold }}>
                    Important
                  </AppText>
                </View>
              ) : null}
              {item.needToBuy ? (
                <View style={[styles.buyBadge, { backgroundColor: `${theme.colors.buy}26` }]}>
                  <Feather name="shopping-bag" size={11} color={theme.colors.buyForeground} />
                  <AppText variant="micro" style={{ color: theme.colors.buyForeground, fontFamily: theme.fontFamilies.sansSemiBold }}>
                    Buy
                  </AppText>
                </View>
              ) : null}
              {assigned ? (
                <View style={[styles.ownerBadge, { backgroundColor: theme.colors.secondary }]}>
                  <AppText variant="micro" color="secondaryForeground" style={{ fontFamily: theme.fontFamilies.sansMedium }}>
                    {assigned.name}
                  </AppText>
                </View>
              ) : null}
            </View>
          ) : null}

          {personalNote ? (
            <View style={styles.personalNoteRow}>
              <Feather
                name="file-text"
                size={11}
                color={theme.colors.mutedForeground}
                style={styles.personalNoteIcon}
              />
              <AppText
                variant="caption"
                color="mutedForeground"
                numberOfLines={2}
                ellipsizeMode="tail"
                style={styles.personalNoteText}>
                {personalNote}
              </AppText>
            </View>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Packing item settings for ${item.name}`}
          onPress={() => onOpenSettings(item.id)}
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: theme.colors.muted, opacity: pressed ? 0.85 : 1 },
          ]}>
          <Feather name="more-horizontal" size={18} color={theme.colors.foreground} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  checkButton: {
    width: 28,
    height: 28,
    borderRadius: 9999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  nameBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titleText: {
    flexShrink: 1,
  },
  quantitySuffix: {
    fontFamily: 'Inter_500Medium',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  personalNoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: 4,
  },
  personalNoteIcon: {
    marginTop: 2,
    flexShrink: 0,
    opacity: 0.85,
  },
  personalNoteText: {
    flex: 1,
    minWidth: 0,
    lineHeight: 18,
  },
  buyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 9999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  importantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 9999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ownerBadge: {
    borderRadius: 9999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
