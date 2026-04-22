import React from 'react';

export interface MapComponentProps {
    mapRef: React.RefObject<any>;
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
}

export type MapComponentType = React.ComponentType<MapComponentProps>;
