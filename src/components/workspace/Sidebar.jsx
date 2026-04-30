import { useAppState } from '../../context/AppContext';
import MarkerList from './MarkerList';
import PlantList from './PlantList';
import SunPanel from './SunPanel';

export default function Sidebar({ onMarkerEdit }) {
  const { state, dispatch } = useAppState();
  const project = state.currentProject;

  return (
    <div className={`sidebar-drawer${state.isDrawerOpen ? ' open' : ''}`} id="sidebar-drawer">
      <div className="sidebar-panel">
        <div className="sidebar-tabs">
          <button
            className={`btn${state.activeTab === 'markers' ? ' btn-primary' : ''}`}
            style={{ flex: 1 }}
            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', tab: 'markers' })}
          >Markers</button>
          <button
            className={`btn${state.activeTab === 'plants' ? ' btn-primary' : ''}`}
            style={{ flex: 1 }}
            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', tab: 'plants' })}
          >Plants</button>
          <button
            className={`btn${state.activeTab === 'sun' ? ' btn-primary' : ''}`}
            style={{ flex: 1 }}
            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', tab: 'sun' })}
          >Sun Env</button>
        </div>

        <div className="sidebar-scroll-area">
          {state.activeTab === 'markers' && (
            <div id="marker-list-section">
              <div className="sidebar-panel-heading" id="marker-count-label">
                Markers ({project?.markers.length || 0})
              </div>
              <MarkerList onEdit={onMarkerEdit} />
            </div>
          )}

          {state.activeTab === 'plants' && (
            <div id="plants-list-section">
              <PlantList />
            </div>
          )}

          {state.activeTab === 'sun' && (
            <div id="sun-panel-section">
              <SunPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
