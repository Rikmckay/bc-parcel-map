const WFS_BASE = 'https://openmaps.gov.bc.ca/geo/pub/ows';
const LAYER = 'pub:WHSE_CADASTRE.PMBC_PARCEL_FABRIC_POLY_SVW';
const GEOCODER_BASE = 'https://geocoder.api.gov.bc.ca';

/**
 * Fetch parcel polygons within a bounding box from ParcelMap BC WFS.
 * Returns GeoJSON FeatureCollection.
 */
export async function fetchParcels(bounds, signal) {
  const { west, south, east, north } = bounds;

  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeName: LAYER,
    outputFormat: 'application/json',
    srsName: 'EPSG:4326',
    count: '4000',
    CQL_FILTER: `BBOX(SHAPE,${west},${south},${east},${north},'EPSG:4326')`,
  });

  const res = await fetch(`${WFS_BASE}?${params}`, { signal });
  if (!res.ok) throw new Error(`WFS error: ${res.status}`);
  return res.json();
}

/**
 * Search for addresses using BC Address Geocoder.
 * Returns array of { address, location: [lat, lng] }.
 */
export async function searchAddress(query, signal) {
  if (!query || query.trim().length < 3) return [];

  const params = new URLSearchParams({
    addressString: query,
    maxResults: '5',
    outputSRS: '4326',
  });

  const res = await fetch(
    `${GEOCODER_BASE}/addresses.geojson?${params}`,
    { signal }
  );
  if (!res.ok) throw new Error(`Geocoder error: ${res.status}`);

  const data = await res.json();
  return (data.features || []).map((f) => ({
    address: f.properties.fullAddress,
    score: f.properties.score,
    location: [f.geometry.coordinates[1], f.geometry.coordinates[0]],
  }));
}

/**
 * Reverse geocode a lat/lng to get the nearest address.
 */
export async function reverseGeocode(lat, lng, signal) {
  const params = new URLSearchParams({
    point: `${lng},${lat}`,
    outputSRS: '4326',
  });

  try {
    const res = await fetch(
      `${GEOCODER_BASE}/sites/nearest.geojson?${params}`,
      { signal }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      return data.features[0].properties.fullAddress;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Format parcel area from square meters to a readable string.
 */
export function formatArea(sqm) {
  if (!sqm) return 'N/A';
  const sqft = Math.round(sqm * 10.7639);
  const acres = sqm / 4046.86;

  if (acres >= 10) {
    return `${acres.toFixed(1)} acres`;
  }
  if (acres >= 1) {
    return `${acres.toFixed(2)} acres (${sqft.toLocaleString()} sqft)`;
  }
  return `${Math.round(sqm).toLocaleString()} m\u00B2 (${sqft.toLocaleString()} sqft)`;
}

/**
 * Format PID to standard format (000-000-000).
 */
export function formatPID(pid) {
  if (!pid) return 'N/A';
  const s = String(pid).padStart(9, '0');
  return `${s.slice(0, 3)}-${s.slice(3, 6)}-${s.slice(6, 9)}`;
}
