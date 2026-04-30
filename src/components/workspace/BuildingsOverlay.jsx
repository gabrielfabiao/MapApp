import { useCallback } from 'react';
import { useAppState } from '../../context/AppContext';

export default function BuildingsOverlay() {
  const { state, dispatch } = useAppState();
  const project = state.currentProject;
  if (!project) return null;

  const isActive = state.mode === 'buildings';

  const handleBuildingMouseDown = useCallback((e, idx, action) => {
    e.preventDefault();
    e.stopPropagation();

    const img = document.getElementById('main-image');
    if (!img) return;

    const b = { ...project.buildings[idx] };
    const rect = img.getBoundingClientRect();
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startX = b.x, startY = b.y, startW = b.width, startH = b.height;
    const DRAG_THRESHOLD = 3;
    let isDragging = false;

    const onMouseMove = (ev) => {
      const dist = Math.hypot(ev.clientX - startClientX, ev.clientY - startClientY);
      if (dist < DRAG_THRESHOLD && !isDragging) return;
      isDragging = true;
      dispatch({ type: 'SET_DRAG_STATE', dragState: { isDragging: true, markerIdx: null } });

      const dx = ((ev.clientX - startClientX) / rect.width) * 100;
      const dy = ((ev.clientY - startClientY) / rect.height) * 100;
      const blockEl = document.querySelector(`.building-block[data-idx="${idx}"]`);

      if (action === 'move') {
        b.x = Math.max(0, Math.min(100 - b.width, startX + dx));
        b.y = Math.max(0, Math.min(100 - b.height, startY + dy));
        if (blockEl) { blockEl.style.left = b.x + '%'; blockEl.style.top = b.y + '%'; }
      } else if (action === 'resize') {
        b.width = Math.max(1, Math.min(100 - b.x, startW + dx));
        b.height = Math.max(1, Math.min(100 - b.y, startH + dy));
        if (blockEl) { blockEl.style.width = b.width + '%'; blockEl.style.height = b.height + '%'; }
      } else if (action === 'rotate') {
        const centerX = rect.left + (startX + startW / 2) / 100 * rect.width;
        const centerY = rect.top + (startY + startH / 2) / 100 * rect.height;
        b.angle = (Math.atan2(ev.clientY - centerY, ev.clientX - centerX) * 180 / Math.PI) + 90;
        if (blockEl) blockEl.style.transform = `rotate(${b.angle}deg)`;
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (isDragging) {
        dispatch({ type: 'UPDATE_BUILDING', idx, patch: b });
        setTimeout(() => dispatch({ type: 'SET_DRAG_STATE', dragState: { isDragging: false, markerIdx: null } }), 50);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [project, dispatch]);

  const handleOverlayMouseDown = useCallback((e) => {
    if (!isActive) return;
    if (e.target.closest('.delete-building-btn') || e.target.closest('.rotate-handle') ||
        e.target.closest('.resize-handle') || e.target.closest('.building-block')) return;

    const img = document.getElementById('main-image');
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const startX = ((e.clientX - rect.left) / rect.width) * 100;
    const startY = ((e.clientY - rect.top) / rect.height) * 100;

    let drawState = { active: true, startX, startY, currentX: startX, currentY: startY };
    dispatch({ type: 'SET_DRAWING_STATE', drawingState: drawState });

    const onMouseMove = (ev) => {
      drawState = {
        ...drawState,
        currentX: ((ev.clientX - rect.left) / rect.width) * 100,
        currentY: ((ev.clientY - rect.top) / rect.height) * 100,
      };
      dispatch({ type: 'SET_DRAWING_STATE', drawingState: drawState });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      const width = Math.abs(drawState.currentX - drawState.startX);
      const height = Math.abs(drawState.currentY - drawState.startY);
      if (width > 1 && height > 1) {
        const left = Math.min(drawState.startX, drawState.currentX);
        const top = Math.min(drawState.startY, drawState.currentY);
        const h = prompt('Building height (m):', '10');
        if (h !== null) {
          dispatch({ type: 'ADD_BUILDING', building: { x: left, y: top, width, height, zHeight: parseFloat(h) || 10 } });
        }
      }
      dispatch({ type: 'SET_DRAWING_STATE', drawingState: null });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [isActive, dispatch]);

  const handleBuildingClick = useCallback((e, idx) => {
    if (!isActive || state.dragState.isDragging) return;
    e.stopPropagation();
    const h = prompt('Set building height:', project.buildings[idx].zHeight);
    if (h !== null) {
      dispatch({ type: 'UPDATE_BUILDING', idx, patch: { zHeight: parseFloat(h) || project.buildings[idx].zHeight } });
    }
  }, [isActive, state.dragState.isDragging, project, dispatch]);

  const ds = state.drawingState;

  return (
    <div
      className="buildings-overlay"
      id="buildings-overlay"
      style={{ pointerEvents: isActive ? 'auto' : 'none', display: isActive ? 'block' : 'none' }}
      onMouseDown={handleOverlayMouseDown}
    >
      {project.buildings.map((b, idx) => (
        <div
          key={idx}
          className="building-block"
          data-idx={idx}
          style={{
            left: `${b.x}%`, top: `${b.y}%`,
            width: `${b.width}%`, height: `${b.height}%`,
            transform: `rotate(${b.angle || 0}deg)`,
          }}
          onMouseDown={e => {
            const action = e.target.closest('.rotate-handle') ? 'rotate'
              : e.target.closest('.resize-handle') ? 'resize' : 'move';
            if (!e.target.closest('.delete-building-btn')) handleBuildingMouseDown(e, idx, action);
          }}
          onClick={e => handleBuildingClick(e, idx)}
        >
          <b>{b.zHeight !== undefined ? b.zHeight : 10}m</b>
          {isActive && (
            <>
              <div
                className="delete-building-btn"
                data-idx={idx}
                onClick={e => { e.stopPropagation(); dispatch({ type: 'DELETE_BUILDING', idx }); }}
              >&times;</div>
              <div className="resize-handle" data-idx={idx} />
              <div className="rotate-handle" data-idx={idx} />
            </>
          )}
        </div>
      ))}

      {ds?.active && (
        <div
          id="drawing-preview"
          style={{
            display: 'block',
            position: 'absolute',
            border: '2px dashed #0ea5e9',
            background: 'rgba(14, 165, 233, 0.2)',
            zIndex: 50,
            left: `${Math.min(ds.startX, ds.currentX)}%`,
            top: `${Math.min(ds.startY, ds.currentY)}%`,
            width: `${Math.abs(ds.currentX - ds.startX)}%`,
            height: `${Math.abs(ds.currentY - ds.startY)}%`,
          }}
        />
      )}
    </div>
  );
}
