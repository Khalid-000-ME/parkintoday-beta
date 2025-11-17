import React from 'react';
import MapView, { Marker, Polyline } from 'react-native-maps';

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
}

export default function MapComponent({
  mapRef,
  initialRegion,
  userLocation,
  spots,
  best,
  colors
}: MapComponentProps) {
  return (
    <MapView ref={mapRef} style={{ flex: 1 }} initialRegion={initialRegion}>
      <Marker 
        coordinate={userLocation} 
        title="You" 
        description="Current location" 
        pinColor={colors.text} 
      />
      {spots.map((s) => (
        <Marker
          key={s.id}
          coordinate={{ latitude: s.latitude, longitude: s.longitude }}
          title={s.name}
          description={`${s.occupied ? "Occupied" : "Available"} • ${s.temperature}°C • ${s.humidity}%`}
          pinColor={s.occupied ? colors.danger : colors.primary}
        />
      ))}
      {best && (
        <Polyline
          coordinates={[userLocation, { latitude: best.latitude, longitude: best.longitude }]}
          strokeColor={colors.primary}
          strokeWidth={4}
        />
      )}
    </MapView>
  );
}
