import React from 'react';
import MapView, { Marker, Polyline, Callout, Polygon } from 'react-native-maps';
import { Text, StyleSheet, View } from 'react-native';
import { UserCircleIcon, MapPinIcon, CheckCircleIcon, XCircleIcon } from "react-native-heroicons/solid";

interface MapComponentProps {
  mapRef: React.RefObject<MapView>;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  userLocation: {
    latitude: number;
    longitude: number;
  };
  spots: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    occupied: boolean;
    temperature: number;
    humidity: number;
  }>;
  best: any;
  colors: {
    text: string;
    danger: string;
    primary: string;
  };
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  onSpotPress?: (spot: any) => void;
  parkingZones?: Array<{
    id: string;
    name: string;
    coordinates: Array<{ latitude: number; longitude: number }>;
  }>;
}

export default function MapComponent({
  mapRef,
  initialRegion,
  userLocation,
  spots,
  best,
  colors,
  routeCoordinates,
  onMapPress,
  onSpotPress,
  parkingZones,
}: MapComponentProps) {
  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      initialRegion={initialRegion}
      onPress={(e) => onMapPress?.(e.nativeEvent.coordinate)}
    >
      {/* User location marker */}
      {userLocation && (
        <Marker
          coordinate={userLocation}
          anchor={{ x: 0.5, y: 1 }}
        >
          <View style={styles.userMarkerContainer}>
            <View style={styles.youAreHereCallout}>
              <MapPinIcon size={14} color="white" />
              <Text style={styles.youAreHereText}> You are here</Text>
            </View>
            <UserCircleIcon size={24} color="#2563eb" />
          </View>
        </Marker>
      )}

      {/* Parking spot markers */}
      {spots.map((s) => (
        <Marker
          key={s.id}
          coordinate={{ latitude: s.latitude, longitude: s.longitude }} // Fixed coordinate
          pinColor={s.occupied ? colors.danger : colors.primary}
          onPress={() => onSpotPress?.(s)}
        >
          <Callout>
            <View style={styles.spotCallout}>
              <Text style={styles.spotTitle}>{s.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                {s.occupied ? (
                  <XCircleIcon size={16} color={colors.danger} />
                ) : (
                  <CheckCircleIcon size={16} color="#10b981" />
                )}
                <Text style={[styles.spotDescription, { marginLeft: 4, color: s.occupied ? colors.danger : '#10b981' }]}>
                  {s.occupied ? "Occupied" : "Available"}
                </Text>
              </View>

              <Text style={styles.spotDetails}>
                {s.occupied ? "Filled" : "Open"} • {s.temperature}°C • {s.humidity}% humidity
              </Text>
              <Text style={styles.spotAction}>Tap marker to get route</Text>
            </View>
          </Callout>
        </Marker>
      ))}

      {/* Route polyline */}
      {routeCoordinates && routeCoordinates.length > 0 && (
        <Polyline
          coordinates={routeCoordinates}
          strokeColor={colors.primary}
          strokeWidth={4}
        />
      )}

      {/* Parking lot zone polygons */}
      {parkingZones?.map((zone) => (
        <Polygon
          key={zone.id}
          coordinates={zone.coordinates}
          strokeColor="#2563eb"
          fillColor="rgba(37, 99, 235, 0.18)"
          strokeWidth={2}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  userMarkerContainer: {
    alignItems: 'center',
  },
  youAreHereCallout: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center'
  },
  youAreHereText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4
  },
  spotCallout: {
    padding: 8,
    minWidth: 200,
  },
  spotTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#0f172a',
  },
  spotDescription: {
    fontSize: 14,
    fontWeight: '600',
  },
  spotDetails: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  spotAction: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 4,
  },
});
