import type { ReactNode } from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';

type FieldProps = {
  label: string;
  children: ReactNode;
};

export function Field({ label, children }: FieldProps) {
  return (
    <View style={styles.field}>
      <AppText variant="bodySmall" style={styles.label}>
        {label}
      </AppText>
      {children}
    </View>
  );
}

export type AppTextInputProps = TextInputProps & {
  focused?: boolean;
};

export function AppTextInput({ style, focused, ...rest }: AppTextInputProps) {
  const theme = useTheme();

  return (
    <TextInput
      placeholderTextColor={theme.colors.mutedForeground}
      style={[
        styles.input,
        {
          backgroundColor: theme.colors.card,
          borderColor: focused ? theme.colors.primary : theme.colors.border,
          color: theme.colors.foreground,
          fontFamily: theme.fontFamilies.sans,
        },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    paddingHorizontal: 4,
    fontFamily: 'Inter_600SemiBold',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    lineHeight: 20,
  },
});
