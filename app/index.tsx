import { useMemo, useRef, useState, useEffect } from "react"
import { View, Text, StyleSheet, Pressable, FlatList, Platform, ActivityIndicator, Alert, TextInput, Modal } from "react-native"
import { useRouter } from 'expo-router'
import { UserCircleIcon, Cog6ToothIcon, MapPinIcon } from "react-native-heroicons/outline";
import * as Location from 'expo-location'
import Constants from 'expo-constants'
import MapComponent from '../components/MapComponent'

const COLORS = {
  bg: "#ffffff",
  text: "#0f172a",
  muted: "#6b7280",
  primary: "#0f172a", // Dark Slate Blue
  danger: "#ef4444",
  border: "#e5e7eb",
}


// Chennai area parking spots for testing
const MOCK_SPOTS = [
  {
    id: "p1",
    name: "T Nagar Shopping Complex",
    latitude: 13.0418,
    longitude: 80.2341,
    occupied: false,
    temperature: 32,
    humidity: 68,
  },
  {
    id: "p2",
    name: "Anna Nagar Tower Park",
    latitude: 13.0878,
    longitude: 80.2085,
    occupied: false,
    temperature: 31,
    humidity: 65,
  },
  {
    id: "p3",
    name: "Phoenix Marketcity Velachery",
    latitude: 12.9807,
    longitude: 80.2207,
    occupied: true,
    temperature: 33,
    humidity: 70,
  },
  {
    id: "p4",
    name: "Marina Beach Parking",
    latitude: 13.0499,
    longitude: 80.2824,
    occupied: false,
    temperature: 30,
    humidity: 75,
  },
  {
    id: "p5",
    name: "Express Avenue Mall",
    latitude: 13.0569,
    longitude: 80.2589,
    occupied: false,
    temperature: 31,
    humidity: 67,
  },
  {
    id: "p6",
    name: "OMR IT Park",
    latitude: 12.9121,
    longitude: 80.2273,
    occupied: true,
    temperature: 32,
    humidity: 69,
  },
  {
    id: "p7",
    name: "Adyar Depot",
    latitude: 13.0067,
    longitude: 80.2572,
    occupied: false,
    temperature: 31,
    humidity: 66,
  },
  {
    id: "p8",
    name: "Porur Junction Parking",
    latitude: 13.0358,
    longitude: 80.1561,
    occupied: false,
    temperature: 33,
    humidity: 64,
  },
  {
    id: "p9",
    name: "ParkInToday — Perambur Lot",
    latitude: 13.0590,
    longitude: 80.2344,
    occupied: false,
    temperature: 31,
    humidity: 66,
  },
]

interface Location {
  latitude: number;
  longitude: number;
}

function haversine(a: Location, b: Location): number {
  const toRad = (x: number) => (x * Math.PI) / 180
  const R = 6371
  const dLat = toRad(b.latitude - a.latitude)
  const dLon = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLon = Math.sin(dLon / 2)
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  return R * c
}

