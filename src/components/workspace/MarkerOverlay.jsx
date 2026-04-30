import { useCallback } from 'react';
import { useAppState } from '../../context/AppContext';

export default function MarkerOverlay({ onMarkerClick, onMarkerDelete }) {
  const { state, dispatch } = useAppState();
  const project = state.currentProject;
  if (!project) return null;

  const handleMarkerMouseDown = useCallback((e, idx) => {
    if (state.mode === 'buildings') return;
    if (e.target.closest('.delete-btn')) return;
    e.preventDefault();
    e.stopPropagation();

    const img = document.getElementById('main-image');
    if (!img) return;

    const marker = project.markers[idx];
    const markerEl = document.getElementById(`marker-${idx}`);
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const DRAG_THRESHOLD = 3;
    let isDragging = false;

    const onMouseMove = (ev) => {
      const dist = Math.hypot(ev.clientX - startClientX, ev.clientY - startClientY);
      if (dist < DRAG_THRESHOLD && !isDragging) return;
      isDragging = true;
      dispatch({ type: 'SET_DRAG_STATE', dragState: { isDragging: true, markerIdx: idx } });

      const rect = img.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100));
      marker.x = x;
      marker.y = y;
      if (markerEl) { markerEl.style.left = `${x}%`; markerEl.style.top = `${y}%`; }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (isDragging) {
        dispatch({ type: 'MOVE_MARKER', idx, x: marker.x, y: marker.y });
        setTimeout(() => dispatch({ type: 'SET_DRAG_STATE', dragState: { isDragging: false, markerIdx: null } }), 50);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [state.mode, project, dispatch]);

  return (
    <div className="marker-overlay" id="marker-overlay">
      {project.markers.map((m, idx) => {
        const isSelectedSpecies = state.selectedSpeciesId && state.selectedSpeciesId === m.scientificName;
        return (
          <div
            key={idx}
            id={`marker-${idx}`}
            className={`marker${isSelectedSpecies ? ' selected' : ''}${m.isTree ? ' is-tree' : ''}`}
            data-idx={idx}
            style={{ left: `${m.x}%`, top: `${m.y}%` }}
            onMouseDown={e => handleMarkerMouseDown(e, idx)}
            onClick={e => {
              e.stopPropagation();
              if (!state.dragState.isDragging) onMarkerClick(idx);
            }}
          >
            {m.label || idx + 1}
            <div
              className="delete-btn"
              data-idx={idx}
              onClick={e => { e.stopPropagation(); onMarkerDelete(idx); }}
            >&times;</div>
          </div>
        );
      })}
    </div>
  );
}
