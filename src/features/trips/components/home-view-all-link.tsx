import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { HOME_VIEW_ALL_LINK_SPACING } from '@/features/trips/utils/home-screen-spacing';
import { useTheme } from '@/hooks/use-theme';

export const MANAGE_ALL_TRIPS_LABEL = 'Manage all trips';
export const MANAGE_ALL_TRIPS_ACCESSIBILITY_LABEL = 'Manage all trips';

/** @deprecated Use MANAGE_ALL_TRIPS_LABEL */
export const VIEW_ALL_TRIPS_LABEL = MANAGE_ALL_TRIPS_LABEL;

/** @deprecated Use MANAGE_ALL_TRIPS_ACCESSIBILITY_LABEL */
export const VIEW_ALL_TRIPS_ACCESSIBILITY_LABEL = MANAGE_ALL_TRIPS_ACCESSIBILITY_LABEL;

type HomeViewAllLinkProps = {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  /** When true, adds compact top spacing after related cards. */
  contextual?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

export function HomeViewAllLink({
  label,
  accessibilityLabel,
  onPress,
  contextual = false,
  containerStyle,
}: HomeViewAllLinkProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        contextual ? styles.contextualContainer : null,
        containerStyle,
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [
          styles.link,
          {
            backgroundColor: theme.colors.accent,
            borderColor: theme.colors.primary,
            opacity: pressed ? 0.9 : 1,
          },
        ]}>
        <AppText
          variant="bodySmall"
          color="primary"
          numberOfLines={1}
          style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
          {label}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  contextualContainer: {
    marginTop: HOME_VIEW_ALL_LINK_SPACING,
  },
  link: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
