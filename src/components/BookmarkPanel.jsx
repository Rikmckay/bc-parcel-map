export default function BookmarkPanel({ bookmarks, onSelect, onRemove, onClose }) {
  if (bookmarks.length === 0) {
    return (
      <div className="bookmark-panel">
        <div className="bookmark-panel-header">
          <h3>Saved Properties</h3>
          <button className="parcel-close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="bookmark-empty">No saved properties yet. Tap a parcel and use the Save button to bookmark it.</p>
      </div>
    );
  }

  return (
    <div className="bookmark-panel">
      <div className="bookmark-panel-header">
        <h3>Saved Properties ({bookmarks.length})</h3>
        <button className="parcel-close" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <ul className="bookmark-list">
        {bookmarks.map((b) => (
          <li key={b.pid} className="bookmark-item">
            <div className="bookmark-info" onClick={() => onSelect(b)}>
              <span className="bookmark-name">{b.name || b.pidFormatted}</span>
              <span className="bookmark-meta">
                {b.pidFormatted} {b.municipality ? `\u00B7 ${b.municipality}` : ''}
              </span>
            </div>
            <button
              className="bookmark-remove"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(b.pid);
              }}
              aria-label="Remove bookmark"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
