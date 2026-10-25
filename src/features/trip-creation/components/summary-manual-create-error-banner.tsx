import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import {
  SUMMARY_MANUAL_CREATE_ERROR_BODY,
  SUMMARY_MANUAL_CREATE_ERROR_TITLE,
} from '@/features/trip-creation/constants/summary-manual-create-copy';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal } from '@/theme/spacing';

export function SummaryManualCreateErrorBanner() {
  const theme = useTheme();
  const accessibilityLabel = `${SUMMARY_MANUAL_CREATE_ERROR_TITLE}. ${SUMMARY_MANUAL_CREATE_ERROR_BODY}`;

  return (
    <View
      testID="summary-manual-create-error-banner"
      style={[
        styles.banner,
        {
          backgroundColor: `${theme.colors.destructive}14`,
          borderColor: `${theme.colors.destructive}33`,
        },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      accessibilityLabel={accessibilityLabel}>
      <Feather
        name="alert-circle"
        size={20}
        color={theme.colors.destructive}
        importantForAccessibility="no"
        accessibilityElementsHidden
      />
      <View style={styles.copyBlock}>
        <AppText
          variant="bodySmall"
          style={{ color: theme.colors.destructive, fontFamily: theme.fontFamilies.sansSemiBold }}
          testID="summary-manual-create-error-title">
          {SUMMARY_MANUAL_CREATE_ERROR_TITLE}
        </AppText>
        <AppText
          variant="bodySmall"
          style={{ color: theme.colors.destructive, lineHeight: 20 }}
          testID="summary-manual-create-error-body">
          {SUMMARY_MANUAL_CREATE_ERROR_BODY}
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
    marginHorizontal: screenPaddingHorizontal,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  copyBlock: {
    flex: 1,
    flexShrink: 1,
    gap: 4,
  },
});
