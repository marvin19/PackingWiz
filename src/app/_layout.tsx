import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

import { AppProviders } from '@/providers/app-providers';
import { fontAssets } from '@/theme/fonts';
import { colors } from '@/theme/colors';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AppProviders>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="trip/create" />
        <Stack.Screen name="trip/edit" />
        <Stack.Screen name="trip/edit-section" />
        <Stack.Screen name="trip/summary" />
        <Stack.Screen name="trip/generating" />
        <Stack.Screen name="trip/drafts" />
        <Stack.Screen name="trip/browse" />
        <Stack.Screen name="trip/archive" />
      </Stack>
    </AppProviders>
  );
}
