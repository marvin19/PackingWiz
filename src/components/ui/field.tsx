import type { ReactNode } from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';

type FieldProps = {
  label: string;
  required?: boolean;
  children: ReactNode;
};

export function Field({ label, required = false, children }: FieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={required ? `${label}, required` : label}>
        <AppText variant="bodySmall" style={styles.label}>
          {label}
          {required ? (
            <AppText variant="bodySmall" style={{ color: theme.colors.destructive }}>
              {' *'}
            </AppText>
          ) : null}
        </AppText>
      </View>
      {children}
    </View>
  );
}

export type AppTextInputProps = TextInputProps & {
  focused?: boolean;
  /** When set, marks the input invalid and exposes the message as the accessibility hint. */
  errorMessage?: string;
};

export function AppTextInput({
  style,
  focused,
  errorMessage,
  accessibilityHint,
  ...rest
}: AppTextInputProps) {
  const theme = useTheme();
  const hasError = Boolean(errorMessage);

  return (
    <TextInput
      placeholderTextColor={theme.colors.mutedForeground}
      accessibilityHint={hasError ? errorMessage : accessibilityHint}
      style={[
        styles.input,
        {
          backgroundColor: theme.colors.card,
          borderColor: hasError
            ? theme.colors.destructive
            : focused
              ? theme.colors.primary
              : theme.colors.border,
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
