import { useState, useEffect } from 'react';
import SunCalc from 'suncalc';
import { useAppState } from '../../context/AppContext';

function parseCoord(val) {
  return parseFloat(String(val).replace(',', '.'));
}

export default function SunPanel() {
  const { state, dispatch } = useAppState();
  const project = state.currentProject;

  const loc = project?.location || { lat: 51.5, lng: -0.1 };
  const sunDate = state.sunDate || new Date();

  const [lat, setLat] = useState(String(loc.lat));
  const [lng, setLng] = useState(String(loc.lng));
  const [bearing, setBearing] = useState(String(project?.northBearing || 0));
  const [scale, setScale] = useState(String(project?.pixelsPerUnit || 10));
  const [timeStr, setTimeStr] = useState(sunDate.toTimeString().substring(0, 5));

  const timeMinutes = sunDate.getHours() * 60 + sunDate.getMinutes();

  // Sun stats
  const pos = SunCalc.getPosition(sunDate, parseCoord(lat) || 0, parseCoord(lng) || 0);
  const altDeg = pos.altitude * 180 / Math.PI;
  const aziDeg = (pos.azimuth * 180 / Math.PI + 180) % 360;
  const intensity = Math.max(0, Math.min(100, (pos.altitude / (Math.PI / 2)) * 100));

  const saveProject = (patch) => {
    dispatch({ type: 'UPDATE_CURRENT_PROJECT', patch });
  };

  const handleLocationChange = (newLat, newLng, newBearing, newScale) => {
    saveProject({
      location: { lat: parseCoord(newLat) || 0, lng: parseCoord(newLng) || 0 },
      northBearing: parseFloat(newBearing) || 0,
      pixelsPerUnit: parseFloat(newScale) || 10,
    });
  };

  const handleTimeChange = (newTimeStr) => {
    const [h, m] = newTimeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return;
    const newDate = new Date(sunDate);
    newDate.setHours(h, m, 0, 0);
    dispatch({ type: 'SET_SUN_DATE', date: newDate });
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const newLat = pos.coords.latitude.toFixed(4);
      const newLng = pos.coords.longitude.toFixed(4);
      setLat(newLat);
      setLng(newLng);
      handleLocationChange(newLat, newLng, bearing, scale);
    });
  };

  return (
    <div className="sun-panel">
      <div className="form-group">
        <label className="form-label">Location (Lat / Lng)</label>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <input
            type="number"
            id="sun-lat"
            className="search-input"
            style={{ paddingLeft: '0.75rem' }}
            step="any"
            value={lat}
            onChange={e => { setLat(e.target.value); handleLocationChange(e.target.value, lng, bearing, scale); }}
          />
          <input
            type="number"
            id="sun-lng"
            className="search-input"
            style={{ paddingLeft: '0.75rem' }}
            step="any"
            value={lng}
            onChange={e => { setLng(e.target.value); handleLocationChange(lat, e.target.value, bearing, scale); }}
          />
        </div>
        <button
          className="btn"
          style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem', padding: '0.4rem' }}
          onClick={handleUseLocation}
        >
          📍 Use My Location
        </button>
      </div>

      <div className="form-group">
        <label className="form-label">North Bearing (°)</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="range"
            id="sun-bearing-slider"
            min="0" max="360"
            value={bearing}
            style={{ flex: 1 }}
            onChange={e => { setBearing(e.target.value); handleLocationChange(lat, lng, e.target.value, scale); }}
          />
          <input
            type="number"
            id="sun-bearing-input"
            className="search-input"
            style={{ width: 70, paddingLeft: '0.5rem' }}
            min="0" max="360"
            value={bearing}
            onChange={e => { setBearing(e.target.value); handleLocationChange(lat, lng, e.target.value, scale); }}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Shadow Scale Factor</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="range"
            id="sun-scale-slider"
            min="1" max="100"
            value={scale}
            style={{ flex: 1 }}
            onChange={e => { setScale(e.target.value); handleLocationChange(lat, lng, bearing, e.target.value); }}
          />
          <input
            type="number"
            id="sun-scale-input"
            className="search-input"
            style={{ width: 70, paddingLeft: '0.5rem' }}
            min="1" max="100"
            value={scale}
            onChange={e => { setScale(e.target.value); handleLocationChange(lat, lng, bearing, e.target.value); }}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Time of Day</label>
        <input
          type="time"
          id="sun-time-input"
          className="search-input"
          style={{ width: '100%', paddingLeft: '0.75rem' }}
          value={timeStr}
          onChange={e => { setTimeStr(e.target.value); handleTimeChange(e.target.value); }}
        />
        <input
          type="range"
          id="sun-time-slider"
          min="0" max="1439"
          value={timeMinutes}
          style={{ width: '100%', marginTop: '0.5rem' }}
          onChange={e => {
            const h = Math.floor(e.target.value / 60);
            const m = e.target.value % 60;
            const t = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            setTimeStr(t);
            handleTimeChange(t);
          }}
        />
      </div>

      <div className="sun-stats">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Altitude</span>
          <strong id="sun-stat-alt">{altDeg.toFixed(1)}°</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Azimuth</span>
          <strong id="sun-stat-azi">{aziDeg.toFixed(1)}°</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Intensity</span>
          <strong id="sun-stat-int">{intensity.toFixed(0)}%</strong>
        </div>
      </div>
    </div>
  );
}
