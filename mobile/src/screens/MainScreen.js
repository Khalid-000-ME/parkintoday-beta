"use client"

import { useMemo, useRef, useState } from "react"
import { View, Text, StyleSheet, Pressable, FlatList } from "react-native"
import MapView, { Marker, Polyline } from "react-native-maps"

const COLORS = {
  bg: "#ffffff",
  text: "#0f172a",
  muted: "#6b7280",
  primary: "#10b981",
  danger: "#ef4444",
  border: "#e5e7eb",
}

const USER_LOCATION = { latitude: 37.7749, longitude: -122.4194 } // mock user location (SF)

const MOCK_SPOTS = [
  {
    id: "p1",
    name: "Lot A",
    latitude: 37.7797,
    longitude: -122.4148,
    occupied: false,
    temperature: 24,
    humidity: 52,
  },
  {
    id: "p2",
    name: "Garage Central",
    latitude: 37.7719,
    longitude: -122.4234,
    occupied: true,
    temperature: 25,
    humidity: 49,
  },
  {
    id: "p3",
    name: "Bayfront Parking",
    latitude: 37.7685,
    longitude: -122.4159,
    occupied: false,
    temperature: 23,
    humidity: 55,
  },
  {
    id: "p4",
    name: "Market Street Deck",
    latitude: 37.7812,
    longitude: -122.425,
    occupied: false,
    temperature: 26,
    humidity: 50,
  },
]

function haversine(a, b) {
  const toRad = (x) => (x * Math.PI) / 180
  const R = 6371 // km
  const dLat = toRad(b.latitude - a.latitude)
  const dLon = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLon = Math.sin(dLon / 2)
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  return R * c // km
}

export default function MainScreen({ navigation }) {
  const mapRef = useRef(null)
  const [spots] = useState(MOCK_SPOTS)
  const [best, setBest] = useState(null)

  const initialRegion = useMemo(
    () => ({
      latitude: USER_LOCATION.latitude,
      longitude: USER_LOCATION.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }),
    [],
  )

  const availableSpots = useMemo(() => spots.filter((s) => !s.occupied), [spots])

  const findBest = () => {
    if (availableSpots.length === 0) return
    let nearest = availableSpots[0]
    let min = haversine(USER_LOCATION, nearest)
    for (let i = 1; i < availableSpots.length; i++) {
      const d = haversine(USER_LOCATION, availableSpots[i])
      if (d < min) {
        min = d
        nearest = availableSpots[i]
      }
    }
    setBest(nearest)
    if (mapRef.current) {
      mapRef.current.animateCamera({
        center: { latitude: nearest.latitude, longitude: nearest.longitude },
        zoom: 15,
      })
    }
  }

  const onConfirm = () => {
    if (!best) return
    navigation.navigate("UPI", { spot: best })
  }

  const renderItem = ({ item }) => {
    const isBest = best && best.id === item.id
    return (
      <View style={[styles.card, isBest && styles.cardBest]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, isBest && styles.cardTitleBest]}>{item.name}</Text>
          <Text style={styles.cardMuted}>
            Temp: {item.temperature}°C • Humidity: {item.humidity}%
          </Text>
          <Text style={[styles.badge, item.occupied ? styles.badgeDanger : styles.badgeOk]}>
            {item.occupied ? "Occupied" : "Available"}
          </Text>
        </View>
        <Text style={styles.distance}>{haversine(USER_LOCATION, item).toFixed(2)} km</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.h1}>Nearby Parking</Text>
        <Text style={styles.sub}>Find the best spot near you</Text>
      </View>

      <View style={styles.mapWrap}>
        <MapView ref={mapRef} style={styles.map} initialRegion={initialRegion}>
          <Marker coordinate={USER_LOCATION} title="You" description="Current location" pinColor={COLORS.text} />
          {spots.map((s) => (
            <Marker
              key={s.id}
              coordinate={{ latitude: s.latitude, longitude: s.longitude }}
              title={s.name}
              description={`${s.occupied ? "Occupied" : "Available"} • ${s.temperature}°C • ${s.humidity}%`}
              pinColor={s.occupied ? COLORS.danger : COLORS.primary}
            />
          ))}
          {best && (
            <Polyline
              coordinates={[USER_LOCATION, { latitude: best.latitude, longitude: best.longitude }]}
              strokeColor={COLORS.primary}
              strokeWidth={4}
            />
          )}
        </MapView>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={findBest} style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}>
          <Text style={styles.btnText}>Find Best Nearest</Text>
        </Pressable>
        <Pressable
          onPress={onConfirm}
          disabled={!best}
          style={({ pressed }) => [
            styles.btnSecondary,
            !best && styles.btnDisabled,
            pressed && best && styles.btnSecondaryPressed,
          ]}
        >
          <Text style={[styles.btnSecondaryText, !best && styles.btnDisabledText]}>Confirm & Proceed</Text>
        </Pressable>
      </View>

      <View style={styles.listWrap}>
        <Text style={styles.h2}>Spots</Text>
        <FlatList
          data={spots}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  h1: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 28,
    color: COLORS.text,
  },
  sub: {
    fontFamily: "SpaceGrotesk_400Regular",
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 4,
  },
  mapWrap: {
    flex: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  map: { flex: 1 },
  actions: {
    padding: 16,
    gap: 12,
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
  btnSecondary: {
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnSecondaryPressed: { backgroundColor: "#f9fafb" },
  btnSecondaryText: {
    color: COLORS.text,
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 16,
  },
  btnDisabled: {
    backgroundColor: "#f3f4f6",
    borderColor: "#e5e7eb",
  },
  btnDisabledText: {
    color: "#9ca3af",
  },
  listWrap: { paddingVertical: 12 },
  h2: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 22,
    color: COLORS.text,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  card: {
    width: 260,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  cardBest: {
    borderColor: COLORS.primary,
    backgroundColor: "#ecfdf5",
  },
  cardTitle: {
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 16,
    color: COLORS.text,
  },
  cardTitleBest: { color: "#065f46" },
  cardMuted: {
    fontFamily: "SpaceGrotesk_400Regular",
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
    marginBottom: 6,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 12,
    color: "#ffffff",
    overflow: "hidden",
  },
  badgeOk: { backgroundColor: COLORS.primary },
  badgeDanger: { backgroundColor: COLORS.danger },
  distance: {
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 14,
    color: COLORS.text,
  },
})
