import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../../context/AppContext';
import { generateId } from '../../utils/markerUtils';
import ProjectGrid from './ProjectGrid';
import NewProjectModal from './NewProjectModal';
import RenameProjectModal from './RenameProjectModal';
import ConfirmModal from '../common/ConfirmModal';
import HelpModal from '../common/HelpModal';

export default function Dashboard() {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();

  const [showNewModal, setShowNewModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = state.projects.filter(p =>
    p.name.toLowerCase().includes(state.searchQuery.toLowerCase())
  );

  const handleCreate = (name) => {
    const project = {
      id: generateId(),
      name,
      image: null,
      markers: [],
      markerType: 'number',
      buildings: [],
      pixelsPerUnit: 10,
      location: { lat: 51.5, lng: -0.1 },
      northBearing: 0,
      updatedAt: Date.now(),
    };
    dispatch({ type: 'ADD_PROJECT', project });
    dispatch({ type: 'SET_CURRENT_PROJECT', project });
    navigate(`/workspace?id=${project.id}`);
  };

  const handleOpen = (id) => {
    const project = state.projects.find(p => p.id === id);
    if (project) {
      dispatch({ type: 'SET_CURRENT_PROJECT', project });
      navigate(`/workspace?id=${id}`);
    }
  };

  const handleRename = (name) => {
    dispatch({ type: 'RENAME_PROJECT', id: renameTarget.id, name });
  };

  const handleDelete = () => {
    dispatch({ type: 'DELETE_PROJECT', id: deleteTarget });
    setDeleteTarget(null);
  };

  return (
    <div id="app">
      <div id="dashboard-view" className="view">
        <header>
          <h1 className="title">My Projects</h1>
          <div className="search-container">
            <input
              type="text"
              id="dashboard-search"
              className="search-input"
              placeholder="Search projects..."
              value={state.searchQuery}
              onChange={e => dispatch({ type: 'SET_SEARCH_QUERY', query: e.target.value })}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
            <span>+</span> New Project
          </button>
        </header>

        <ProjectGrid
          projects={filtered}
          onOpen={handleOpen}
          onRename={p => setRenameTarget(p)}
          onDelete={id => setDeleteTarget(id)}
        />
      </div>

      <NewProjectModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreate={handleCreate}
      />

      <RenameProjectModal
        isOpen={!!renameTarget}
        project={renameTarget}
        onClose={() => setRenameTarget(null)}
        onRename={handleRename}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Project"
        message="Are you sure you want to delete this project? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <HelpModal />
    </div>
  );
}
