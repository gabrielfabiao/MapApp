import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../../context/AppContext';

export default function Toolbar({ onImageUpload, onOpenSettings }) {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const project = state.currentProject;

  const handleTitleClick = (e) => {
    const span = e.currentTarget;
    const current = project.name;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = current;
    input.className = 'toolbar-title-input';

    const save = () => {
      const name = input.value.trim();
      if (name && name !== current) {
        dispatch({ type: 'RENAME_PROJECT', id: project.id, name });
      }
      input.replaceWith(span);
    };

    input.addEventListener('blur', save);
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); }
      if (ev.key === 'Escape') { input.value = current; input.blur(); }
    });

    span.replaceWith(input);
    input.focus();
    input.select();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onImageUpload(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const isNumbers = (project?.markerType || 'number') === 'number';

  return (
    <div className="workspace-toolbar">

      {/* 1 — Back */}
      <button className="btn" id="back-btn" title="Go Back" onClick={() => navigate('/')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>

      {/* 2 — Project name */}
      <h1
        className="title toolbar-title"
        id="project-title"
        title="Click to rename"
        onClick={handleTitleClick}
      >
        {project?.name || 'Project'}
      </h1>

      {/* 3 — Hint */}
      <span className="hint">Scroll: Zoom &bull; Shift+Drag: Pan</span>

      {/* 4 — Upload image */}
      <button className="btn btn-icon" id="upload-btn" title="Upload Image" onClick={() => fileInputRef.current?.click()}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </button>
      <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleFileChange} />

      {/* 5 — Reset zoom */}
      <button
        className="btn btn-icon"
        id="reset-zoom-btn"
        title="Reset Zoom"
        onClick={() => dispatch({ type: 'SET_ZOOM', zoom: { scale: 1, x: 0, y: 0 } })}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
      </button>

      <span className="toolbar-divider" />

      {/* 6 — Marker type toggle */}
      <button
        className="btn btn-icon"
        id="marker-type-select"
        title={isNumbers ? 'Switch to Letters' : 'Switch to Numbers'}
        onClick={() => dispatch({ type: 'UPDATE_CURRENT_PROJECT', patch: { markerType: isNumbers ? 'letter' : 'number' } })}
      >
        <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
          {isNumbers ? '123' : 'ABC'}
        </span>
      </button>

      {/* 7 — Weather */}
      <button
        className={`btn btn-icon${state.isWeatherOpen ? ' active' : ''}`}
        id="weather-toggle-btn"
        title="Weather Forecast"
        onClick={() => dispatch({ type: 'TOGGLE_WEATHER' })}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
        </svg>
      </button>

      {/* 8 — Buildings mode */}
      <button
        className={`btn btn-icon${state.mode === 'buildings' ? ' active' : ''}`}
        id="mode-buildings-btn"
        title="Buildings Mode"
        onClick={() => dispatch({ type: 'SET_MODE', mode: state.mode === 'buildings' ? 'markers' : 'buildings' })}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      </button>

      {/* 9 — Shadows toggle */}
      <button
        className={`btn btn-icon${state.showShadows ? ' active' : ''}`}
        id="toggle-shadows-btn"
        title="Toggle Shadows"
        onClick={() => dispatch({ type: 'TOGGLE_SHADOWS' })}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
          <ellipse cx="12" cy="18" rx="6" ry="2.5" opacity="0.4"/>
          <circle cx="12" cy="10" r="5"/>
        </svg>
      </button>

      {/* 10 — Sidebar toggle */}
      <button
        className={`btn${state.isDrawerOpen ? ' active' : ''}`}
        id="sidebar-toggle-btn"
        title="Toggle Sidebar"
        onClick={() => dispatch({ type: 'TOGGLE_DRAWER' })}
      >
        <span className="sidebar-toggle-icon" style={{ display: 'inline-block', transition: 'transform 0.2s', transform: state.isDrawerOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>&#9776;</span>
      </button>

      {/* 11 — API key / Settings */}
      <button
        className="btn btn-icon"
        id="settings-btn"
        title="API Settings"
        onClick={onOpenSettings}
      >
        <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '-0.02em' }}>API</span>
      </button>

    </div>
  );
}
