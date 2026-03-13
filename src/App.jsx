import { useState, useCallback } from 'react';
import MapView from './components/MapView';
import SearchBar from './components/SearchBar';
import ParcelInfo from './components/ParcelInfo';

export default function App() {
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [flyTo, setFlyTo] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg, duration = 3000) => {
    setToast(msg);
    setTimeout(() => setToast(''), duration);
  }, []);

  const handleSearchSelect = useCallback((result) => {
    setFlyTo({ lat: result.location[0], lng: result.location[1], zoom: 17 });
  }, []);

  const handleParcelClick = useCallback((feature) => {
    setSelectedParcel(feature);
  }, []);

  const handleCloseParcel = useCallback(() => {
    setSelectedParcel(null);
  }, []);

  return (
    <div className="app">
      <SearchBar onSelect={handleSearchSelect} />
      <MapView
        onParcelClick={handleParcelClick}
        flyTo={flyTo}
        onToast={showToast}
      />
      {selectedParcel && (
        <ParcelInfo feature={selectedParcel} onClose={handleCloseParcel} />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
