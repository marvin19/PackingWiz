import { Tabs } from 'expo-router';

import { BottomTabBar } from '@/components/navigation/bottom-tab-bar';
import { colors } from '@/theme/colors';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Trips' }} />
      <Tabs.Screen name="pack" options={{ title: 'Pack' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
