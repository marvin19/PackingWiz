import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useTheme } from '@/hooks/use-theme';

type ImportantItemsEmptyCardProps = {
  onAdd: () => void;
  onDismiss: () => void;
};

export function ImportantItemsEmptyCard({ onAdd, onDismiss }: ImportantItemsEmptyCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: `${theme.colors.important}66`,
        },
      ]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: `${theme.colors.important}26` }]}>
          <Feather name="alert-triangle" size={18} color={theme.colors.important} />
        </View>
        <AppText
          variant="bodySemiBold"
          style={{ fontFamily: theme.fontFamilies.displayExtraBold, color: theme.colors.importantForeground }}>
          Important
        </AppText>
      </View>
      <AppText variant="bodySmall" color="mutedForeground" style={styles.body}>
        Add the personal things you never want to forget. They&apos;ll automatically be added to
        every future packing list, and you can manage them anytime from Profile.
      </AppText>
      <AppText variant="caption" color="mutedForeground" style={styles.examples}>
        e.g. important medication, house keys
      </AppText>
      <View style={styles.actions}>
        <PrimaryButton label="Add important items" onPress={onAdd} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Not now"
          onPress={onDismiss}
          style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}>
          <AppText variant="bodySmall" color="mutedForeground" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
            Not now
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    lineHeight: 20,
  },
  examples: {
    lineHeight: 16,
  },
  actions: {
    gap: 8,
    marginTop: 4,
  },
  secondaryAction: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  pressed: {
    opacity: 0.85,
  },
});
