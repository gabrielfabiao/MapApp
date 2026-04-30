import { useRef, useEffect, useCallback } from 'react';
import { useAppState } from '../../context/AppContext';
import { getNextAutoLabel } from '../../utils/markerUtils';
import MarkerOverlay from './MarkerOverlay';
import BuildingsOverlay from './BuildingsOverlay';
import SunEnvironment from './SunEnvironment';

export default function ImageArea({ onMarkerClick, onMarkerDelete }) {
  const { state, dispatch } = useAppState();
  const containerRef = useRef(null);
  const project = state.currentProject;

  // --- Zoom ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = -e.deltaY;
      const scaleFactor = 1.1;
      const newScale = delta > 0 ? state.zoom.scale * scaleFactor : state.zoom.scale / scaleFactor;
      const clampedScale = Math.max(0.1, Math.min(10, newScale));
      if (clampedScale === state.zoom.scale) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      dispatch({
        type: 'SET_ZOOM',
        zoom: {
          scale: clampedScale,
          x: mouseX - (mouseX - state.zoom.x) * (clampedScale / state.zoom.scale),
          y: mouseY - (mouseY - state.zoom.y) * (clampedScale / state.zoom.scale),
        },
      });
    };

    container.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => container.removeEventListener('wheel', onWheel, { capture: true });
  }, [state.zoom, dispatch]);

  // --- Pan (Shift+Drag) ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isPanning = false;
    let startPanX = 0, startPanY = 0;
    let currentZoom = state.zoom;

    const onMouseDown = (e) => {
      if (!e.shiftKey) return;
      isPanning = true;
      currentZoom = state.zoom;
      container.querySelector('#image-canvas')?.classList.add('panning');
      startPanX = e.clientX - currentZoom.x;
      startPanY = e.clientY - currentZoom.y;
      e.preventDefault();
      e.stopPropagation();
    };

    const onMouseMove = (e) => {
      if (!isPanning) return;
      dispatch({
        type: 'SET_ZOOM',
        zoom: { ...currentZoom, x: e.clientX - startPanX, y: e.clientY - startPanY },
      });
    };

    const onMouseUp = () => {
      if (isPanning) {
        isPanning = false;
        container.querySelector('#image-canvas')?.classList.remove('panning');
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [state.zoom, dispatch]);

  // --- Add marker on click ---
  const handleImageLayerClick = useCallback((e) => {
    if (!project?.image) return;
    if (state.mode === 'buildings') return;
    if (e.shiftKey || state.dragState.isDragging) return;
    if (e.target.closest('.marker') || e.target.closest('.delete-btn')) return;

    const img = e.currentTarget.querySelector('#main-image');
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    if (x < 0 || x > 100 || y < 0 || y > 100) return;

    const label = getNextAutoLabel(project);
    dispatch({ type: 'ADD_MARKER', marker: { x, y, label, title: '', description: '', images: [] } });
  }, [project, state.mode, state.dragState.isDragging, dispatch]);

  const canvasStyle = {
    transform: `translate(${state.zoom.x}px, ${state.zoom.y}px) scale(${state.zoom.scale})`,
  };

  return (
    <div className="image-area" id="image-container" ref={containerRef}>
      <div className="image-canvas" id="image-canvas" style={canvasStyle}>
        <div
          id="image-wrap"
          className="interactive-image-layer"
          onClick={handleImageLayerClick}
        >
          {project?.image ? (
            <>
              <img src={project.image} id="main-image" className="main-image" />
              <SunEnvironment />
              <BuildingsOverlay />
              <MarkerOverlay onMarkerClick={onMarkerClick} onMarkerDelete={onMarkerDelete} />
            </>
          ) : (
            <div style={{ color: 'rgba(0,0,0,0.3)', fontSize: '1.5rem', padding: '4rem' }}>
              Upload an image to start tagging
            </div>
          )}
        </div>
      </div>

      <div id="sun-overlay-container" style={{ position: 'absolute', bottom: 20, left: 20, pointerEvents: 'none', zIndex: 101 }}>
        {/* Sun compass rendered by SunOverlay component */}
      </div>
    </div>
  );
}
