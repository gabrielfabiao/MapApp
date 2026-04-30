import { createContext, useContext, useReducer } from 'react';
import { Storage } from '../storage';
import { reindexMarkers } from '../utils/markerUtils';

const initialState = {
  projects: Storage.loadProjects(),
  currentProject: null,
  searchQuery: '',
  captionSearchQuery: '',
  plantSearchQuery: '',
  selectedMarkerIdx: null,
  selectedSpeciesId: null,
  activeTab: 'markers',
  mode: 'markers',
  isDrawerOpen: false,
  sunDate: new Date(),
  dragState: { isDragging: false, markerIdx: null },
  zoom: { scale: 1, x: 0, y: 0 },
  drawingState: null,
  showShadows: true,
  isWeatherOpen: false,
  weatherData: null,
  selectedWeatherDay: 0,
  settings: Storage.loadSettings(),
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PROJECTS':
      return { ...state, projects: action.projects };

    case 'SET_CURRENT_PROJECT':
      return { ...state, currentProject: action.project };

    case 'UPDATE_CURRENT_PROJECT': {
      const updated = { ...state.currentProject, ...action.patch, updatedAt: Date.now() };
      Storage.saveProject(updated);
      const projects = state.projects.map(p => p.id === updated.id ? updated : p);
      return { ...state, currentProject: updated, projects };
    }

    case 'ADD_PROJECT': {
      const projects = [...state.projects, action.project];
      Storage.saveProjects(projects);
      return { ...state, projects };
    }

    case 'DELETE_PROJECT': {
      const projects = state.projects.filter(p => p.id !== action.id);
      Storage.deleteProject(action.id);
      return { ...state, projects };
    }

    case 'RENAME_PROJECT': {
      const projects = state.projects.map(p =>
        p.id === action.id ? { ...p, name: action.name, updatedAt: Date.now() } : p
      );
      const renamed = projects.find(p => p.id === action.id);
      Storage.saveProject(renamed);
      const currentProject = state.currentProject?.id === action.id
        ? { ...state.currentProject, name: action.name }
        : state.currentProject;
      return { ...state, projects, currentProject };
    }

    case 'ADD_MARKER': {
      const markers = [...state.currentProject.markers, action.marker];
      const updated = { ...state.currentProject, markers, updatedAt: Date.now() };
      Storage.saveProject(updated);
      const projects = state.projects.map(p => p.id === updated.id ? updated : p);
      return { ...state, currentProject: updated, projects };
    }

    case 'UPDATE_MARKER': {
      const markers = state.currentProject.markers.map((m, i) =>
        i === action.idx ? { ...m, ...action.patch } : m
      );
      reindexMarkers({ markers });
      const updated = { ...state.currentProject, markers, updatedAt: Date.now() };
      Storage.saveProject(updated);
      const projects = state.projects.map(p => p.id === updated.id ? updated : p);
      return { ...state, currentProject: updated, projects };
    }

    case 'DELETE_MARKER': {
      const markers = state.currentProject.markers.filter((_, i) => i !== action.idx);
      reindexMarkers({ markers });
      const updated = { ...state.currentProject, markers, updatedAt: Date.now() };
      Storage.saveProject(updated);
      const projects = state.projects.map(p => p.id === updated.id ? updated : p);
      return { ...state, currentProject: updated, projects, selectedMarkerIdx: null };
    }

    case 'REORDER_MARKERS': {
      const markers = [...action.markers];
      reindexMarkers({ markers });
      const updated = { ...state.currentProject, markers, updatedAt: Date.now() };
      Storage.saveProject(updated);
      const projects = state.projects.map(p => p.id === updated.id ? updated : p);
      return { ...state, currentProject: updated, projects };
    }

    case 'MOVE_MARKER': {
      const markers = state.currentProject.markers.map((m, i) =>
        i === action.idx ? { ...m, x: action.x, y: action.y } : m
      );
      const updated = { ...state.currentProject, markers, updatedAt: Date.now() };
      Storage.saveProject(updated);
      const projects = state.projects.map(p => p.id === updated.id ? updated : p);
      return { ...state, currentProject: updated, projects };
    }

    case 'ADD_BUILDING': {
      const buildings = [...state.currentProject.buildings, action.building];
      const updated = { ...state.currentProject, buildings, updatedAt: Date.now() };
      Storage.saveProject(updated);
      const projects = state.projects.map(p => p.id === updated.id ? updated : p);
      return { ...state, currentProject: updated, projects };
    }

    case 'UPDATE_BUILDING': {
      const buildings = state.currentProject.buildings.map((b, i) =>
        i === action.idx ? { ...b, ...action.patch } : b
      );
      const updated = { ...state.currentProject, buildings, updatedAt: Date.now() };
      Storage.saveProject(updated);
      const projects = state.projects.map(p => p.id === updated.id ? updated : p);
      return { ...state, currentProject: updated, projects };
    }

    case 'DELETE_BUILDING': {
      const buildings = state.currentProject.buildings.filter((_, i) => i !== action.idx);
      const updated = { ...state.currentProject, buildings, updatedAt: Date.now() };
      Storage.saveProject(updated);
      const projects = state.projects.map(p => p.id === updated.id ? updated : p);
      return { ...state, currentProject: updated, projects };
    }

    case 'SET_ZOOM':
      return { ...state, zoom: action.zoom };

    case 'SET_DRAG_STATE':
      return { ...state, dragState: action.dragState };

    case 'SET_DRAWING_STATE':
      return { ...state, drawingState: action.drawingState };

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.tab };

    case 'SET_MODE':
      return { ...state, mode: action.mode };

    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.query };

    case 'SET_PLANT_SEARCH_QUERY':
      return { ...state, plantSearchQuery: action.query };

    case 'SET_SELECTED_MARKER':
      return { ...state, selectedMarkerIdx: action.idx };

    case 'SET_SELECTED_SPECIES':
      return { ...state, selectedSpeciesId: action.id };

    case 'TOGGLE_DRAWER':
      return { ...state, isDrawerOpen: !state.isDrawerOpen };

    case 'TOGGLE_WEATHER':
      return { ...state, isWeatherOpen: !state.isWeatherOpen };

    case 'SET_WEATHER_DATA':
      return { ...state, weatherData: action.data };

    case 'SET_WEATHER_DAY':
      return { ...state, selectedWeatherDay: action.day };

    case 'SET_SUN_DATE':
      return { ...state, sunDate: action.date };

    case 'TOGGLE_SHADOWS':
      return { ...state, showShadows: !state.showShadows };

    case 'SAVE_SETTINGS': {
      Storage.saveSettings(action.settings);
      return { ...state, settings: action.settings };
    }

    default:
      return state;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  return useContext(AppContext);
}
