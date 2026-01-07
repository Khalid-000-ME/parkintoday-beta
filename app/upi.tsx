import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const COLORS = {
  bg: "#ffffff",
  text: "#0f172a",
  muted: "#6b7280",
  primary: "#10b981",
  success: "#22c55e",
  border: "#e5e7eb",
  razorpay: "#3395ff",
};

// Payment URLs
const INITIAL_PAYMENT_URL = "https://rzp.io/rzp/KCcEu6nd";
const FINAL_PAYMENT_URL = "https://rzp.io/rzp/CtOKslEs";

// Storage keys
const DEVICE_ID_KEY = "@device_id";
const PAYMENT_STATE_KEY = "@parking_payment_state";
const PAYMENT_TIMESTAMP_KEY = "@parking_payment_timestamp";

export default function UpiScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [paymentStep, setPaymentStep] = useState<"initial" | "confirmed" | "completed">("initial");
  const [isLoading, setIsLoading] = useState(true);
  const [deviceId, setDeviceId] = useState<string>("");
  const appState = useRef(AppState.currentState);

  const spot = params.spotId
    ? {
      id: params.spotId as string,
      name: params.spotName as string,
      occupied: params.spotOccupied === "true",
      temperature: parseInt(params.spotTemperature as string),
      humidity: parseInt(params.spotHumidity as string),
    }
    : null;

  // Initialize on mount
  useEffect(() => {
    initializeApp();
  }, []);

  // Monitor app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = async (nextAppState: any) => {
    if (appState.current.match(/inactive|background/) && nextAppState === "active") {
      // App has come to foreground - reload state
      console.log("App came to foreground, reloading state...");
      await loadPaymentState();
    }
    appState.current = nextAppState;
  };

  const initializeApp = async () => {
    try {
      // Get or create device ID
      let storedDeviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

      if (!storedDeviceId) {
        const uniqueId = `${Device.modelName}_${Device.osName}_${Date.now()}`;
        await AsyncStorage.setItem(DEVICE_ID_KEY, uniqueId);
        storedDeviceId = uniqueId;
      }

      setDeviceId(storedDeviceId);
      console.log("Device ID:", storedDeviceId);

      // Load payment state
      await loadPaymentState();
    } catch (error) {
      console.error("Error initializing app:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPaymentState = async () => {
    try {
      const savedState = await AsyncStorage.getItem(PAYMENT_STATE_KEY);
      const savedTimestamp = await AsyncStorage.getItem(PAYMENT_TIMESTAMP_KEY);

      console.log("Loaded state:", savedState);
      console.log("Loaded timestamp:", savedTimestamp);

      if (savedState) {
        setPaymentStep(savedState as "initial" | "confirmed" | "completed");

        // Check if we should auto-advance based on timestamp
        if (savedTimestamp) {
          const timestamp = parseInt(savedTimestamp);
          const now = Date.now();
          const timeDiff = now - timestamp;

          // If payment was initiated less than 5 minutes ago and we're back in the app
          // assume payment was successful
          if (timeDiff < 5 * 60 * 1000) {
            console.log(`Payment initiated ${Math.round(timeDiff / 1000)}s ago`);

            if (savedState === "initial" && timeDiff > 10000) {
              // If we're still in initial state but more than 10s have passed
              // the user likely completed the payment
              console.log("Auto-advancing to confirmed state");
              await savePaymentState("confirmed");
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading payment state:", error);
    }
  };

  const savePaymentState = async (state: "initial" | "confirmed" | "completed") => {
    try {
      await AsyncStorage.setItem(PAYMENT_STATE_KEY, state);
      await AsyncStorage.setItem(PAYMENT_TIMESTAMP_KEY, Date.now().toString());
      setPaymentStep(state);
      console.log(`Payment state saved: ${state}`);
    } catch (error) {
      console.error("Error saving payment state:", error);
    }
  };

  const clearPaymentState = async () => {
    try {
      await AsyncStorage.removeItem(PAYMENT_STATE_KEY);
      await AsyncStorage.removeItem(PAYMENT_TIMESTAMP_KEY);
      setPaymentStep("initial");
      console.log("Payment state cleared");
    } catch (error) {
      console.error("Error clearing payment state:", error);
    }
  };

  const handleBookParkingSlot = async () => {
    try {
      console.log("Opening initial payment URL...");

      // Save that we're starting the payment process
      await savePaymentState("initial");

      // Open the payment link
      await WebBrowser.openBrowserAsync(INITIAL_PAYMENT_URL);

      // When browser closes, show confirmation
      setTimeout(() => {
        Alert.alert(
          "Payment Confirmation",
          "Did you complete the payment successfully?",
          [
            {
              text: "No",
              style: "cancel",
              onPress: () => {
                // Keep in initial state
                console.log("User cancelled payment");
              }
            },
            {
              text: "Yes",
              onPress: async () => {
                await savePaymentState("confirmed");
              }
            }
          ]
        );
      }, 1000);
    } catch (error) {
      console.error("Error opening payment link:", error);
      Alert.alert("Error", "Failed to open payment link. Please try again.");
    }
  };

  const handleConfirmSlot = async () => {
    try {
      console.log("Opening final payment URL...");

      // Save current timestamp
      await AsyncStorage.setItem(PAYMENT_TIMESTAMP_KEY, Date.now().toString());

      // Open the payment link
      await WebBrowser.openBrowserAsync(FINAL_PAYMENT_URL);

      // When browser closes, show confirmation
      setTimeout(() => {
        Alert.alert(
          "Payment Confirmation",
          "Did you complete the final payment successfully?",
          [
            {
              text: "No",
              style: "cancel",
              onPress: () => {
                console.log("User cancelled final payment");
              }
            },
            {
              text: "Yes",
              onPress: async () => {
                await savePaymentState("completed");
              }
            }
          ]
        );
      }, 1000);
    } catch (error) {
      console.error("Error opening payment link:", error);
      Alert.alert("Error", "Failed to open payment link. Please try again.");
    }
  };

  const handleBackToMap = () => {
    clearPaymentState();
    router.back();
  };

  const handleManualRefresh = async () => {
    setIsLoading(true);
    await loadPaymentState();
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={styles.muted}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.h1}>Parking Slot Booking</Text>
        <Pressable onPress={handleManualRefresh} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>🔄</Text>
        </Pressable>
      </View>

      {/* Debug Info */}
      {__DEV__ && (
        <View style={styles.debugBox}>
          <Text style={styles.debugText}>Device ID: {deviceId.substring(0, 30)}...</Text>
          <Text style={styles.debugText}>Payment Step: {paymentStep}</Text>
          <Pressable onPress={handleManualRefresh} style={styles.debugBtn}>
            <Text style={styles.debugBtnText}>Refresh State</Text>
          </Pressable>
        </View>
      )}

      {spot ? (
        <>
          <Text style={styles.row}>
            <Text style={styles.label}>Spot:</Text> {spot.name}
          </Text>
          <Text style={styles.row}>
            <Text style={styles.label}>Availability:</Text>{" "}
            {spot.occupied ? "Occupied" : "Available"}
          </Text>
          <Text style={styles.row}>
            <Text style={styles.label}>Temp:</Text> {spot.temperature}°C
          </Text>
          <Text style={styles.row}>
            <Text style={styles.label}>Humidity:</Text> {spot.humidity}%
          </Text>
        </>
      ) : (
        <Text style={styles.muted}>No spot selected.</Text>
      )}

      <View style={{ height: 24 }} />

      {/* Initial State - Book Parking Slot */}
      {paymentStep === "initial" && (
        <>
          <Text style={styles.h2}>Ready to Book?</Text>
          <Text style={styles.description}>
            Click the button below to proceed with the initial payment for slot booking.
          </Text>
          <View style={{ height: 16 }} />

          <Pressable
            onPress={handleBookParkingSlot}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: COLORS.razorpay },
              pressed && styles.btnPressed
            ]}
          >
            <Text style={styles.btnText}>Book Parking Slot</Text>
          </Pressable>

          <View style={{ height: 16 }} />
          <Text style={styles.helpText}>
            💡 After completing payment, return to this screen and tap the refresh button (🔄) if the status doesn't update automatically.
          </Text>
        </>
      )}

      {/* After Initial Payment - Confirm Slot */}
      {paymentStep === "confirmed" && (
        <>
          <View style={styles.successBox}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successText}>
              Initial payment for slot booking done
            </Text>
          </View>

          <View style={{ height: 24 }} />

          <Text style={styles.h2}>Confirm Your Slot</Text>
          <Text style={styles.description}>
            Complete the final payment to confirm your parking slot.
          </Text>
          <View style={{ height: 16 }} />

          <Pressable
            onPress={handleConfirmSlot}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: COLORS.primary },
              pressed && styles.btnPressed
            ]}
          >
            <Text style={styles.btnText}>Confirm Slot</Text>
          </Pressable>

          <View style={{ height: 16 }} />
          <Text style={styles.helpText}>
            💡 After completing payment, return to this screen and tap the refresh button (🔄) if the status doesn't update automatically.
          </Text>
        </>
      )}

      {/* After Final Payment - Completed */}
      {paymentStep === "completed" && (
        <>
          <View style={styles.successBox}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successText}>
              Actual payment is done
            </Text>
          </View>

          <View style={{ height: 24 }} />

          <Text style={styles.completionMessage}>
            🎉 Your parking slot has been successfully booked and confirmed!
          </Text>

          <View style={{ height: 24 }} />

          <Pressable
            onPress={handleBackToMap}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: COLORS.success },
              pressed && styles.btnPressed
            ]}
          >
            <Text style={styles.btnText}>Back to Map</Text>
          </Pressable>
        </>
      )}

      <View style={{ height: 24 }} />

      {paymentStep !== "completed" && (
        <Pressable
          onPress={() => {
            clearPaymentState();
            router.back();
          }}
          style={({ pressed }) => [styles.link, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.linkText}>Cancel and Go Back</Text>
        </Pressable>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 16
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  refreshBtn: {
    padding: 8,
  },
  refreshText: {
    fontSize: 24,
  },
  h1: {
    fontWeight: "600",
    fontSize: 28,
    color: COLORS.text,
  },
  h2: {
    fontWeight: "600",
    fontSize: 22,
    color: COLORS.text,
    marginBottom: 8,
  },
  row: {
    fontWeight: "400",
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 6,
  },
  label: {
    fontWeight: "600",
    color: COLORS.muted,
  },
  muted: {
    fontWeight: "400",
    color: COLORS.muted,
  },
  description: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
  },
  helpText: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 18,
    fontStyle: "italic",
    textAlign: "center",
  },
  btn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnPressed: {
    opacity: 0.8
  },
  btnText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
  link: {
    marginTop: 16,
    alignItems: "center"
  },
  linkText: {
    color: COLORS.muted,
    fontWeight: "600"
  },
  successBox: {
    backgroundColor: "#f0fdf4",
    borderWidth: 2,
    borderColor: COLORS.success,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  successIcon: {
    fontSize: 48,
    color: COLORS.success,
    marginBottom: 8,
  },
  successText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.success,
    textAlign: "center",
  },
  completionMessage: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: "center",
    lineHeight: 24,
  },
  debugBox: {
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  debugText: {
    fontSize: 12,
    color: COLORS.muted,
    fontFamily: "monospace",
    marginBottom: 4,
  },
  debugBtn: {
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    alignItems: "center",
  },
  debugBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
});