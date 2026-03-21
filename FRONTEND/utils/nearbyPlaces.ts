/**
 * Fetch nearby places from OpenStreetMap Overpass API.
 * Safe places: police, fire_station, hospital, etc. within radiusKm.
 * Famous/tourist: attractions, historic within radiusKm.
 */

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

export type NearbyPlace = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  distanceKm?: number;
};

function parseOverpassElements(
  elements: Array<{ id: number; lat: number; lon: number; tags?: Record<string, string> }>,
  userLat: number,
  userLng: number
): NearbyPlace[] {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return elements
    .filter((e) => e.lat != null && e.lon != null)
    .map((e) => {
      const name =
        e.tags?.name ||
        e.tags?.brand ||
        e.tags?.operator ||
        `${e.tags?.amenity || e.tags?.shop || e.tags?.tourism || 'Place'}`;
      const category =
        e.tags?.amenity ||
        e.tags?.shop ||
        e.tags?.leisure ||
        e.tags?.tourism ||
        e.tags?.historic ||
        'Place';
      const distanceKm = haversineKm(userLat, userLng, e.lat, e.lon);
      return {
        id: `n-${e.id}-${e.lat}-${e.lon}`,
        name: name.trim() || 'Unnamed',
        lat: e.lat,
        lng: e.lon,
        category: String(category).replace(/_/g, ' '),
        distanceKm,
      };
    })
    .filter((p) => p.name && p.name !== 'Place')
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
}

/** Safe places within radiusKm: police, fire station, hospital, pharmacy, bus stations, parks, markets. */
export async function fetchNearbySafePlaces(
  userLat: number,
  userLng: number,
  radiusKm: number = 5
): Promise<NearbyPlace[]> {
  const radiusM = Math.round(radiusKm * 1000);
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"~"police|fire_station|hospital|pharmacy|clinic"](around:${radiusM},${userLat},${userLng});
      node["public_transport"="station"](around:${radiusM},${userLat},${userLng});
      node["highway"="bus_stop"](around:${radiusM},${userLat},${userLng});
      node["leisure"="park"](around:${radiusM},${userLat},${userLng});
      node["shop"~"supermarket|convenience"](around:${radiusM},${userLat},${userLng});
    );
    out body;
  `;
  try {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const data = await res.json();
    const elements = (data.elements || []).map((e: any) => ({
      id: e.id,
      lat: e.lat ?? e.center?.lat,
      lon: e.lon ?? e.center?.lon,
      tags: e.tags || {},
    })).filter((e: any) => e.lat != null && e.lon != null);
    return parseOverpassElements(elements, userLat, userLng).slice(0, 30);
  } catch {
    return [];
  }
}

/** Famous / tourist places within radiusKm (e.g. 50km). */
export async function fetchNearbyFamousPlaces(
  userLat: number,
  userLng: number,
  radiusKm: number = 50
): Promise<NearbyPlace[]> {
  const radiusM = Math.round(radiusKm * 1000);
  const query = `
    [out:json][timeout:20];
    (
      node["tourism"~"attraction|museum|viewpoint|theme_park|zoo"](around:${radiusM},${userLat},${userLng});
      node["historic"](around:${radiusM},${userLat},${userLng});
      node["natural"~"beach|peak|volcano"](around:${radiusM},${userLat},${userLng});
    );
    out body;
  `;
  try {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const data = await res.json();
    const elements = (data.elements || []).map((e: any) => ({
      id: e.id,
      lat: e.lat ?? e.center?.lat,
      lon: e.lon ?? e.center?.lon,
      tags: e.tags || {},
    })).filter((e: any) => e.lat != null && e.lon != null);
    return parseOverpassElements(elements, userLat, userLng).slice(0, 50);
  } catch {
    return [];
  }
}

/** Open Google Maps directions from user to destination (fallback when in-app route not used) */
export function openDirections(userLat: number, userLng: number, destLat: number, destLng: number, destName?: string): void {
  const dest = destName ? encodeURIComponent(destName) : `${destLat},${destLng}`;
  const url = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${dest}`;
  window.open(url, '_blank');
}

const OSRM_BASE = 'https://router.project-osrm.org';

/** Fetch route geometry (lat,lng pairs) for drawing on MOxE map. Returns [] on failure. */
export async function fetchRouteForMap(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<[number, number][]> {
  try {
    const coords = `${fromLng},${fromLat};${toLng},${toLat}`;
    const url = `${OSRM_BASE}/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates?.length) return [];
    const coordsArr = data.routes[0].geometry.coordinates as [number, number][];
    return coordsArr.map(([lon, lat]) => [lat, lon]);
  } catch {
    return [];
  }
}
