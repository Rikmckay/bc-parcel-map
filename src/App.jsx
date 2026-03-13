import { useState, useCallback, useEffect } from 'react';
import MapView from './components/MapView';
import SearchBar from './components/SearchBar';
import ParcelInfo from './components/ParcelInfo';
import BookmarkPanel from './components/BookmarkPanel';
import {
  fetchParcelByPID,
  getBookmarks,
  addBookmark,
  removeBookmark,
  isBookmarked,
  formatPID,
} from './utils/api';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [flyTo, setFlyTo] = useState(null);
  const [toast, setToast] = useState('');
  const [showALR, setShowALR] = useState(false);
  const [measureMode, setMeasureMode] = useState(false);
  const [bookmarks, setBookmarks] = useState(() => getBookmarks());
  const [showBookmarks, setShowBookmarks] = useState(false);

  // Splash screen auto-dismiss
  useEffect(() => {
    const fadeTimer = setTimeout(() => setSplashFading(true), 1800);
    const hideTimer = setTimeout(() => setShowSplash(false), 2400);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, []);

  const showToast = useCallback((msg, duration = 3000) => {
    setToast(msg);
    setTimeout(() => setToast(''), duration);
  }, []);

  // Handle ?pid= URL parameter on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('pid');
    if (!pid) return;

    fetchParcelByPID(pid).then((data) => {
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        setSelectedParcel(feature);

        // Fly to the parcel centroid
        const coords =
          feature.geometry.type === 'MultiPolygon'
            ? feature.geometry.coordinates[0][0]
            : feature.geometry.coordinates[0];

        if (coords && coords.length > 0) {
          let sumLat = 0,
            sumLng = 0;
          for (const [lng, lat] of coords) {
            sumLat += lat;
            sumLng += lng;
          }
          setFlyTo({
            lat: sumLat / coords.length,
            lng: sumLng / coords.length,
            zoom: 18,
          });
        }
      } else {
        showToast('Parcel not found');
      }
    }).catch(() => {
      showToast('Error loading shared parcel');
    });
  }, [showToast]);

  const handleSearchSelect = useCallback((result) => {
    setFlyTo({ lat: result.location[0], lng: result.location[1], zoom: 17 });
  }, []);

  const handleParcelClick = useCallback((feature) => {
    setSelectedParcel(feature);
    setMeasureMode(false);
  }, []);

  const handleCloseParcel = useCallback(() => {
    setSelectedParcel(null);
  }, []);

  const handleToggleBookmark = useCallback(
    (parcelData) => {
      if (isBookmarked(parcelData.pid)) {
        const updated = removeBookmark(parcelData.pid);
        setBookmarks(updated);
        showToast('Bookmark removed');
      } else {
        const updated = addBookmark(parcelData);
        setBookmarks(updated);
        showToast('Property bookmarked');
      }
    },
    [showToast]
  );

  const handleBookmarkSelect = useCallback(
    (bookmark) => {
      setShowBookmarks(false);
      if (bookmark.lat && bookmark.lng) {
        setFlyTo({ lat: bookmark.lat, lng: bookmark.lng, zoom: 18 });
      }
      // Try to load the full parcel data
      fetchParcelByPID(bookmark.pid).then((data) => {
        if (data.features && data.features.length > 0) {
          setSelectedParcel(data.features[0]);
        }
      }).catch(() => {});
    },
    []
  );

  const handleRemoveBookmark = useCallback(
    (pid) => {
      const updated = removeBookmark(pid);
      setBookmarks(updated);
      showToast('Bookmark removed');
    },
    [showToast]
  );

  return (
    <div className="app">
      <SearchBar onSelect={handleSearchSelect} />
      <MapView
        onParcelClick={handleParcelClick}
        flyTo={flyTo}
        onToast={showToast}
        showALR={showALR}
        onToggleALR={() => setShowALR((p) => !p)}
        measureMode={measureMode}
        onToggleMeasure={() => setMeasureMode((p) => !p)}
      />
      {selectedParcel && (
        <ParcelInfo
          feature={selectedParcel}
          onClose={handleCloseParcel}
          onBookmark={handleToggleBookmark}
          onToast={showToast}
        />
      )}

      {/* Bookmark button */}
      <button
        className="map-btn bookmark-btn"
        onClick={() => setShowBookmarks((p) => !p)}
        title="Saved properties"
        aria-label="Saved properties"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill={bookmarks.length > 0 ? '#f59e0b' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {showBookmarks && (
        <BookmarkPanel
          bookmarks={bookmarks}
          onSelect={handleBookmarkSelect}
          onRemove={handleRemoveBookmark}
          onClose={() => setShowBookmarks(false)}
        />
      )}

      {toast && <div className="toast">{toast}</div>}

      {showSplash && (
        <div className={`splash${splashFading ? ' splash-fade' : ''}`}>
          <div className="splash-content">
            <svg className="splash-icon" width="56" height="56" viewBox="0 0 100 100">
              <path d="M20 30 L50 15 L80 30 L80 70 L50 85 L20 70 Z" fill="none" stroke="#60a5fa" strokeWidth="3"/>
              <path d="M50 15 L50 85" fill="none" stroke="#60a5fa" strokeWidth="2" opacity="0.5"/>
              <path d="M20 50 L80 50" fill="none" stroke="#60a5fa" strokeWidth="2" opacity="0.5"/>
              <circle cx="50" cy="50" r="6" fill="#3b82f6"/>
              <circle cx="50" cy="50" r="3" fill="white"/>
            </svg>
            <h1 className="splash-title">LotLine BC</h1>
            <p className="splash-byline">by David McKay</p>
          </div>
        </div>
      )}
    </div>
  );
}
