import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { formatImportantUpdatedSentence } from '@/domain/dates';
import { useTheme } from '@/hooks/use-theme';

type ImportantSnapshotNoticeProps = {
  profileLabel?: string;
  updatedAt?: string;
  onUpdate: () => void;
  onKeepCurrent: () => void;
};

export function ImportantSnapshotNotice({
  profileLabel,
  updatedAt,
  onUpdate,
  onKeepCurrent,
}: ImportantSnapshotNoticeProps) {
  const theme = useTheme();
  const bodyCopy = updatedAt
    ? formatImportantUpdatedSentence(updatedAt)
    : 'Your saved Important list has been updated since this packing list was created.';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: `${theme.colors.important}14`,
          borderColor: `${theme.colors.important}55`,
        },
      ]}>
      <View style={styles.titleRow}>
        <Feather name="alert-triangle" size={16} color={theme.colors.important} />
        <AppText
          variant="bodySmall"
          style={{ fontFamily: theme.fontFamilies.displayExtraBold, color: theme.colors.importantForeground }}>
          {profileLabel ? `Important for ${profileLabel} has changed` : 'Your Important items have changed'}
        </AppText>
      </View>
      <AppText variant="caption" color="mutedForeground" style={styles.body}>
        {bodyCopy}
      </AppText>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Update this list"
          onPress={onUpdate}
          style={({ pressed }) => [
            styles.primaryAction,
            { backgroundColor: theme.colors.important },
            pressed && styles.pressed,
          ]}>
          <AppText variant="caption" color="primaryForeground" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
            Update this list
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Keep current list"
          onPress={onKeepCurrent}
          style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}>
          <AppText variant="caption" color="mutedForeground" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
            Keep current list
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  body: {
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  primaryAction: {
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryAction: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  pressed: {
    opacity: 0.85,
  },
});
