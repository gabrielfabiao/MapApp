export default function ProjectCard({ project, onOpen, onRename, onDelete }) {
  return (
    <div className="card" onClick={() => onOpen(project.id)}>
      <div className="card-title">{project.name}</div>
      <div className="card-meta">
        {project.markers.length} markers &bull; {new Date(project.updatedAt).toLocaleDateString()}
      </div>
      <div className="card-actions">
        <button
          className="card-action-btn rename-project-btn"
          title="Rename project"
          onClick={e => { e.stopPropagation(); onRename(project); }}
        >&#9998;</button>
        <button
          className="card-action-btn delete-project-btn"
          title="Delete project"
          onClick={e => { e.stopPropagation(); onDelete(project.id); }}
        >&#10005;</button>
      </div>
    </div>
  );
}
