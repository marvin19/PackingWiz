import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { AppScreen } from '@/components/ui/app-screen';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal } from '@/theme/spacing';

type PlaceholderScreenProps = {
  title: string;
  description?: string;
  footer?: ReactNode;
  /** When true, omits outer screen wrapper and top safe-area padding (for use under ScreenHeader). */
  embedded?: boolean;
};

export function PlaceholderScreen({
  title,
  description,
  footer,
  embedded = false,
}: PlaceholderScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const content = (
    <View
      style={[
        styles.container,
        {
          paddingTop: embedded ? theme.spacing.base : Math.max(insets.top, theme.spacing.base),
          paddingBottom: Math.max(insets.bottom, theme.spacing.base),
          paddingHorizontal: screenPaddingHorizontal,
        },
      ]}>
      <AppText variant="heading" style={styles.title}>
        {title}
      </AppText>
      {description ? (
        <AppText variant="bodySmall" color="mutedForeground" style={styles.description}>
          {description}
        </AppText>
      ) : null}
      {footer}
    </View>
  );

  if (embedded) {
    return content;
  }

  return <AppScreen>{content}</AppScreen>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    marginBottom: 8,
  },
  description: {
    lineHeight: 22,
  },
});
