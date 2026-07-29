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

  // Kept in sync with state.zoom so gesture handlers can always read the
  // latest value without needing state.zoom in their effect dependencies
  // (which would tear down/rebuild the listeners on every drag step).
  const zoomRef = useRef(state.zoom);
  useEffect(() => { zoomRef.current = state.zoom; }, [state.zoom]);

  // --- Track spacebar-held state for Space+Drag panning ---
  const isSpaceHeldRef = useRef(false);
  useEffect(() => {
    const isTypingTarget = (el) =>
      el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;

    const onKeyDown = (e) => {
      if (e.code !== 'Space' || isTypingTarget(e.target)) return;
      e.preventDefault();
      isSpaceHeldRef.current = true;
    };
    const onKeyUp = (e) => {
      if (e.code !== 'Space') return;
      isSpaceHeldRef.current = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // --- Zoom ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const zoom = zoomRef.current;
      const delta = -e.deltaY;
      const scaleFactor = 1.1;
      const newScale = delta > 0 ? zoom.scale * scaleFactor : zoom.scale / scaleFactor;
      const clampedScale = Math.max(0.1, Math.min(10, newScale));
      if (clampedScale === zoom.scale) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      dispatch({
        type: 'SET_ZOOM',
        zoom: {
          scale: clampedScale,
          x: mouseX - (mouseX - zoom.x) * (clampedScale / zoom.scale),
          y: mouseY - (mouseY - zoom.y) * (clampedScale / zoom.scale),
        },
      });
    };

    container.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => container.removeEventListener('wheel', onWheel, { capture: true });
  }, [dispatch]);

  // --- Pan (Space+Drag) ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isPanning = false;
    let startPanX = 0, startPanY = 0;
    let currentZoom = zoomRef.current;

    const onMouseDown = (e) => {
      if (!isSpaceHeldRef.current) return;
      isPanning = true;
      currentZoom = zoomRef.current;
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
  }, [dispatch]);

  // --- Touch: pinch-to-zoom + single-finger pan ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const PAN_THRESHOLD = 8;

    const getDistance = (touches) => Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );

    let mode = 'none'; // 'none' | 'pan' | 'pinch'
    let currentZoom = zoomRef.current;
    let touchStartX = 0, touchStartY = 0;
    let panOriginX = 0, panOriginY = 0;
    let moved = false;
    let pinchStartDist = 0;
    let pinchStartScale = 1;
    let pinchMidX = 0, pinchMidY = 0;

    const onTouchStart = (e) => {
      if (e.target.closest('.marker') || e.target.closest('.delete-btn')) return;

      if (e.touches.length === 2) {
        mode = 'pinch';
        moved = true;
        currentZoom = zoomRef.current;
        pinchStartDist = getDistance(e.touches);
        pinchStartScale = currentZoom.scale;
        const rect = container.getBoundingClientRect();
        pinchMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        pinchMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
        e.preventDefault();
      } else if (e.touches.length === 1) {
        mode = 'pan';
        moved = false;
        currentZoom = zoomRef.current;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        panOriginX = currentZoom.x;
        panOriginY = currentZoom.y;
      }
    };

    const onTouchMove = (e) => {
      if (mode === 'pinch' && e.touches.length === 2) {
        e.preventDefault();
        const dist = getDistance(e.touches);
        const newScale = Math.max(0.1, Math.min(10, pinchStartScale * (dist / pinchStartDist)));
        dispatch({
          type: 'SET_ZOOM',
          zoom: {
            scale: newScale,
            x: pinchMidX - (pinchMidX - currentZoom.x) * (newScale / currentZoom.scale),
            y: pinchMidY - (pinchMidY - currentZoom.y) * (newScale / currentZoom.scale),
          },
        });
      } else if (mode === 'pan' && e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        if (!moved && Math.hypot(dx, dy) < PAN_THRESHOLD) return;
        moved = true;
        e.preventDefault();
        dispatch({
          type: 'SET_ZOOM',
          zoom: { ...currentZoom, x: panOriginX + dx, y: panOriginY + dy },
        });
      }
    };

    const onTouchEnd = (e) => {
      if (moved) e.preventDefault();
      if (e.touches.length === 0) { mode = 'none'; moved = false; }
    };

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: false });
    container.addEventListener('touchcancel', onTouchEnd, { passive: false });
    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [dispatch]);

  // --- Add marker on click ---
  const handleImageLayerClick = useCallback((e) => {
    if (!project?.image) return;
    if (state.mode === 'buildings') return;
    if (isSpaceHeldRef.current || state.dragState.isDragging) return;
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
