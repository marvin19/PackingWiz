import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type View as ViewType,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { formatDisplayDate, parseDate, toIsoDate } from '@/domain/dates';
import { useTheme } from '@/hooks/use-theme';
import type { ColorToken } from '@/theme/colors';

type DateFieldProps = {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  minimumDate?: Date;
  maximumDate?: Date;
};

export function DateField(props: DateFieldProps) {
  if (Platform.OS === 'web') {
    return <WebDateField {...props} />;
  }

  if (Platform.OS === 'ios') {
    return <IosDateField {...props} />;
  }

  return <AndroidDateField {...props} />;
}

function WebDateField({ label, value, onChange, minimumDate, maximumDate }: DateFieldProps) {
  const theme = useTheme();
  const onChangeRef = useRef(onChange);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const themeRef = useRef(theme);

  useEffect(() => {
    onChangeRef.current = onChange;
    themeRef.current = theme;
  }, [onChange, theme]);

  const attachInput = useCallback((host: ViewType | null) => {
    if (!host) {
      inputRef.current?.remove();
      inputRef.current = null;
      return;
    }

    const element = host as unknown as HTMLElement;
    if (inputRef.current?.parentElement === element) {
      return;
    }

    inputRef.current?.remove();

    const input = document.createElement('input');
    input.type = 'date';
    applyWebInputTheme(input, themeRef.current.colors);

    input.addEventListener('change', () => {
      if (input.value) {
        onChangeRef.current(input.value);
      }
    });

    element.appendChild(input);
    inputRef.current = input;
  }, []);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    applyWebInputTheme(input, theme.colors);
    input.value = value || '';

    if (minimumDate) {
      input.min = toIsoDate(minimumDate);
    } else {
      input.removeAttribute('min');
    }

    if (maximumDate) {
      input.max = toIsoDate(maximumDate);
    } else {
      input.removeAttribute('max');
    }
  }, [maximumDate, minimumDate, theme.colors, value]);

  return (
    <View style={styles.wrap}>
      <AppText variant="bodySmall" style={styles.label}>
        {label}
      </AppText>
      <View ref={attachInput} style={styles.webInputHost} />
    </View>
  );
}

function applyWebInputTheme(input: HTMLInputElement, colors: Record<ColorToken, string>) {
  Object.assign(input.style, {
    boxSizing: 'border-box',
    width: '100%',
    minHeight: '48px',
    borderRadius: '16px',
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.card,
    padding: '12px 14px',
    fontSize: '14px',
    lineHeight: '20px',
    fontFamily: 'Inter, system-ui, sans-serif',
    color: colors.foreground,
    colorScheme: 'light',
    cursor: 'pointer',
  } as Partial<CSSStyleDeclaration>);
}

function IosDateField({ label, value, onChange, minimumDate, maximumDate }: DateFieldProps) {
  const theme = useTheme();
  const pickerValue = useMemo(
    () => (value ? parseDate(value) : new Date()),
    [value],
  );

  return (
    <View style={styles.wrap}>
      <AppText variant="bodySmall" style={styles.label}>
        {label}
      </AppText>
      <View
        style={[
          styles.iosPickerShell,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}>
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display="compact"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          accentColor={theme.colors.primary}
          themeVariant="light"
          onValueChange={(_event, date) => onChange(toIsoDate(date))}
          style={styles.iosCompactPicker}
        />
      </View>
    </View>
  );
}

function AndroidDateField({ label, value, onChange, minimumDate, maximumDate }: DateFieldProps) {
  const theme = useTheme();

  const pickerValue = useMemo(
    () => (value ? parseDate(value) : new Date()),
    [value],
  );

  const openPicker = useCallback(() => {
    DateTimePickerAndroid.open({
      value: pickerValue,
      mode: 'date',
      minimumDate,
      maximumDate,
      onValueChange: (_event, date) => {
        onChange(toIsoDate(date));
      },
    });
  }, [maximumDate, minimumDate, onChange, pickerValue]);

  return (
    <View style={styles.wrap}>
      <AppText variant="bodySmall" style={styles.label}>
        {label}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${formatDisplayDate(value)}`}
        onPress={openPicker}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
          pressed && styles.pressed,
        ]}>
        <AppText
          variant="bodySmall"
          color={value ? 'foreground' : 'mutedForeground'}
          style={{ fontFamily: theme.fontFamilies.sans }}>
          {formatDisplayDate(value)}
        </AppText>
        <Feather name="calendar" size={18} color={theme.colors.mutedForeground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  label: {
    paddingHorizontal: 4,
    fontFamily: 'Inter_600SemiBold',
  },
  webInputHost: {
    width: '100%',
    minHeight: 48,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  pressed: {
    opacity: 0.95,
  },
  iosPickerShell: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  iosCompactPicker: {
    alignSelf: 'flex-start',
  },
});
