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

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
          <button className="btn btn-primary" onClick={handleSave}>Save Settings</button>
        </div>
      </div>
    </div>
  );
}
