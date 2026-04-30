import { useAppState } from '../../context/AppContext';

export default function PlantList() {
  const { state, dispatch } = useAppState();
  const project = state.currentProject;
  if (!project) return null;

  const query = state.plantSearchQuery || '';

  const speciesMap = new Map();
  project.markers.forEach(m => {
    if (m.scientificName) {
      if (!speciesMap.has(m.scientificName)) {
        speciesMap.set(m.scientificName, { scientificName: m.scientificName, title: m.title || 'Unknown Common Name', count: 0 });
      }
      speciesMap.get(m.scientificName).count++;
    }
  });

  const filtered = Array.from(speciesMap.values()).filter(s =>
    s.scientificName.toLowerCase().includes(query) || s.title.toLowerCase().includes(query)
  );

  const toggleSpecies = (id) => {
    dispatch({ type: 'SET_SELECTED_SPECIES', id: state.selectedSpeciesId === id ? null : id });
  };

  const handleHover = (scientificName) => {
    project.markers.forEach((m, idx) => {
      if (m.scientificName === scientificName) {
        document.getElementById(`marker-${idx}`)?.classList.add('selected');
      }
    });
  };

  const handleHoverEnd = (scientificName) => {
    project.markers.forEach((m, idx) => {
      if (m.scientificName === scientificName && state.selectedSpeciesId !== scientificName) {
        document.getElementById(`marker-${idx}`)?.classList.remove('selected');
      }
    });
  };

  return (
    <>
      <div className="sidebar-panel-heading" id="plant-count-label">
        Species ({filtered.length})
      </div>
      <div style={{ padding: '0 1rem 1rem 1rem' }}>
        <input
          type="text"
          className="search-input"
          placeholder="Search by species..."
          style={{ width: '100%' }}
          value={state.plantSearchQuery}
          onChange={e => dispatch({ type: 'SET_PLANT_SEARCH_QUERY', query: e.target.value.toLowerCase() })}
        />
      </div>
      <div className="sidebar" id="plant-legend-list">
        {filtered.map(s => (
          <div
            key={s.scientificName}
            className={`caption-item${state.selectedSpeciesId === s.scientificName ? ' active' : ''}`}
            data-species={s.scientificName}
            onClick={() => toggleSpecies(s.scientificName)}
            onMouseEnter={() => handleHover(s.scientificName)}
            onMouseLeave={() => handleHoverEnd(s.scientificName)}
          >
            <div className="caption-item-card">
              <div className="caption-label-chip" style={{ background: 'var(--amazon-light)' }}>🌱</div>
              <div className="caption-content" style={{ flex: 1 }}>
                <div className="caption-title" style={{ fontStyle: 'italic' }}>{s.scientificName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {s.title} ({s.count} marker{s.count > 1 ? 's' : ''})
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
