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
import { useAppState } from '../../context/AppContext';

function SortableMarkerItem({ marker, idx, onEdit, onHover, onHoverEnd }) {
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
      </div>
    </div>
  );
}

export default function MarkerList({ onEdit }) {
  const { state, dispatch } = useAppState();
  const project = state.currentProject;

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

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={project.markers.map((_, i) => i)} strategy={verticalListSortingStrategy}>
        <div className="sidebar" id="marker-legend-list">
          {project.markers.map((marker, idx) => (
            <SortableMarkerItem
              key={idx}
              idx={idx}
              marker={marker}
              onEdit={onEdit}
              onHover={handleHover}
              onHoverEnd={handleHoverEnd}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
