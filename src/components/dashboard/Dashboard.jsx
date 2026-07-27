import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { generateId } from '../../utils/markerUtils';
import ProjectGrid from './ProjectGrid';
import NewProjectModal from './NewProjectModal';
import RenameProjectModal from './RenameProjectModal';
import ConfirmModal from '../common/ConfirmModal';
import HelpModal from '../common/HelpModal';
import Logo from '../common/Logo';

export default function Dashboard() {
  const { state, dispatch } = useAppState();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [showNewModal, setShowNewModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileSearchInputRef = useRef(null);

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

  if (!state.projectsLoaded) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Logo size={40} />
      </div>
    );
  }

  return (
    <div id="app">
      <div id="dashboard-view" className="view">
        <div className="app-brand-row">
          <Logo size={34} />
          <div className="app-account-row">
            <span className="app-account-email">{user?.email}</span>
            <button className="btn" onClick={signOut}>Log Out</button>
          </div>
        </div>

        <header>
          <h1 className="title">My Projects</h1>
          <button
            className="mobile-search-toggle"
            aria-label="Search"
            onClick={() => {
              setMobileSearchOpen(v => !v);
              setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
          <div className={`search-container${mobileSearchOpen ? ' mobile-open' : ''}`}>
            <input
              ref={mobileSearchInputRef}
              type="text"
              id="dashboard-search"
              className="search-input"
              placeholder="Search projects..."
              value={state.searchQuery}
              onChange={e => dispatch({ type: 'SET_SEARCH_QUERY', query: e.target.value })}
            />
          </div>
          <div className="header-actions">
            <button className="btn" onClick={() => navigate('/calendar')}>
              <span>&#128197;</span> Calendar
            </button>
            <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
              <span>+</span> New Project
            </button>
          </div>
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
