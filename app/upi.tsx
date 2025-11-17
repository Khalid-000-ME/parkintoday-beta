import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRazorpayPayment } from "../components/PaymentComponent";

const COLORS = {
  bg: "#ffffff",
  text: "#0f172a",
  muted: "#6b7280",
  primary: "#10b981",
  border: "#e5e7eb",
  razorpay: "#3395ff",
};

export default function UpiScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { handlePayment } = useRazorpayPayment();

  const spot = params.spotId
    ? {
        id: params.spotId as string,
        name: params.spotName as string,
        occupied: params.spotOccupied === "true",
        temperature: parseInt(params.spotTemperature as string),
        humidity: parseInt(params.spotHumidity as string),
      }
    : null;

  // Get Razorpay credentials from environment variables
  const razorpayKeyId = Constants.expoConfig?.extra?.RAZORPAY_KEY_ID;
  const razorpayKeySecret = Constants.expoConfig?.extra?.RAZORPAY_KEY_SECRET;

  const payeeName = "Jephrin Joseph J S";
  const amount = 10100; // Amount in paise (₹101)

  const handleRazorpayPayment = async () => {
    await handlePayment({
      razorpayKeyId: razorpayKeyId || "",
      amount: amount,
      onSuccess: () => {
        router.back();
      },
      onError: (error: string) => {
        Alert.alert(
          "Payment Failed",
          error,
          [{ text: "OK" }]
        );
      }
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.h1}>Confirm Parking</Text>
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
      <View style={{ height: 16 }} />
      <Text style={styles.h2}>Payment Details</Text>
      <Text style={styles.row}>
        <Text style={styles.label}>Payee:</Text> {payeeName}
      </Text>
      <Text style={styles.row}>
        <Text style={styles.label}>Amount:</Text> ₹{amount / 100}
      </Text>
      <View style={{ height: 24 }} />
      
      <Text style={styles.h2}>Payment Method</Text>
      <View style={{ height: 12 }} />

      {/* Razorpay Payment */}
      <Pressable
        onPress={handleRazorpayPayment}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: COLORS.razorpay },
          pressed && styles.btnPressed
        ]}
      >
        <Text style={styles.btnText}>Pay with Razorpay</Text>
      </Pressable>
      <View style={{ height: 8 }} />
      <Text style={styles.paymentNote}>
        Secure payment powered by Razorpay. Supports all major cards, UPI, and wallets.
      </Text>

      <View style={{ height: 24 }} />
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [styles.link, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.linkText}>Back to Map</Text>
      </Pressable>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
  h1: {
    fontWeight: "600",
    fontSize: 28,
    color: COLORS.text,
    marginBottom: 12,
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
  btn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnPressed: { opacity: 0.8 },
  btnText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
  link: { marginTop: 16, alignItems: "center" },
  linkText: { color: COLORS.muted, fontWeight: "600" },
  paymentNote: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: "center",
    fontStyle: "italic",
  },
});