import { useState, useEffect } from 'react';
import {
  formatArea,
  formatPID,
  reverseGeocode,
  getStreetViewUrl,
  getShareUrl,
  isBookmarked,
} from '../utils/api';

export default function ParcelInfo({ feature, onClose, onBookmark, onToast }) {
  const [address, setAddress] = useState(null);
  const [loadingAddr, setLoadingAddr] = useState(false);
  const p = feature?.properties || {};

  const pid = p.PID_FORMATTED || formatPID(p.PID_NUMBER);
  const pidNum = String(p.PID_NUMBER || '').padStart(9, '0');
  const area = formatArea(p.FEATURE_AREA_SQM);
  const ownerType = p.OWNER_TYPE || 'Unknown';
  const municipality = p.MUNICIPALITY || 'N/A';
  const parcelName = p.PARCEL_NAME || '';
  const planNumber = p.PLAN_NUMBER || '';
  const parcelClass = p.PARCEL_CLASS || '';

  // Calculate centroid
  const getCentroid = () => {
    if (!feature?.geometry) return null;
    const coords =
      feature.geometry.type === 'MultiPolygon'
        ? feature.geometry.coordinates[0][0]
        : feature.geometry.coordinates[0];

    if (!coords || coords.length === 0) return null;

    let sumLat = 0,
      sumLng = 0;
    for (const [lng, lat] of coords) {
      sumLat += lat;
      sumLng += lng;
    }
    return {
      lat: sumLat / coords.length,
      lng: sumLng / coords.length,
    };
  };

  // Reverse geocode for address
  useEffect(() => {
    if (!feature?.geometry) return;
    setAddress(null);
    setLoadingAddr(true);

    const controller = new AbortController();
    const centroid = getCentroid();

    if (!centroid) {
      setLoadingAddr(false);
      return;
    }

    reverseGeocode(centroid.lat, centroid.lng, controller.signal).then((addr) => {
      if (!controller.signal.aborted) {
        setAddress(addr);
        setLoadingAddr(false);
      }
    });

    return () => controller.abort();
  }, [feature]);

  const handleShare = () => {
    const url = getShareUrl(pidNum);
    navigator.clipboard.writeText(url).then(() => {
      onToast('Share link copied!');
    }).catch(() => {
      onToast('Could not copy link');
    });
    // Also update URL without reload
    window.history.replaceState(null, '', `?pid=${pidNum.replace(/-/g, '')}`);
  };

  const handleStreetView = () => {
    const centroid = getCentroid();
    if (centroid) {
      window.open(getStreetViewUrl(centroid.lat, centroid.lng), '_blank');
    }
  };

  const handleBCAssessment = () => {
    // Copy PID and open BC Assessment
    navigator.clipboard.writeText(pid).then(() => {
      onToast('PID copied - paste in search');
    }).catch(() => {});
    window.open('https://www.bcassessment.ca/', '_blank');
  };

  const handleBookmark = () => {
    const centroid = getCentroid();
    onBookmark({
      pid: pidNum,
      pidFormatted: pid,
      name: parcelName || address || pid,
      address: address || '',
      municipality,
      area,
      lat: centroid?.lat,
      lng: centroid?.lng,
      savedAt: new Date().toISOString(),
    });
  };

  const bookmarked = isBookmarked(pidNum);

  return (
    <div className="parcel-info">
      <div className="parcel-info-header">
        <div className="parcel-info-title">
          <h3>{parcelName || 'Property Details'}</h3>
          {address && <p className="parcel-address">{address}</p>}
          {loadingAddr && !address && (
            <p className="parcel-address loading">Looking up address...</p>
          )}
        </div>
        <button className="parcel-close" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Action buttons */}
      <div className="parcel-actions">
        <button className="parcel-action-btn" onClick={handleShare} title="Copy share link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
          </svg>
          <span>Share</span>
        </button>
        <button className="parcel-action-btn" onClick={handleBCAssessment} title="Open BC Assessment">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span>Assessment</span>
        </button>
        <button className="parcel-action-btn" onClick={handleStreetView} title="Open Street View">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="5" r="3" />
            <path d="M12 8v8M8 21l4-5 4 5" />
          </svg>
          <span>Street View</span>
        </button>
        <button
          className={`parcel-action-btn${bookmarked ? ' bookmarked' : ''}`}
          onClick={handleBookmark}
          title={bookmarked ? 'Remove bookmark' : 'Bookmark property'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={bookmarked ? '#f59e0b' : 'none'} stroke={bookmarked ? '#f59e0b' : 'currentColor'} strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          <span>{bookmarked ? 'Saved' : 'Save'}</span>
        </button>
      </div>

      <div className="parcel-info-grid">
        <div className="parcel-field">
          <span className="parcel-label">PID</span>
          <span className="parcel-value">{pid}</span>
        </div>
        <div className="parcel-field">
          <span className="parcel-label">Area</span>
          <span className="parcel-value">{area}</span>
        </div>
        <div className="parcel-field">
          <span className="parcel-label">Owner Type</span>
          <span className="parcel-value">{ownerType}</span>
        </div>
        <div className="parcel-field">
          <span className="parcel-label">Municipality</span>
          <span className="parcel-value">{municipality}</span>
        </div>
        {planNumber && (
          <div className="parcel-field">
            <span className="parcel-label">Plan</span>
            <span className="parcel-value">{planNumber}</span>
          </div>
        )}
        {parcelClass && (
          <div className="parcel-field">
            <span className="parcel-label">Class</span>
            <span className="parcel-value">{parcelClass}</span>
          </div>
        )}
      </div>
    </div>
  );
}
