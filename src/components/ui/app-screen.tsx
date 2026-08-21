import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import type { ColorToken } from '@/theme/colors';

export type AppScreenProps = ViewProps & {
  backgroundColor?: ColorToken;
};

export function AppScreen({
  backgroundColor = 'background',
  style,
  ...rest
}: AppScreenProps) {
  const theme = useTheme();

  return (
    <View
      style={[styles.screen, { backgroundColor: theme.colors[backgroundColor] }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
