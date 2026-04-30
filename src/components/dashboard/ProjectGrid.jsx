import ProjectCard from './ProjectCard';

export default function ProjectGrid({ projects, onOpen, onRename, onDelete }) {
  if (projects.length === 0) {
    return (
      <div className="grid" id="project-grid">
        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          No projects found. Create one to get started!
        </div>
      </div>
    );
  }

  return (
    <div className="grid" id="project-grid">
      {projects.map(project => (
        <ProjectCard
          key={project.id}
          project={project}
          onOpen={onOpen}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
