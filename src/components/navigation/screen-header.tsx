import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal } from '@/theme/spacing';

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  border?: boolean;
};

export function ScreenHeader({ title, onBack, border = false }: ScreenHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: Math.max(insets.top, theme.spacing.md),
          paddingHorizontal: screenPaddingHorizontal - 4,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: border ? StyleSheet.hairlineWidth : 0,
        },
      ]}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Feather name="chevron-left" size={24} color={theme.colors.foreground} />
        </Pressable>
      ) : (
        <View style={styles.backPlaceholder} />
      )}

      <AppText variant="bodySemiBold" style={styles.title} numberOfLines={1}>
        {title}
      </AppText>

      <View style={styles.backPlaceholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
  },
  backPlaceholder: {
    width: 36,
    height: 36,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
