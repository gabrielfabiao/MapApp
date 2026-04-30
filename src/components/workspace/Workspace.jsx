import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppState } from '../../context/AppContext';
import { Storage } from '../../storage';
import Toolbar from './Toolbar';
import ImageArea from './ImageArea';
import Sidebar from './Sidebar';
import WeatherDrawer from './WeatherDrawer';
import SunCompass from './SunCompass';
import MarkerEditorModal from './MarkerEditorModal';
import SettingsModal from './SettingsModal';
import ConfirmModal from '../common/ConfirmModal';
import HelpModal from '../common/HelpModal';
import { fetchWeather } from '../../services/weatherService';

export default function Workspace() {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [editingMarkerIdx, setEditingMarkerIdx] = useState(null);
  const [deleteMarkerIdx, setDeleteMarkerIdx] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Load project from URL on mount
  useEffect(() => {
    const id = searchParams.get('id');
    if (!id) { navigate('/'); return; }

    if (state.currentProject?.id !== id) {
      const project = Storage.getProject(id);
      if (project) {
        dispatch({ type: 'SET_CURRENT_PROJECT', project });
      } else {
        navigate('/');
      }
    }
  }, []);

  // Fetch weather when weather drawer opens
  useEffect(() => {
    if (!state.isWeatherOpen) return;
    const project = state.currentProject;
    if (project?.location?.lat && project?.location?.lng) {
      fetchWeather(project.location.lat, project.location.lng).then(data => {
        dispatch({ type: 'SET_WEATHER_DATA', data });
      });
    }
  }, [state.isWeatherOpen]);

  const handleImageUpload = (dataUrl) => {
    dispatch({ type: 'UPDATE_CURRENT_PROJECT', patch: { image: dataUrl } });
  };

  const handleMarkerDelete = (idx) => {
    setDeleteMarkerIdx(idx);
  };

  const handleConfirmDelete = () => {
    dispatch({ type: 'DELETE_MARKER', idx: deleteMarkerIdx });
    setDeleteMarkerIdx(null);
  };

  if (!state.currentProject) return null;

  return (
    <div id="app" className="workspace-mode">
      <div id="workspace-view" className="view">
        <div className="workspace">
          <ImageArea
            onMarkerClick={idx => setEditingMarkerIdx(idx)}
            onMarkerDelete={handleMarkerDelete}
          />

          <Toolbar
            onImageUpload={handleImageUpload}
            onOpenSettings={() => setSettingsOpen(true)}
          />

          <WeatherDrawer />

          <Sidebar onMarkerEdit={idx => setEditingMarkerIdx(idx)} />
        </div>
      </div>

      <SunCompass />

      <MarkerEditorModal
        markerIdx={editingMarkerIdx}
        onClose={() => setEditingMarkerIdx(null)}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <ConfirmModal
        isOpen={deleteMarkerIdx !== null}
        title="Delete Marker"
        message="Are you sure you want to remove this marker? This will also remove its photos and notes."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteMarkerIdx(null)}
      />

      <HelpModal />
    </div>
  );
}
