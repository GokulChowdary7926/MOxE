import React, { useCallback, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

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

export interface LeafletMapProps {
  /** Initial center [lat, lng] */
  center?: [number, number];
  /** Initial zoom 1–18 */
  zoom?: number;
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
}

const DEFAULT_CENTER: [number, number] = [37.7749, -122.4194];

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
      style={{ background: '#1a1a1a' }}
      zoomControl={true}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {showMarker && (
        <Marker
          position={pos}
          draggable={draggableMarker}
          eventHandlers={draggableMarker ? { dragend: handleDragEnd } : {}}
        />
      )}
      {markers.map((m, i) => (
        <Marker key={i} position={m.position}>
          {m.label ? <Popup>{m.label}</Popup> : null}
        </Marker>
      ))}
      {clickToSetMarker && draggableMarker && (
        <MapClickHandler setPosition={setInternalPos} onMarkerMove={onMarkerMove} enabled={true} />
      )}
    </MapContainer>
  );
}
