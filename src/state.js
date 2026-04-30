import { Storage } from './storage';

// --- App State ---
export const state = {
    view: 'dashboard', // 'dashboard' | 'workspace'
    projects: Storage.loadProjects(),
    currentProject: null,
    searchQuery: '',
    captionSearchQuery: '',
    plantSearchQuery: '',
    selectedMarkerIdx: null,
    selectedSpeciesId: null,
    activeTab: 'markers', // 'markers' | 'plants' | 'sun'
    mode: 'markers', // 'markers' | 'buildings'
    isDrawerOpen: false,
    sunDate: new Date(),
    dragState: {
        isDragging: false,
        markerIdx: null
    },
    zoom: {
        scale: 1,
        x: 0,
        y: 0
    },
    drawingState: null, // { startX, startY, currentX, currentY }
    showShadows: true, // toggles sun environment visuals
    isWeatherOpen: false,
    weatherData: null,
    selectedWeatherDay: 0,
    settings: Storage.loadSettings()
};

// --- Utilities ---
export const generateId = () => Math.random().toString(36).substr(2, 9);

export const getNextAutoLabel = (project) => {
    const type = project.markerType || 'number';
    let numCount = 0;
    let letterCount = 0;
    project.markers.forEach(m => {
        if (/^\d+$/.test(m.label)) numCount++;
        else if (/^[a-zA-Z]$/.test(m.label)) letterCount++;
    });

    if (type === 'number') return (numCount + 1).toString();
    return String.fromCharCode(65 + (letterCount % 26));
};

export const reindexMarkers = (project) => {
    let numCount = 1;
    let letterCount = 0;

    project.markers.forEach(m => {
        const val = m.label.toString().trim();
        if (/^\d+$/.test(val)) {
            m.label = (numCount++).toString();
        } else if (/^[a-zA-Z]$/.test(val)) {
            m.label = String.fromCharCode(65 + (letterCount % 26));
            letterCount++;
        }
    });
};
