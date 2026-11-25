import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { formatDisplayDate, parseDate, toIsoDate } from '@/domain/dates';
import { startOfLocalCalendarDay } from '@/domain/new-trip-date-validation';
import { useTheme } from '@/hooks/use-theme';
import type { ColorToken } from '@/theme/colors';

type DateFieldProps = {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  required?: boolean;
};

function dateFieldControlAccessibilityLabel(
  label: string,
  value: string,
  required: boolean,
): string {
  const dateLabel = formatDisplayDate(value);
  return required ? `${label}, required, ${dateLabel}` : `${label}, ${dateLabel}`;
}

function DateFieldLabel({ label, required = false }: Pick<DateFieldProps, 'label' | 'required'>) {
  const theme = useTheme();

  return (
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
  );
}

function defaultPickerReferenceDate(minimumDate?: Date, maximumDate?: Date): Date {
  const today = startOfLocalCalendarDay(new Date());
  const candidate = minimumDate ? startOfLocalCalendarDay(minimumDate) : today;
  if (maximumDate && candidate.getTime() > maximumDate.getTime()) {
    return startOfLocalCalendarDay(maximumDate);
  }
  return candidate;
}

function shouldCommitPickerChange(event: DateTimePickerEvent, date: Date | undefined): date is Date {
  if (!date) {
    return false;
  }

  if (Platform.OS === 'android' && event.type === 'dismissed') {
    return false;
  }

  if (Platform.OS === 'ios' && event.type === 'dismissed') {
    return false;
  }

  return true;
}

export function DateField(props: DateFieldProps) {
  if (Platform.OS === 'web') {
    return <WebDateField {...props} />;
  }

  if (Platform.OS === 'ios') {
    return <IosDateField {...props} />;
  }

  return <AndroidDateField {...props} />;
}

function WebDateField({ label, value, onChange, minimumDate, maximumDate, required = false }: DateFieldProps) {
  const theme = useTheme();
  const onChangeRef = useRef(onChange);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const themeRef = useRef(theme);

  useEffect(() => {
    onChangeRef.current = onChange;
    themeRef.current = theme;
  }, [onChange, theme]);

  const attachInput = useCallback((host: ComponentRef<typeof View> | null) => {
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
      <DateFieldLabel label={label} required={required} />
      <View ref={attachInput} style={styles.webInputHost} accessibilityLabel={dateFieldControlAccessibilityLabel(label, value, required)} />
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

function IosDateField({ label, value, onChange, minimumDate, maximumDate, required = false }: DateFieldProps) {
  const theme = useTheme();
  const [emptyPickerVisible, setEmptyPickerVisible] = useState(false);

  const referenceDate = useMemo(
    () => defaultPickerReferenceDate(minimumDate, maximumDate),
    [maximumDate, minimumDate],
  );

  const pickerValue = useMemo(
    () => (value ? parseDate(value) : referenceDate),
    [referenceDate, value],
  );

  const handlePickerChange = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (!shouldCommitPickerChange(event, date)) {
        if (!value) {
          setEmptyPickerVisible(false);
        }
        return;
      }

      const iso = toIsoDate(date);
      if (iso !== value) {
        onChange(iso);
      }
      if (!value) {
        setEmptyPickerVisible(false);
      }
    },
    [onChange, value],
  );

  if (!value) {
    return (
      <View style={styles.wrap}>
        <DateFieldLabel label={label} required={required} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={dateFieldControlAccessibilityLabel(label, value, required)}
          onPress={() => setEmptyPickerVisible(true)}
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
            color="mutedForeground"
            style={{ fontFamily: theme.fontFamilies.sans }}>
            {formatDisplayDate(value)}
          </AppText>
          <Feather name="calendar" size={18} color={theme.colors.mutedForeground} />
        </Pressable>
        {emptyPickerVisible ? (
          <DateTimePicker
            value={pickerValue}
            mode="date"
            display="spinner"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            accentColor={theme.colors.primary}
            themeVariant="light"
            onChange={handlePickerChange}
          />
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <DateFieldLabel label={label} required={required} />
      <View
        accessibilityLabel={dateFieldControlAccessibilityLabel(label, value, required)}
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
          onChange={handlePickerChange}
          style={styles.iosCompactPicker}
        />
      </View>
    </View>
  );
}

function AndroidDateField({ label, value, onChange, minimumDate, maximumDate, required = false }: DateFieldProps) {
  const theme = useTheme();

  const referenceDate = useMemo(
    () => defaultPickerReferenceDate(minimumDate, maximumDate),
    [maximumDate, minimumDate],
  );

  const pickerValue = useMemo(
    () => (value ? parseDate(value) : referenceDate),
    [referenceDate, value],
  );

  const openPicker = useCallback(() => {
    DateTimePickerAndroid.open({
      value: pickerValue,
      mode: 'date',
      minimumDate,
      maximumDate,
      onChange: (event, date) => {
        if (!shouldCommitPickerChange(event, date)) {
          return;
        }
        const iso = toIsoDate(date);
        if (iso !== value) {
          onChange(iso);
        }
      },
    });
  }, [maximumDate, minimumDate, onChange, pickerValue, value]);

  return (
    <View style={styles.wrap}>
      <DateFieldLabel label={label} required={required} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={dateFieldControlAccessibilityLabel(label, value, required)}
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