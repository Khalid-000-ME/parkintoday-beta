"use client"

import { useCallback } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import {
  useFonts as useSpaceGrotesk,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_600SemiBold,
} from "@expo-google-fonts/space-grotesk"
import { useFonts as useInstrumentSerif, InstrumentSerif_400Regular } from "@expo-google-fonts/instrument-serif"
import { View, ActivityIndicator } from "react-native"
import { StatusBar } from "expo-status-bar"
import MainScreen from "./src/screens/MainScreen"
import UpiScreen from "./src/screens/UpiScreen"

const Stack = createNativeStackNavigator()

export default function App() {
  const [sgLoaded] = useSpaceGrotesk({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_600SemiBold,
  })
  const [isLoaded] = useInstrumentSerif({
    InstrumentSerif_400Regular,
  })

  const ready = sgLoaded && isLoaded

  const Loading = useCallback(
    () => (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#10b981" />
        <StatusBar style="auto" />
      </View>
    ),
    [],
  )

  if (!ready) return <Loading />

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName="Main"
        screenOptions={{
          headerTitleStyle: { fontFamily: "InstrumentSerif_400Regular" },
          headerTintColor: "#0f172a",
          headerStyle: { backgroundColor: "#ffffff" },
        }}
      >
        <Stack.Screen name="Main" component={MainScreen} options={{ title: "Find Parking" }} />
        <Stack.Screen name="UPI" component={UpiScreen} options={{ title: "UPI Payment" }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