export default function MainScreen() {
  const router = useRouter()
  const mapRef = useRef<any>(null)
  const [spots] = useState(MOCK_SPOTS)
  const [best, setBest] = useState<typeof MOCK_SPOTS[0] | null>(null)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSpot, setSelectedSpot] = useState<typeof MOCK_SPOTS[0] | null>(null)
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ latitude: number; longitude: number }>>([])
  const [loadingRoute, setLoadingRoute] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [customLat, setCustomLat] = useState("")
  const [customLng, setCustomLng] = useState("")

  // Request location permissions and start tracking
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required to use this app')
          setLoading(false)
          return
        }

        // Get initial location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        })
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        })
        setLoading(false)

        // Watch location updates
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // Update every 5 seconds
            distanceInterval: 10, // Or when user moves 10 meters
          },
          (location) => {
            setUserLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            })
          }
        )
      } catch (error) {
        console.error('Error getting location:', error)
        Alert.alert('Error', 'Failed to get your location')
        setLoading(false)
      }
    })()

    return () => {
      if (locationSubscription) {
        locationSubscription.remove()
      }
    }
  }, [])

  const initialRegion = useMemo(
    () => ({
      latitude: userLocation?.latitude || 13.0827,
      longitude: userLocation?.longitude || 80.2707,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }),
    [userLocation],
  )

  // Fetch real route from Google Directions API
  const fetchRoute = async (destination: { latitude: number; longitude: number }) => {
    if (!userLocation) return

    setLoadingRoute(true)
    try {
      // TEMPORARY: Hardcoded API key for testing
      // TODO: Fix environment variable loading
      const API_KEY = 'AIzaSyCGc-l8Ktwh98lsQzCBLaAJmy0bgzcP-Qo'

      // Debug: Log to verify API key is loaded (remove in production)
      console.log('API Key loaded:', API_KEY ? 'Yes (length: ' + API_KEY.length + ')' : 'No')

      const origin = `${userLocation.latitude},${userLocation.longitude}`
      const dest = `${destination.latitude},${destination.longitude}`

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&key=${API_KEY}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.routes && data.routes.length > 0) {
        const points = decodePolyline(data.routes[0].overview_polyline.points)
        setRouteCoordinates(points)
      } else {
        const errorMsg = data.error_message || 'Could not find a route'
        Alert.alert('Route Error', errorMsg)
      }
    } catch (error) {
      console.error('Error fetching route:', error)
      Alert.alert('Error', 'Failed to fetch route. Please check your internet connection.')
    } finally {
      setLoadingRoute(false)
    }
  }

  // Decode Google's encoded polyline format
  const decodePolyline = (encoded: string): Array<{ latitude: number; longitude: number }> => {
    const points: Array<{ latitude: number; longitude: number }> = []
    let index = 0
    const len = encoded.length
    let lat = 0
    let lng = 0

    while (index < len) {
      let b
      let shift = 0
      let result = 0
      do {
        b = encoded.charCodeAt(index++) - 63
        result |= (b & 0x1f) << shift
        shift += 5
      } while (b >= 0x20)
      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1
      lat += dlat

      shift = 0
      result = 0
      do {
        b = encoded.charCodeAt(index++) - 63
        result |= (b & 0x1f) << shift
        shift += 5
      } while (b >= 0x20)
      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1
      lng += dlng

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      })
    }

    return points
  }

  const availableSpots = useMemo(() => spots.filter((s) => !s.occupied), [spots])

  // Handle spot selection
  const handleSpotSelect = (spot: any) => {
    setSelectedSpot(spot)
    setBest(spot)
    fetchRoute({ latitude: spot.latitude, longitude: spot.longitude })

    // Animate camera on native platforms
    if (Platform.OS !== 'web' && mapRef.current) {
      mapRef.current.animateCamera({
        center: { latitude: spot.latitude, longitude: spot.longitude },
        zoom: 15,
      })
    }
  }

  const findBest = () => {
    if (!userLocation || availableSpots.length === 0) return
    let nearest = availableSpots[0]
    let min = haversine(userLocation, nearest)
    for (let i = 1; i < availableSpots.length; i++) {
      const d = haversine(userLocation, availableSpots[i])
      if (d < min) {
        min = d
        nearest = availableSpots[i]
      }
    }
    handleSpotSelect(nearest)
  }

  const onConfirm = () => {
    if (!best) return
    router.push({
      pathname: '/upi',
      params: {
        spotId: best.id,
        spotName: best.name,
        spotOccupied: best.occupied.toString(),
        spotTemperature: best.temperature.toString(),
        spotHumidity: best.humidity.toString(),
      }
    })
  }

  // Set custom location for testing
  const setCustomLocation = () => {
    const lat = parseFloat(customLat)
    const lng = parseFloat(customLng)

    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Invalid Input', 'Please enter valid latitude and longitude values')
      return
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      Alert.alert('Invalid Coordinates', 'Latitude must be between -90 and 90, longitude between -180 and 180')
      return
    }

    setUserLocation({ latitude: lat, longitude: lng })
    setShowLocationModal(false)
    setCustomLat("")
    setCustomLng("")
    Alert.alert('Success', 'Custom location set successfully!')
  }

  // Open location modal with current location pre-filled
  const openLocationModal = () => {
    if (userLocation) {
      setCustomLat(userLocation.latitude.toString())
      setCustomLng(userLocation.longitude.toString())
    } else {
      // Default to Chennai center
      setCustomLat("13.0827")
      setCustomLng("80.2707")
    }
    setShowLocationModal(true)
  }

  // Handle map press to set custom location
  const handleMapPress = (coordinate: { latitude: number; longitude: number }) => {
    setUserLocation(coordinate)
    Alert.alert(
      'Location Updated',
      `New location set to:\n${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
      [{ text: 'OK' }]
    )
  }

  const renderItem = ({ item }: { item: typeof MOCK_SPOTS[0] }) => {
    const isBest = best && best.id === item.id
    const isSelected = selectedSpot && selectedSpot.id === item.id
    return (
      <Pressable
        onPress={() => handleSpotSelect(item)}
        style={({ pressed }) => [
          styles.card,
          (isBest || isSelected) && styles.cardBest,
          pressed && styles.cardPressed
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, (isBest || isSelected) && styles.cardTitleBest]}>{item.name}</Text>
          <Text style={styles.cardMuted}>
            Temp: {item.temperature}°C • Humidity: {item.humidity}%
          </Text>
          <Text style={[styles.badge, item.occupied ? styles.badgeDanger : styles.badgeOk]}>
            {item.occupied ? "Occupied" : "Available"}
          </Text>
        </View>
        {userLocation && (
          <Text style={styles.distance}>{haversine(userLocation, item).toFixed(2)} km</Text>
        )}
      </Pressable>
    )
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      ) : !userLocation ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Unable to get your location</Text>
          <Text style={styles.sub}>Please enable location services</Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.h1}>Nearby Parking</Text>
                <Text style={styles.sub}>Find the best spot near you</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable onPress={() => router.push('/config')} style={styles.iconBtn}>
                  <Cog6ToothIcon size={24} color={COLORS.muted} />
                </Pressable>
                <Pressable onPress={() => router.push('/profile')} style={styles.iconBtn}>
                  <UserCircleIcon size={24} color={COLORS.primary} />
                </Pressable>
              </View>
            </View>
            <Pressable
              onPress={openLocationModal}
              style={({ pressed }) => [styles.locationBtn, pressed && styles.locationBtnPressed]}
            >
              <MapPinIcon size={18} color={COLORS.primary} />
              <Text style={styles.locationBtnText}>Set Location</Text>
            </Pressable>
          </View>
          {userLocation && (
            <Text style={styles.currentLocation}>
              Current: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
            </Text>
          )}

          <View style={styles.mapWrap}>
            <MapComponent
              mapRef={mapRef}
              initialRegion={initialRegion}
              userLocation={userLocation}
              spots={spots}
              best={best}
              colors={COLORS}
              routeCoordinates={routeCoordinates}
              onMapPress={handleMapPress}
              onSpotPress={handleSpotSelect}
              parkingZones={[
                {
                  id: 'zone_perambur',
                  name: 'ParkInToday — Perambur Lot',
                  // ~50m rectangle around 13.0590, 80.2344
                  coordinates: [
                    { latitude: 13.05925, longitude: 80.23410 },
                    { latitude: 13.05925, longitude: 80.23470 },
                    { latitude: 13.05875, longitude: 80.23470 },
                    { latitude: 13.05875, longitude: 80.23410 },
                  ],
                },
              ]}
            />
            {loadingRoute && (
              <View style={styles.routeLoadingOverlay}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.routeLoadingText}>Loading route...</Text>
              </View>
            )}
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
        </>
      )
      }

      {/* Custom Location Modal */}
      <Modal
        visible={showLocationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Custom Location</Text>
            <Text style={styles.modalSubtitle}>Enter coordinates for testing</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Latitude</Text>
              <TextInput
                style={styles.input}
                value={customLat}
                onChangeText={setCustomLat}
                placeholder="e.g., 13.0827"
                keyboardType="numeric"
                placeholderTextColor={COLORS.muted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Longitude</Text>
              <TextInput
                style={styles.input}
                value={customLng}
                onChangeText={setCustomLng}
                placeholder="e.g., 80.2707"
                keyboardType="numeric"
                placeholderTextColor={COLORS.muted}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowLocationModal(false)}
                style={({ pressed }) => [styles.modalBtn, styles.modalBtnCancel, pressed && styles.modalBtnPressed]}
              >
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={setCustomLocation}
                style={({ pressed }) => [styles.modalBtn, styles.modalBtnConfirm, pressed && styles.modalBtnPressed]}
              >
                <Text style={styles.modalBtnTextConfirm}>Set Location</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View >
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    fontFamily: "SpaceGrotesk_400Regular",
    fontSize: 16,
    color: COLORS.muted,
    marginTop: 12,
  },
  errorText: {
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 8,
  },
  iconBtn: {
    padding: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  settingsBtn: {
    padding: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  settingsBtnText: {
    fontSize: 20
  },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  locationBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationBtnPressed: {
    opacity: 0.8,
  },
  locationBtnText: {
    color: '#ffffff',
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 12,
  },
  currentLocation: {
    fontFamily: "SpaceGrotesk_400Regular",
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 4,
  },
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
    position: 'relative',
  },
  routeLoadingOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeLoadingText: {
    fontFamily: "SpaceGrotesk_400Regular",
    fontSize: 14,
    color: COLORS.text,
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
  cardPressed: {
    opacity: 0.8,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 24,
    color: COLORS.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontFamily: "SpaceGrotesk_400Regular",
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: "SpaceGrotesk_400Regular",
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnPressed: {
    opacity: 0.8,
  },
  modalBtnCancel: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalBtnConfirm: {
    backgroundColor: COLORS.primary,
  },
  modalBtnTextCancel: {
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 16,
    color: COLORS.text,
  },
  modalBtnTextConfirm: {
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 16,
    color: '#ffffff',
  },
})
