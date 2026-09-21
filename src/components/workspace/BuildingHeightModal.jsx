'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function BuildingHeightModal({ isOpen, initialHeight, title, onConfirm, onCancel }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setValue(String(initialHeight ?? 10));
      setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 50);
    }
  }, [isOpen, initialHeight]);

  if (!isOpen) return null;

  const parsed = parseFloat(value);
  const isValid = !isNaN(parsed) && parsed > 0;

  const handleConfirm = () => {
    if (isValid) onConfirm(parsed);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') onCancel();
  };

  // Portaled to <body>: the overlay lives inside the zoomed/transformed
  // canvas, and position:fixed is relative to a transformed ancestor.
  return createPortal(
    <div className="modal-overlay open" style={{ zIndex: 5000 }} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal" style={{ maxWidth: '400px' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--amazon-dark)' }}>{title}</h3>
        <div className="form-group">
          <label className="form-label" htmlFor="building-height-input">Height (m)</label>
          <input
            ref={inputRef}
            id="building-height-input"
            type="number"
            inputMode="decimal"
            min="0.1"
            step="0.5"
            className="search-input"
            style={{ paddingLeft: '1rem' }}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={!isValid}>Save</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
