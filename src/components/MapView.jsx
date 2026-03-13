import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchParcels, fetchALR } from '../utils/api';

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

const ALR_STYLE = {
  color: '#16a34a',
  weight: 2,
  opacity: 0.6,
  fillColor: '#22c55e',
  fillOpacity: 0.15,
  dashArray: '6 4',
};

const MIN_ZOOM_FOR_PARCELS = 15;
const MIN_ZOOM_FOR_ALR = 12;
const DEFAULT_CENTER = [49.3187, -124.3156]; // Parksville
const DEFAULT_ZOOM = 15;

export default function MapView({
  onParcelClick,
  flyTo,
  onToast,
  showALR,
  onToggleALR,
  measureMode,
  onToggleMeasure,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const parcelLayerRef = useRef(null);
  const selectedLayerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const locationMarkerRef = useRef(null);
  const locationCircleRef = useRef(null);
  const fetchControllerRef = useRef(null);
  const alrLayerRef = useRef(null);
  const alrFetchRef = useRef(null);
  const measurePointsRef = useRef([]);
  const measureLayerRef = useRef(null);
  const measureMarkersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);
  const [tileMode, setTileMode] = useState('streets');
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM);
  const [loading, setLoading] = useState(false);
  const [measureDistance, setMeasureDistance] = useState(null);

  // Initialize map
  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);

    const tileLayer = L.tileLayer(TILES.streets.url, {
      attribution: TILES.streets.attribution,
      maxZoom: 19,
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // ALR layer (below parcels)
    const alrLayer = L.geoJSON(null, { style: ALR_STYLE });
    alrLayerRef.current = alrLayer;

    // Parcel layer
    const parcelLayer = L.geoJSON(null, {
      style: PARCEL_STYLE,
      onEachFeature: (feature, layer) => {
        layer.on('click', () => {
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

    // Measure layer
    const measureLayer = L.layerGroup().addTo(map);
    measureLayerRef.current = measureLayer;

    mapRef.current = map;
    setMapReady(true);

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

  // Load ALR data
  const loadALR = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !showALR) return;

    const zoom = map.getZoom();
    if (zoom < MIN_ZOOM_FOR_ALR) {
      alrLayerRef.current?.clearLayers();
      return;
    }

    if (alrFetchRef.current) {
      alrFetchRef.current.abort();
    }
    const controller = new AbortController();
    alrFetchRef.current = controller;

    try {
      const b = map.getBounds();
      const bounds = {
        west: b.getWest(),
        south: b.getSouth(),
        east: b.getEast(),
        north: b.getNorth(),
      };
      const data = await fetchALR(bounds, controller.signal);

      if (!controller.signal.aborted) {
        alrLayerRef.current.clearLayers();
        alrLayerRef.current.addData(data);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('ALR fetch error:', err);
      }
    }
  }, [showALR]);

  // Toggle ALR layer visibility
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    if (showALR) {
      alrLayerRef.current.addTo(mapRef.current);
      loadALR();
    } else {
      mapRef.current.removeLayer(alrLayerRef.current);
    }
  }, [showALR, mapReady, loadALR]);

  // Debounced parcel + ALR loading on map move
  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;

    let timeout;
    const handleMove = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        loadParcels();
        if (showALR) loadALR();
      }, 400);
    };

    map.on('moveend', handleMove);
    loadParcels();

    return () => {
      map.off('moveend', handleMove);
      clearTimeout(timeout);
    };
  }, [mapReady, loadParcels, loadALR, showALR]);

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
    tileLayerRef.current.setUrl(TILES[tileMode].url);
  }, [tileMode]);

  // Measure tool click handler
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!measureMode) {
      // Clean up measure when turned off
      measureLayerRef.current?.clearLayers();
      measurePointsRef.current = [];
      measureMarkersRef.current = [];
      setMeasureDistance(null);
      map.getContainer().style.cursor = '';
      return;
    }

    map.getContainer().style.cursor = 'crosshair';

    const handleClick = (e) => {
      const point = e.latlng;
      measurePointsRef.current.push(point);

      // Add marker
      const marker = L.circleMarker(point, {
        radius: 5,
        fillColor: '#ef4444',
        fillOpacity: 1,
        color: '#ffffff',
        weight: 2,
      }).addTo(measureLayerRef.current);
      measureMarkersRef.current.push(marker);

      // Draw line between points
      if (measurePointsRef.current.length > 1) {
        const pts = measurePointsRef.current;
        L.polyline([pts[pts.length - 2], pts[pts.length - 1]], {
          color: '#ef4444',
          weight: 3,
          dashArray: '8 4',
        }).addTo(measureLayerRef.current);

        // Calculate total distance
        let total = 0;
        for (let i = 1; i < pts.length; i++) {
          total += pts[i - 1].distanceTo(pts[i]);
        }
        setMeasureDistance(total);
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
      map.getContainer().style.cursor = '';
    };
  }, [measureMode]);

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

        if (locationMarkerRef.current) {
          map.removeLayer(locationMarkerRef.current);
        }
        if (locationCircleRef.current) {
          map.removeLayer(locationCircleRef.current);
        }

        const marker = L.circleMarker([latitude, longitude], {
          radius: 8,
          fillColor: '#4285f4',
          fillOpacity: 1,
          color: '#ffffff',
          weight: 3,
          opacity: 1,
        }).addTo(map);
        locationMarkerRef.current = marker;

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

  const clearMeasure = useCallback(() => {
    measureLayerRef.current?.clearLayers();
    measurePointsRef.current = [];
    measureMarkersRef.current = [];
    setMeasureDistance(null);
  }, []);

  const formatMeasure = (meters) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
    return `${Math.round(meters)} m`;
  };

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

      {/* ALR Toggle */}
      <button
        className={`map-btn alr-btn${showALR ? ' active' : ''}`}
        onClick={onToggleALR}
        title="Toggle ALR overlay"
        aria-label="Toggle Agricultural Land Reserve"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill={showALR ? '#16a34a' : 'none'} stroke={showALR ? '#16a34a' : 'currentColor'} strokeWidth="2">
          <path d="M3 21h18" />
          <path d="M12 3C7 8 4 12 4 15a8 8 0 0 0 16 0c0-3-3-7-8-12z" />
        </svg>
      </button>

      {/* Measure Toggle */}
      <button
        className={`map-btn measure-btn${measureMode ? ' active' : ''}`}
        onClick={onToggleMeasure}
        title="Measure distance"
        aria-label="Measure distance"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={measureMode ? '#ef4444' : 'currentColor'} strokeWidth="2">
          <path d="M2 2l20 20" />
          <path d="M5 2v5M2 5h5" />
          <path d="M19 22v-5M22 19h-5" />
        </svg>
      </button>

      {/* Measure distance display */}
      {measureMode && (
        <div className="measure-bar">
          <span>
            {measureDistance != null
              ? `Distance: ${formatMeasure(measureDistance)}`
              : 'Tap points to measure'}
          </span>
          {measureDistance != null && (
            <button className="measure-clear" onClick={clearMeasure}>
              Clear
            </button>
          )}
        </div>
      )}

      {/* Zoom message */}
      {zoomLevel < MIN_ZOOM_FOR_PARCELS && !measureMode && (
        <div className="zoom-message">Zoom in to see property boundaries</div>
      )}

      {/* Loading indicator */}
      {loading && zoomLevel >= MIN_ZOOM_FOR_PARCELS && (
        <div className="loading-indicator">
          <div className="loading-spinner" />
        </div>
      )}

      {/* ALR legend */}
      {showALR && (
        <div className="alr-legend">
          <span className="alr-legend-swatch" />
          ALR Land
        </div>
      )}

      {/* Attribution */}
      <div className="pmbc-attribution">
        Contains information licensed under the Open Government Licence - British Columbia
      </div>
    </div>
  );
}
