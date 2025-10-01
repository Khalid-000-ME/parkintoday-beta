import { View, Text, StyleSheet, Pressable, Alert } from "react-native"
import Constants from "expo-constants"

const COLORS = {
  bg: "#ffffff",
  text: "#0f172a",
  muted: "#6b7280",
  primary: "#10b981",
  border: "#e5e7eb",
}

export default function UpiScreen({ route, navigation }) {
  const { spot } = route.params || {}
  const upiId = Constants.expoConfig?.extra?.upiId || "example@upi"
  const payeeName = Constants.expoConfig?.extra?.payeeName || "ParkInToday"

  const onPay = () => {
    Alert.alert("UPI Payment", `Initiate UPI intent for ${payeeName} (${upiId})`)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Confirm Parking</Text>
      {spot ? (
        <>
          <Text style={styles.row}>
            <Text style={styles.label}>Spot:</Text> {spot.name}
          </Text>
          <Text style={styles.row}>
            <Text style={styles.label}>Availability:</Text> {spot.occupied ? "Occupied" : "Available"}
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

      <Text style={styles.h2}>Payee Details</Text>
      <Text style={styles.row}>
        <Text style={styles.label}>Payee:</Text> {payeeName}
      </Text>
      <Text style={styles.row}>
        <Text style={styles.label}>UPI ID:</Text> {upiId}
      </Text>

      <View style={{ height: 24 }} />

      <Pressable onPress={onPay} style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}>
        <Text style={styles.btnText}>Proceed to UPI</Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate("Main")}
        style={({ pressed }) => [styles.link, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.linkText}>Back to Map</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
  h1: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 28,
    color: COLORS.text,
    marginBottom: 12,
  },
  h2: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 22,
    color: COLORS.text,
    marginBottom: 8,
  },
  row: {
    fontFamily: "SpaceGrotesk_400Regular",
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 6,
  },
  label: {
    fontFamily: "SpaceGrotesk_600SemiBold",
    color: COLORS.muted,
  },
  muted: {
    fontFamily: "SpaceGrotesk_400Regular",
    color: COLORS.muted,
  },
  btn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnPressed: { opacity: 0.9 },
  btnText: {
    color: "#ffffff",
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 16,
  },
  link: { marginTop: 16, alignItems: "center" },
  linkText: { color: COLORS.muted, fontFamily: "SpaceGrotesk_600SemiBold" },
})
