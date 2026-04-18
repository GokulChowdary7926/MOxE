import React, { useCallback, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchRouteForMap } from '../../utils/nearbyPlaces';
import { canUseBrowserGeolocation } from '../../utils/browserFeatures';

/** Fix default marker icons in Leaflet with bundlers (e.g. Vite) */
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

/** Blue dot for user location */
const userLocationIcon = L.divIcon({
  className: 'user-location-dot',
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#3388ff;border:3px solid white;box-shadow:0 0 6px rgba(0,0,0,0.4);"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

/** Soft blue pin used for searched/network places in Apple-like theme. */
const applePinIcon = L.divIcon({
  className: 'apple-map-pin',
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#0A84FF;border:3px solid #ffffff;box-shadow:0 6px 16px rgba(10,132,255,0.45);"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export interface LeafletMapProps {
  /** Initial center [lat, lng] */
  center?: [number, number];
  /** Initial zoom 1–18 */
  zoom?: number;
  /** Use light OSM tiles (default false = Carto dark basemap for app-wide dark theme) */
  lightTiles?: boolean;
  /** Show a single draggable or static marker at center */
  showMarker?: boolean;
  /** If true, user can drag marker and onMove is called */
  draggableMarker?: boolean;
  /** Callback when marker position changes (draggable only) */
  onMarkerMove?: (lat: number, lng: number) => void;
  /** Optional marker position (when controlled) */
  markerPosition?: [number, number];
  /** Optional list of static markers to show (e.g. places) */
  markers?: { position: [number, number]; label?: string }[];
  /** Map height (default 100%) */
  className?: string;
  /** Allow map click to set marker when draggableMarker is true */
  clickToSetMarker?: boolean;
  /** Show user's location from geolocation and center map on it */
  showUserLocation?: boolean;
  /** Called when user location is obtained */
  onUserLocation?: (lat: number, lng: number) => void;
  /** Show direction route from this point (e.g. user location) */
  routeFrom?: [number, number];
  /** Show direction route to this point (e.g. destination). When set with routeFrom, fetches OSRM route and draws it. */
  routeTo?: [number, number];
  /** Fly the map to this point when `revision` changes (search / "my location"). */
  flyTo?: { lat: number; lng: number; zoom?: number; revision: number };
  /** Apple Maps-like visual treatment (light tiles + custom pins). */
  appleStyle?: boolean;
}

const DEFAULT_CENTER: [number, number] = [37.7749, -122.4194];

function UserLocationLayer({ zoom, onLocation }: { zoom: number; onLocation?: (lat: number, lng: number) => void }) {
  const map = useMap();
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const hasCentered = React.useRef(false);

  useEffect(() => {
    if (!canUseBrowserGeolocation() || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const coords: [number, number] = [latitude, longitude];
        onLocation?.(latitude, longitude);
        setUserPos(coords);
        if (!hasCentered.current) {
          hasCentered.current = true;
          map.setView(coords, Math.max(map.getZoom(), zoom));
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [map, zoom, onLocation]);

  if (!userPos) return null;
  return (
    <Marker position={userPos} icon={userLocationIcon}>
      <Popup>Your location</Popup>
    </Marker>
  );
}

function MapFlyTo({ flyTo }: { flyTo: { lat: number; lng: number; zoom?: number; revision: number } }) {
  const map = useMap();
  const lastRevision = React.useRef<number | null>(null);
  useEffect(() => {
    if (lastRevision.current === flyTo.revision) return;
    lastRevision.current = flyTo.revision;
    map.flyTo([flyTo.lat, flyTo.lng], flyTo.zoom ?? 16, { duration: 1 });
  }, [map, flyTo]);
  return null;
}

function RouteLayer({
  from,
  to,
  onLoaded,
}: {
  from: [number, number];
  to: [number, number];
  onLoaded?: () => void;
}) {
  const map = useMap();
  const [positions, setPositions] = useState<[number, number][]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchRouteForMap(from[0], from[1], to[0], to[1]).then((coords) => {
      if (!cancelled && coords.length > 0) {
        setPositions(coords);
        const bounds = L.latLngBounds(coords);
        map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
        onLoaded?.();
      }
    });
    return () => { cancelled = true; };
  }, [from[0], from[1], to[0], to[1], map, onLoaded]);

  if (positions.length < 2) return null;
  return (
    <Polyline
      positions={positions}
      pathOptions={{ color: '#1d9bf0', weight: 4, opacity: 0.9 }}
    />
  );
}

function MapClickHandler({
  setPosition,
  onMarkerMove,
  enabled,
}: {
  setPosition: (pos: [number, number]) => void;
  onMarkerMove?: (lat: number, lng: number) => void;
  enabled: boolean;
}) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onMarkerMove?.(lat, lng);
    },
  });
  return null;
}

export default function LeafletMap({
  center = DEFAULT_CENTER,
  zoom = 13,
  showMarker = false,
  draggableMarker = false,
  onMarkerMove,
  markerPosition,
  markers = [],
  className = 'w-full h-full min-h-[200px] rounded-xl',
  clickToSetMarker = false,
  showUserLocation = false,
  onUserLocation,
  routeFrom,
  routeTo,
  lightTiles = false,
  flyTo,
  appleStyle = false,
}: LeafletMapProps) {
  const [internalPos, setInternalPos] = useState<[number, number]>(markerPosition ?? center);
  const pos = markerPosition ?? internalPos;

  const handleDragEnd = useCallback(
    (e: L.DragEndEvent) => {
      const { lat, lng } = e.target.getLatLng();
      setInternalPos([lat, lng]);
      onMarkerMove?.(lat, lng);
    },
    [onMarkerMove]
  );

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={className}
      style={{ background: appleStyle ? '#F2F2F7' : '#0e0e0e' }}
      zoomControl={true}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution={
          lightTiles || appleStyle
            ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        }
        url={
          appleStyle
            ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
            : lightTiles
            ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        }
      />
      {flyTo && <MapFlyTo flyTo={flyTo} />}
      {showUserLocation && <UserLocationLayer zoom={zoom} onLocation={onUserLocation} />}
      {showMarker && (
        <Marker
          position={pos}
          draggable={draggableMarker}
          eventHandlers={draggableMarker ? { dragend: handleDragEnd } : {}}
        />
      )}
      {markers.map((m, i) => (
        <Marker key={i} position={m.position} icon={appleStyle ? applePinIcon : defaultIcon}>
          {m.label ? <Popup>{m.label}</Popup> : null}
        </Marker>
      ))}
      {routeFrom && routeTo && (
        <RouteLayer from={routeFrom} to={routeTo} />
      )}
      {clickToSetMarker && draggableMarker && (
        <MapClickHandler setPosition={setInternalPos} onMarkerMove={onMarkerMove} enabled={true} />
      )}
    </MapContainer>
  );
}
