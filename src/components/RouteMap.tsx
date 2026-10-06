// import { useMemo } from 'react';
// // import MapLibreGL from '@maplibre/maplibre-react-native';
// import type { Pt } from '../lib/geo';

// // Free demo style. For production use your own tile provider (and keep the attribution).
// const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

// export default function RouteMap({ points }: { points: Pt[] }) {
//   const route = useMemo(
//     () => ({
//       type: 'Feature' as const,
//       properties: {},
//       geometry: {
//         type: 'LineString' as const,
//         coordinates: points.map((p) => [p.lng, p.lat]), // GeoJSON is [lng, lat]
//       },
//     }),
//     [points]
//   );

//   return (
   
//     // <MapLibreGL.MapView style={{ flex: 1 }} mapStyle={STYLE_URL} logoEnabled={false}>
//     //   <MapLibreGL.Camera followUserLocation followZoomLevel={16} followUserMode="normal" />
//     //   <MapLibreGL.UserLocation visible />
//     //   {points.length > 1 && (
//     //     <MapLibreGL.ShapeSource id="route" shape={route}>
//     //       <MapLibreGL.LineLayer
//     //         id="route-line"
//     //         style={{ lineColor: '#16a34a', lineWidth: 5, lineCap: 'round', lineJoin: 'round' }}
//     //       />
//     //     </MapLibreGL.ShapeSource>
//     //   )}
//     // </MapLibreGL.MapView>
  
//   );
// }


import { useMemo } from 'react';
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import type { Pt } from '../lib/geo';

export default function RouteMap({ points }: { points: Pt[] }) {
  const coordinates = useMemo(
    () =>
      points.map((p) => ({
        latitude: p.lat,
        longitude: p.lng,
      })),
    [points]
  );

  const initialRegion = useMemo(() => {
    if (points.length === 0) {
      return {
        latitude: 11.1271,
        longitude: 78.6569,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    const last = points[points.length - 1];

    return {
      latitude: last.lat,
      longitude: last.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }, [points]);

  return (
    <MapView
      style={{ flex: 1 }}
      provider={PROVIDER_GOOGLE}
      initialRegion={initialRegion}
      showsUserLocation
      showsMyLocationButton
      followsUserLocation
    >
      {coordinates.length > 1 && (
        <Polyline
          coordinates={coordinates}
          strokeWidth={5}
          strokeColor="#16a34a"
        />
      )}

      {coordinates.length > 0 && (
        <Marker coordinate={coordinates[coordinates.length - 1]} />
      )}
    </MapView>
  );
}