import { Stack, router } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  InstrumentSerif_400Regular,
} from '@expo-google-fonts/instrument-serif';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_600SemiBold,
} from '@expo-google-fonts/space-grotesk';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    InstrumentSerif_400Regular,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_600SemiBold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
      checkConfiguration();
    }
  }, [loaded, error]);

  const checkConfiguration = async () => {
    try {
      const url = await AsyncStorage.getItem('ngrok_url');
      if (!url) {
        router.replace('/config');
        return;
      }

      const user = await AsyncStorage.getItem('user_id');
      if (!user) {
        router.replace('/onboarding');
        return;
      }
    } catch (e) {
      console.error("Error checking config", e);
    }
  };

  if (!loaded && !error) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Nearby Parking',
          headerShown: false
        }}
      />
      <Stack.Screen
        name="upi"
        options={{
          title: 'Confirm Parking',
          presentation: 'card'
        }}
      />
      <Stack.Screen
        name="config"
        options={{
          title: 'Setup',
          headerShown: false,
          gestureEnabled: false
        }}
      />
      <Stack.Screen
        name="onboarding"
        options={{
          title: 'Welcome',
          headerShown: false,
          gestureEnabled: false
        }}
      />
    </Stack>
  );
}
