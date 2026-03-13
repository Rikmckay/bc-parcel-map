const WFS_BASE = 'https://openmaps.gov.bc.ca/geo/pub/ows';
const PARCEL_LAYER = 'pub:WHSE_CADASTRE.PMBC_PARCEL_FABRIC_POLY_SVW';
const ALR_LAYER = 'pub:WHSE_LEGAL_ADMIN_BOUNDARIES.OATS_ALR_POLYS';
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
    typeName: PARCEL_LAYER,
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
 * Fetch ALR polygons within a bounding box.
 */
export async function fetchALR(bounds, signal) {
  const { west, south, east, north } = bounds;

  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeName: ALR_LAYER,
    outputFormat: 'application/json',
    srsName: 'EPSG:4326',
    count: '500',
    CQL_FILTER: `BBOX(GEOMETRY,${west},${south},${east},${north},'EPSG:4326')`,
  });

  const res = await fetch(`${WFS_BASE}?${params}`, { signal });
  if (!res.ok) throw new Error(`WFS ALR error: ${res.status}`);
  return res.json();
}

/**
 * Fetch a single parcel by PID number.
 */
export async function fetchParcelByPID(pid, signal) {
  const pidNum = String(pid).replace(/-/g, '');

  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeName: PARCEL_LAYER,
    outputFormat: 'application/json',
    srsName: 'EPSG:4326',
    CQL_FILTER: `PID_NUMBER='${pidNum}'`,
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
    // nearest.geojson returns a single Feature, not a FeatureCollection
    if (data.type === 'Feature' && data.properties?.fullAddress) {
      return data.properties.fullAddress;
    }
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

/**
 * Build Google Street View URL for a lat/lng.
 */
export function getStreetViewUrl(lat, lng) {
  return `https://www.google.com/maps?layer=c&cbll=${lat},${lng}`;
}

/**
 * Build a share URL for a PID.
 */
export function getShareUrl(pid) {
  const base = window.location.origin + window.location.pathname;
  const pidClean = String(pid).replace(/-/g, '');
  return `${base}?pid=${pidClean}`;
}

/**
 * Build BC Assessment map search URL centered on coordinates.
 * No direct PID deep-link exists, so we center the map on the parcel.
 */
export function getBCAssessmentUrl(lat, lng) {
  return `https://www.bcassessment.ca/Property/Mapsearch?sp=1&act=&x=${lng}&y=${lat}&z=17`;
}

/**
 * Build LTSA title search URL.
 * LTSA Explorer requires a paid account. Opens the search page.
 */
export function getLTSAUrl() {
  return 'https://ltsa.ca/property-owners/how-can-i/search-for-a-title/';
}

/**
 * Build Land Owner Transparency Registry search URL with PID.
 */
export function getLOTRUrl(pid) {
  return `https://landtransparency.ca/search/?pid=${String(pid).replace(/-/g, '')}`;
}

/**
 * Map municipality name to its local GIS/zoning viewer URL.
 * Falls back to BC Land Use map if municipality not mapped.
 */
const ZONING_MAP_URLS = {
  'PARKSVILLE': 'https://maps.parksville.ca/',
  'QUALICUM BEACH': 'https://qualicumbeach.ca/maps/',
  'NANAIMO': 'https://www.nanaimo.ca/property-maps',
  'LANTZVILLE': 'https://www.lantzville.ca/cms/wpattachments/wpID348atID711.pdf',
  'NORTH COWICHAN': 'https://northcowichan.ca/services/maps',
  'DUNCAN': 'https://duncan.ca/maps/',
  'COURTENAY': 'https://www.courtenay.ca/EN/main/municipal-services/maps-gis.html',
  'COMOX': 'https://www.comox.ca/maps',
  'CAMPBELL RIVER': 'https://www.campbellriver.ca/your-city-hall/maps',
  'VICTORIA': 'https://maps.victoria.ca/',
  'SAANICH': 'https://www.saanich.ca/EN/main/local-government/maps.html',
  'VANCOUVER': 'https://maps.vancouver.ca/van-map/',
  'SURREY': 'https://cosmos.surrey.ca/geo_ref/Images/Zoning/',
  'KELOWNA': 'https://maps.kelowna.ca/',
  'KAMLOOPS': 'https://maps.kamloops.ca/',
};

export function getZoningMapUrl(municipality) {
  if (!municipality || municipality === 'N/A') {
    return 'https://maps.gov.bc.ca/ess/hm/imap4m/';
  }
  // WFS returns "Parksville, City of" format - extract the city name
  const raw = municipality.toUpperCase().trim();
  // Try exact match first
  if (ZONING_MAP_URLS[raw]) return ZONING_MAP_URLS[raw];
  // Try extracting name before comma ("Parksville, City of" → "PARKSVILLE")
  const beforeComma = raw.split(',')[0].trim();
  if (ZONING_MAP_URLS[beforeComma]) return ZONING_MAP_URLS[beforeComma];
  // Try extracting name after "of" ("District of North Cowichan" → "NORTH COWICHAN")
  const afterOf = raw.replace(/^.*?\bOF\b\s*/i, '').trim();
  if (afterOf !== raw && ZONING_MAP_URLS[afterOf]) return ZONING_MAP_URLS[afterOf];
  // Fallback to BC iMapBC viewer
  return 'https://maps.gov.bc.ca/ess/hm/imap4m/';
}

/**
 * Build Realtor.ca map URL centered on the property for nearby comparables.
 * Uses hash-based deep-link with ZoomLevel=14 for a neighbourhood view.
 */
export function getComparablesUrl(lat, lng) {
  return `https://www.realtor.ca/map#ZoomLevel=14&Center=${lat}%2C${lng}&Sort=6-D&PropertySearchTypeId=0`;
}

/**
 * Generate a printable HTML page for a parcel report.
 */
export function printParcelReport({ pid, address, area, ownerType, municipality, planNumber, parcelClass, parcelName, lat, lng }) {
  const html = `<!DOCTYPE html>
<html><head>
<title>Parcel Report - ${pid}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 40px auto; padding: 0 20px; color: #1f2937; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  .field label { display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; margin-bottom: 2px; }
  .field span { font-size: 15px; font-weight: 500; }
  .divider { border-top: 1px solid #e5e7eb; margin: 20px 0; }
  .footer { font-size: 11px; color: #9ca3af; margin-top: 32px; }
  @media print { body { margin: 20px; } }
</style>
</head><body>
<h1>${parcelName || 'Property Report'}</h1>
<p class="subtitle">${address || 'Address not available'}</p>
<div class="grid">
  <div class="field"><label>PID</label><span>${pid}</span></div>
  <div class="field"><label>Area</label><span>${area}</span></div>
  <div class="field"><label>Owner Type</label><span>${ownerType}</span></div>
  <div class="field"><label>Municipality</label><span>${municipality}</span></div>
  ${planNumber ? `<div class="field"><label>Plan</label><span>${planNumber}</span></div>` : ''}
  ${parcelClass ? `<div class="field"><label>Class</label><span>${parcelClass}</span></div>` : ''}
  ${lat ? `<div class="field"><label>Coordinates</label><span>${lat.toFixed(6)}, ${lng.toFixed(6)}</span></div>` : ''}
</div>
<div class="divider"></div>
<p class="footer">Generated from LotLine BC on ${new Date().toLocaleDateString('en-CA')}. Data source: ParcelMap BC / BC Open Government Licence.</p>
<script>window.print();</script>
</body></html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

// --- Bookmark helpers (localStorage) ---
const BOOKMARKS_KEY = 'bc-parcel-bookmarks';

export function getBookmarks() {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY)) || [];
  } catch {
    return [];
  }
}

export function addBookmark(parcel) {
  const bookmarks = getBookmarks();
  if (!bookmarks.find((b) => b.pid === parcel.pid)) {
    bookmarks.push(parcel);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  }
  return bookmarks;
}

export function removeBookmark(pid) {
  const bookmarks = getBookmarks().filter((b) => b.pid !== pid);
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  return bookmarks;
}

export function isBookmarked(pid) {
  return getBookmarks().some((b) => b.pid === pid);
}
