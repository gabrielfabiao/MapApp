'use client';

import { useState, useEffect } from 'react';
import { useAppState } from '../../context/AppContext';

export default function SettingsModal({ isOpen, onClose }) {
  const { state, dispatch } = useAppState();
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    if (isOpen) setApiKey(state.settings.plantApiKey || '');
  }, [isOpen, state.settings.plantApiKey]);

  const handleSave = () => {
    dispatch({ type: 'SAVE_SETTINGS', settings: { ...state.settings, plantApiKey: apiKey.trim() } });
    onClose();
  };

  const markers = state.currentProject?.markers || [];

  const handleExportList = () => {
    const lines = markers.map((m, i) => {
      const name = m.title?.trim() || m.scientificName?.trim() || 'Unnamed';
      return `${m.label || i + 1}- ${name}`;
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(state.currentProject?.name || 'markers').trim().replace(/[^\w-]+/g, '_')}-marker-list.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay open" id="settings-modal" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--amazon-dark)' }}>Settings</h2>

        <div className="form-group">
          <label className="form-label">Pl@ntNet API Key</label>
          <input
            type="password"
            className="search-input"
            style={{ paddingLeft: '1rem' }}
            placeholder="Paste your API key here..."
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Marker List</label>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Download a plain-text list of every marker in this project, numbered/lettered and named (e.g. "1- Olive tree").
          </p>
          <button className="btn" onClick={handleExportList} disabled={markers.length === 0}>
            Export Marker List
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
          <button className="btn modal-bottom-close" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Settings</button>
        </div>
      </div>
    </div>
  );
}
