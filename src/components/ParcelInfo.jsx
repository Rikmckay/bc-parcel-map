import { useState, useEffect } from 'react';
import { formatArea, formatPID, reverseGeocode } from '../utils/api';

export default function ParcelInfo({ feature, onClose }) {
  const [address, setAddress] = useState(null);
  const [loadingAddr, setLoadingAddr] = useState(false);
  const p = feature?.properties || {};

  // Try to reverse geocode the parcel centroid for address
  useEffect(() => {
    if (!feature?.geometry) return;
    setAddress(null);
    setLoadingAddr(true);

    const controller = new AbortController();

    // Calculate rough centroid from first coordinate ring
    const coords = feature.geometry.type === 'MultiPolygon'
      ? feature.geometry.coordinates[0][0]
      : feature.geometry.coordinates[0];

    if (!coords || coords.length === 0) {
      setLoadingAddr(false);
      return;
    }

    let sumLat = 0, sumLng = 0;
    for (const [lng, lat] of coords) {
      sumLat += lat;
      sumLng += lng;
    }
    const centLat = sumLat / coords.length;
    const centLng = sumLng / coords.length;

    reverseGeocode(centLat, centLng, controller.signal).then((addr) => {
      if (!controller.signal.aborted) {
        setAddress(addr);
        setLoadingAddr(false);
      }
    });

    return () => controller.abort();
  }, [feature]);

  const pid = p.PID_FORMATTED || formatPID(p.PID_NUMBER);
  const area = formatArea(p.FEATURE_AREA_SQM);
  const ownerType = p.OWNER_TYPE || 'Unknown';
  const municipality = p.MUNICIPALITY || 'N/A';
  const parcelName = p.PARCEL_NAME || '';
  const planNumber = p.PLAN_NUMBER || '';
  const parcelClass = p.PARCEL_CLASS || '';

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
