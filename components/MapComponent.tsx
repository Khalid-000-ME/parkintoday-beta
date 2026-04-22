import { Platform } from 'react-native';

// Platform-specific imports with proper typing
let MapComponent: any;

if (Platform.OS === 'web') {
    MapComponent = require('./MapComponent.web').default;
} else {
    MapComponent = require('./MapComponent.native').default;
}

export default MapComponent;
export type { MapComponentProps } from './MapComponent.types';

