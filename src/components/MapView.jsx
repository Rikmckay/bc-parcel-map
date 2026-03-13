import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchParcels } from '../utils/api';

const TILES = {
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
  },
};

const PARCEL_STYLE = {
  color: '#2563eb',
  weight: 2,
  opacity: 0.8,
  fillColor: '#3b82f6',
  fillOpacity: 0.06,
};

const SELECTED_STYLE = {
  color: '#f59e0b',
  weight: 3,
  opacity: 1,
  fillColor: '#fbbf24',
  fillOpacity: 0.2,
};

const MIN_ZOOM_FOR_PARCELS = 15;
const DEFAULT_CENTER = [49.3187, -124.3156]; // Parksville
const DEFAULT_ZOOM = 15;

export default function MapView({ onParcelClick, flyTo, onToast }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const parcelLayerRef = useRef(null);
  const selectedLayerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const locationMarkerRef = useRef(null);
  const locationCircleRef = useRef(null);
  const fetchControllerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [tileMode, setTileMode] = useState('streets');
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM);
  const [loading, setLoading] = useState(false);

  // Initialize map
  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false,
    });

    // Add attribution in bottom-left (less intrusive on mobile)
    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map);

    // Add zoom control top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Add tile layer
    const tileLayer = L.tileLayer(TILES.streets.url, {
      attribution: TILES.streets.attribution,
      maxZoom: 19,
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Add parcel GeoJSON layer
    const parcelLayer = L.geoJSON(null, {
      style: PARCEL_STYLE,
      onEachFeature: (feature, layer) => {
        layer.on('click', () => {
          // Highlight selected parcel
          if (selectedLayerRef.current) {
            selectedLayerRef.current.setStyle(PARCEL_STYLE);
          }
          layer.setStyle(SELECTED_STYLE);
          layer.bringToFront();
          selectedLayerRef.current = layer;
          onParcelClick(feature);
        });
      },
    }).addTo(map);
    parcelLayerRef.current = parcelLayer;

    mapRef.current = map;
    setMapReady(true);

    // Track zoom
    map.on('zoomend', () => {
      setZoomLevel(map.getZoom());
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onParcelClick]);

  // Load parcels on map move
  const loadParcels = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;

    const zoom = map.getZoom();
    if (zoom < MIN_ZOOM_FOR_PARCELS) {
      parcelLayerRef.current?.clearLayers();
      return;
    }

    // Cancel any in-flight request
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
    }
    const controller = new AbortController();
    fetchControllerRef.current = controller;

    setLoading(true);
    try {
      const b = map.getBounds();
      const bounds = {
        west: b.getWest(),
        south: b.getSouth(),
        east: b.getEast(),
        north: b.getNorth(),
      };
      const data = await fetchParcels(bounds, controller.signal);

      if (!controller.signal.aborted) {
        parcelLayerRef.current.clearLayers();
        parcelLayerRef.current.addData(data);
        selectedLayerRef.current = null;

        if (data.features && data.features.length >= 4000) {
          onToast('Zoom in for complete coverage');
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Parcel fetch error:', err);
        onToast('Error loading parcels');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [onToast]);

  // Debounced parcel loading on map move
  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;

    let timeout;
    const handleMove = () => {
      clearTimeout(timeout);
      timeout = setTimeout(loadParcels, 400);
    };

    map.on('moveend', handleMove);
    // Initial load
    loadParcels();

    return () => {
      map.off('moveend', handleMove);
      clearTimeout(timeout);
    };
  }, [mapReady, loadParcels]);

  // Handle flyTo from search
  useEffect(() => {
    if (!flyTo || !mapRef.current) return;
    mapRef.current.flyTo([flyTo.lat, flyTo.lng], flyTo.zoom || 17, {
      duration: 1.5,
    });
  }, [flyTo]);

  // Toggle tile layer
  useEffect(() => {
    if (!tileLayerRef.current || !mapRef.current) return;
    const mode = tileMode;
    tileLayerRef.current.setUrl(TILES[mode].url);
  }, [tileMode]);

  // GPS locate
  const handleLocate = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!navigator.geolocation) {
      onToast('Geolocation not supported');
      return;
    }

    onToast('Finding your location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        // Remove old markers
        if (locationMarkerRef.current) {
          map.removeLayer(locationMarkerRef.current);
        }
        if (locationCircleRef.current) {
          map.removeLayer(locationCircleRef.current);
        }

        // Blue dot marker
        const marker = L.circleMarker([latitude, longitude], {
          radius: 8,
          fillColor: '#4285f4',
          fillOpacity: 1,
          color: '#ffffff',
          weight: 3,
          opacity: 1,
        }).addTo(map);
        locationMarkerRef.current = marker;

        // Accuracy circle
        const circle = L.circle([latitude, longitude], {
          radius: accuracy,
          color: '#4285f4',
          fillColor: '#4285f4',
          fillOpacity: 0.1,
          weight: 1,
        }).addTo(map);
        locationCircleRef.current = circle;

        map.flyTo([latitude, longitude], 17, { duration: 1.5 });
      },
      (err) => {
        if (err.code === 1) {
          onToast('Location access denied');
        } else {
          onToast('Could not get location');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onToast]);

  const toggleTile = useCallback(() => {
    setTileMode((prev) => (prev === 'streets' ? 'satellite' : 'streets'));
  }, []);

  return (
    <div className="map-wrapper">
      <div ref={mapContainerRef} className="map-container" />

      {/* GPS Button */}
      <button
        className="map-btn gps-btn"
        onClick={handleLocate}
        title="My location"
        aria-label="My location"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
      </button>

      {/* Layer Toggle */}
      <button
        className="map-btn layer-btn"
        onClick={toggleTile}
        title={tileMode === 'streets' ? 'Satellite view' : 'Street view'}
        aria-label="Toggle map style"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {tileMode === 'streets' ? (
            <>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 12h18M12 3v18" />
            </>
          ) : (
            <>
              <path d="M3 7l6-4 6 4 6-4v14l-6 4-6-4-6 4V7z" />
              <path d="M9 3v14M15 7v14" />
            </>
          )}
        </svg>
      </button>

      {/* Zoom message */}
      {zoomLevel < MIN_ZOOM_FOR_PARCELS && (
        <div className="zoom-message">Zoom in to see property boundaries</div>
      )}

      {/* Loading indicator */}
      {loading && zoomLevel >= MIN_ZOOM_FOR_PARCELS && (
        <div className="loading-indicator">
          <div className="loading-spinner" />
        </div>
      )}

      {/* Attribution for ParcelMap BC */}
      <div className="pmbc-attribution">
        Contains information licensed under the Open Government Licence - British Columbia
      </div>
    </div>
  );
}
