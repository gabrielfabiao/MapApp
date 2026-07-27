import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { useAppState } from '../../context/AppContext';
import ConfirmModal from '../common/ConfirmModal';

function SortableMarkerItem({ marker, idx, onEdit, onDelete, onHover, onHoverEnd }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: idx });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="caption-item"
      data-idx={idx}
      onMouseEnter={() => onHover(idx)}
      onMouseLeave={() => onHoverEnd(idx)}
    >
      <div
        className="caption-item-card"
        onClick={() => onEdit(idx)}
        {...attributes}
        {...listeners}
      >
        <div className="caption-label-chip">{marker.label || idx + 1}</div>
        <div className="caption-content" style={{ flex: 1 }}>
          <div className="caption-title">{marker.title || 'Add Title...'}</div>
        </div>
        <button
          className="delete-legend-btn"
          title="Delete Marker"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete(idx); }}
        >
          &times;
        </button>
      </div>
    </div>
  );
}

export default function MarkerList({ onEdit }) {
  const { state, dispatch } = useAppState();
  const project = state.currentProject;
  const [deleteIdx, setDeleteIdx] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  if (!project) return null;

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const markers = arrayMove(project.markers, active.id, over.id);
      dispatch({ type: 'REORDER_MARKERS', markers });
    }
  };

  const handleHover = (idx) => {
    const el = document.getElementById(`marker-${idx}`);
    if (el) el.classList.add('highlighted');
  };

  const handleHoverEnd = (idx) => {
    const el = document.getElementById(`marker-${idx}`);
    if (el) el.classList.remove('highlighted');
  };

  const handleConfirmDelete = () => {
    dispatch({ type: 'DELETE_MARKER', idx: deleteIdx });
    setDeleteIdx(null);
  };

  const deleteTargetMarker = deleteIdx !== null ? project.markers[deleteIdx] : null;

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={project.markers.map((_, i) => i)} strategy={verticalListSortingStrategy}>
          <div className="sidebar" id="marker-legend-list">
            {project.markers.map((marker, idx) => (
              <SortableMarkerItem
                key={idx}
                idx={idx}
                marker={marker}
                onEdit={onEdit}
                onDelete={setDeleteIdx}
                onHover={handleHover}
                onHoverEnd={handleHoverEnd}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <ConfirmModal
        isOpen={deleteIdx !== null}
        title="Delete Marker"
        message={`Are you sure you want to delete "${deleteTargetMarker?.title || deleteTargetMarker?.label || 'this marker'}"? This cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteIdx(null)}
      />
    </>
  );
}
