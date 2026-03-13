import { useState, useRef, useCallback, useEffect } from 'react';
import { searchAddress } from '../utils/api';

export default function SearchBar({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const controllerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const doSearch = useCallback(async (q) => {
    if (q.trim().length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setSearching(true);
    try {
      const res = await searchAddress(q, controller.signal);
      if (!controller.signal.aborted) {
        setResults(res);
        setIsOpen(res.length > 0);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Search error:', err);
      }
    } finally {
      if (!controller.signal.aborted) setSearching(false);
    }
  }, []);

  const handleChange = useCallback(
    (e) => {
      const val = e.target.value;
      setQuery(val);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doSearch(val), 350);
    },
    [doSearch]
  );

  const handleSelect = useCallback(
    (result) => {
      setQuery(result.address);
      setIsOpen(false);
      setResults([]);
      inputRef.current?.blur();
      onSelect(result);
    },
    [onSelect]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.search-bar')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <svg
          className="search-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6b7280"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Search address or place..."
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setIsOpen(true)}
        />
        {query && (
          <button className="search-clear" onClick={handleClear} aria-label="Clear search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
        {searching && <div className="search-spinner" />}
      </div>
      {isOpen && (
        <ul className="search-results">
          {results.map((r, i) => (
            <li key={i} className="search-result-item" onClick={() => handleSelect(r)}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6b7280"
                strokeWidth="2"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{r.address}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
