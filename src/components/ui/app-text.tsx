import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import type { ColorToken } from '@/theme/colors';
import type { TypographyToken } from '@/theme/typography';

export type AppTextProps = TextProps & {
  variant?: TypographyToken;
  color?: ColorToken;
};

export function AppText({
  variant = 'body',
  color = 'foreground',
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[theme.typography[variant] as TextStyle, { color: theme.colors[color] }, style]}
      {...rest}
    />
  );
}

export const textStyles = StyleSheet.create({});
