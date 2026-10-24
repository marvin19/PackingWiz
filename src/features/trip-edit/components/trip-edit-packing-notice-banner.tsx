import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import {
  TRIP_EDIT_PACKING_NOTICE_BODY,
  TRIP_EDIT_PACKING_NOTICE_TITLE,
} from '@/features/trip-edit/utils/edit-trip-view-model';
import { useTheme } from '@/hooks/use-theme';

export function TripEditPackingNoticeBanner() {
  const theme = useTheme();
  const accessibilityLabel = `${TRIP_EDIT_PACKING_NOTICE_TITLE}. ${TRIP_EDIT_PACKING_NOTICE_BODY}`;

  return (
    <View
      testID="trip-edit-packing-notice-banner"
      style={[styles.banner, { backgroundColor: theme.colors.accent, borderColor: theme.colors.border }]}
      accessibilityRole="summary"
      accessibilityLiveRegion="polite"
      accessibilityLabel={accessibilityLabel}>
      <Feather
        name="info"
        size={20}
        color={theme.colors.primary}
        importantForAccessibility="no"
        accessibilityElementsHidden
      />
      <View style={styles.copyBlock}>
        <AppText
          variant="bodySmall"
          style={[styles.title, { fontFamily: theme.fontFamilies.sansSemiBold }]}
          testID="trip-edit-packing-notice-title">
          {TRIP_EDIT_PACKING_NOTICE_TITLE}
        </AppText>
        <AppText variant="bodySmall" style={styles.body} testID="trip-edit-packing-notice-body">
          {TRIP_EDIT_PACKING_NOTICE_BODY}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  copyBlock: {
    flex: 1,
    flexShrink: 1,
    gap: 4,
  },
  title: {
    lineHeight: 20,
  },
  body: {
    lineHeight: 20,
  },
});
