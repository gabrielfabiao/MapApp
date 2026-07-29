import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../../context/AppContext';
import Logo from '../common/Logo';

export default function Toolbar({ onImageUpload, onOpenSettings }) {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const project = state.currentProject;
  const [showShadowsPopover, setShowShadowsPopover] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState(null);
  const toggleBtnRef = useRef(null);
  const popoverContentRef = useRef(null);

  const handleToggleClick = () => {
    if (!showShadowsPopover) {
      const rect = toggleBtnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openAbove = spaceBelow < 90;
      setPopoverStyle({
        left: rect.left + rect.width / 2,
        ...(openAbove ? { bottom: window.innerHeight - rect.top + 12 } : { top: rect.bottom + 12 }),
      });
    }
    setShowShadowsPopover(v => !v);
  };

  useEffect(() => {
    if (!showShadowsPopover) return;
    const handleClickOutside = (e) => {
      if (toggleBtnRef.current?.contains(e.target)) return;
      if (popoverContentRef.current?.contains(e.target)) return;
      setShowShadowsPopover(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showShadowsPopover]);

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

      {/* 0 — Brand mark */}
      <Logo size={20} showWordmark={false} />

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
      <span className="hint">Scroll: Zoom &bull; Space+Drag: Pan</span>

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

      {/* 8/9 — Buildings & Shadows group */}
      <div className="toolbar-group">
        <button
          ref={toggleBtnRef}
          className={`btn btn-icon${state.mode === 'buildings' || state.showShadows ? ' active' : ''}`}
          id="buildings-shadows-toggle-btn"
          title="Buildings & Shadows"
          onClick={handleToggleClick}
        >
          {state.showShadows ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
              <ellipse cx="12" cy="18" rx="6" ry="2.5" opacity="0.4"/>
              <circle cx="12" cy="10" r="5"/>
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="18" rx="6" ry="2.5" opacity="0.4"/>
              <circle cx="12" cy="10" r="5"/>
              <line x1="4" y1="4" x2="20" y2="20"/>
            </svg>
          )}
        </button>

        {showShadowsPopover && popoverStyle && createPortal(
          <div className="toolbar-popover" ref={popoverContentRef} style={popoverStyle}>
            <button
              className={`btn btn-icon${state.mode === 'buildings' ? ' active' : ''}`}
              id="mode-buildings-btn"
              title="Buildings Mode"
              onClick={() => dispatch({ type: 'SET_MODE', mode: state.mode === 'buildings' ? 'markers' : 'buildings' })}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 12-8.5 8.5a2.12 2.12 0 1 1-3-3L12 9"/>
                <path d="M17.64 15 22 10.64"/>
                <path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91"/>
              </svg>
            </button>

            <button
              className={`btn btn-icon${state.showShadows ? ' active' : ''}`}
              id="toggle-shadows-btn"
              title={state.showShadows ? 'Shadows: ON' : 'Shadows: OFF'}
              onClick={() => dispatch({ type: 'TOGGLE_SHADOWS' })}
            >
              {state.showShadows ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9"/>
                  <path d="M12 3v18" strokeLinecap="round"/>
                  <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/>
                </svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9"/>
                  <path d="M12 3v18" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          </div>,
          document.body
        )}
      </div>

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
