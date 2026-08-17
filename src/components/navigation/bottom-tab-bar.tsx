import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';

type BottomTabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>['tabBar']>
>[0];

type TabDefinition = {
  routeName: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
};

const TABS: TabDefinition[] = [
  { routeName: 'index', label: 'Trips', icon: 'briefcase' },
  { routeName: 'pack', label: 'Pack', icon: 'package' },
  { routeName: 'profile', label: 'Profile', icon: 'user' },
];

export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          paddingBottom: Math.max(insets.bottom, theme.spacing.sm),
        },
      ]}>
      {state.routes.map((route, index) => {
        const tab = TABS.find((entry) => entry.routeName === route.name) ?? TABS[0];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={tab.label}
            onPress={onPress}
            style={styles.tab}>
            <View
              style={[
                styles.iconPill,
                isFocused && { backgroundColor: theme.colors.accent },
              ]}>
              <Feather
                name={tab.icon}
                size={22}
                color={isFocused ? theme.colors.primary : theme.colors.mutedForeground}
              />
            </View>
            <AppText
              variant="micro"
              color={isFocused ? 'foreground' : 'mutedForeground'}
              style={styles.label}>
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  iconPill: {
    width: 56,
    height: 32,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
  },
});
