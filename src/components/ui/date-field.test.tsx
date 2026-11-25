import React from 'react';
import { Platform } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';

import { DateField } from '@/components/ui/date-field';

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('@/hooks/use-theme', () => {
  const { theme } = jest.requireActual('@/theme') as typeof import('@/theme');
  return { useTheme: () => theme };
});

const mockDateTimePicker = jest.fn((props: Record<string, unknown>) => null);

jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => mockDateTimePicker(props),
  DateTimePickerAndroid: {
    open: jest.fn(),
  },
}));

describe('DateField', () => {
  const originalPlatform = Platform.OS;

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
    mockDateTimePicker.mockClear();
  });

  it('on iOS with empty value shows Select date and does not mount compact picker', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });

  let tree: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      tree = TestRenderer.create(
        <DateField label="Return" value="" onChange={jest.fn()} required />,
      );
    });

    expect(tree!.root.findByProps({ children: 'Select date' })).toBeTruthy();
    expect(mockDateTimePicker).not.toHaveBeenCalled();

    const button = tree!.root.findByProps({ accessibilityRole: 'button' });
    act(() => {
      button.props.onPress();
    });

    expect(mockDateTimePicker).toHaveBeenCalledWith(
      expect.objectContaining({ display: 'spinner' }),
    );
  });

  it('does not call onChange when iOS dismisses the picker without a commit', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });

    const onChange = jest.fn();
    let tree: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      tree = TestRenderer.create(
        <DateField label="Departure" value="" onChange={onChange} />,
      );
    });

    const button = tree!.root.findByProps({ accessibilityRole: 'button' });
    act(() => {
      button.props.onPress();
    });

    const pickerProps = mockDateTimePicker.mock.calls[0]![0] as {
      onChange: (event: { type: string }, date: Date) => void;
    };
    act(() => {
      pickerProps.onChange({ type: 'dismissed' }, new Date(2026, 10, 29));
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('commits a date when the user selects a value on iOS', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });

    const onChange = jest.fn();
    let tree: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      tree = TestRenderer.create(
        <DateField label="Departure" value="" onChange={onChange} />,
      );
    });

    act(() => {
      tree!.root.findByProps({ accessibilityRole: 'button' }).props.onPress();
    });

    const pickerProps = mockDateTimePicker.mock.calls[0]![0] as {
      onChange: (event: { type: string }, date: Date) => void;
    };
    act(() => {
      pickerProps.onChange({ type: 'set' }, new Date(2026, 10, 29));
    });

    expect(onChange).toHaveBeenCalledWith('2026-11-29');
  });

});