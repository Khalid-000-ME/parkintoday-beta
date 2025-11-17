import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MapComponentProps {
  mapRef?: any;
  initialRegion?: any;
  userLocation: {
    latitude: number;
    longitude: number;
  };
  spots?: any[];
  best?: any;
  colors: {
    text: string;
    danger: string;
    primary: string;
    muted: string;
    border: string;
  };
}

export default function MapComponent({ userLocation, colors }: MapComponentProps) {
  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      <Text style={[styles.mapText, { color: colors.text }]}>🗺️ Map View</Text>
      <Text style={[styles.mapSubtext, { color: colors.muted }]}>
        Interactive map is available on mobile devices
      </Text>
      <View style={[styles.locationInfo, { borderColor: colors.border }]}>
        <Text style={[styles.locationText, { color: colors.text }]}>📍 Your Location</Text>
        <Text style={[styles.coordinates, { color: colors.muted }]}>
          {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderStyle: "dashed",
  },
  mapText: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
  },
  mapSubtext: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  locationInfo: {
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  locationText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  coordinates: {
    fontSize: 12,
    fontFamily: "monospace",
  },
});
