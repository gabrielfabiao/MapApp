import SunCalc from 'suncalc';
import { Storage } from '../storage';

/**
 * Wires listeners to the static sun panel elements in the sidebar.
 */
export function wireSunPanel(state, renderApp, updateSunOverlay) {
    const project = state.currentProject;
    const ws = document.querySelector('#workspace-view');
    
    const latInput = ws.querySelector('#sun-lat');
    const lngInput = ws.querySelector('#sun-lng');
    const bearingSlider = ws.querySelector('#sun-bearing-slider');
    const bearingInput = ws.querySelector('#sun-bearing-input');
    const scaleSlider = ws.querySelector('#sun-scale-slider');
    const scaleInput = ws.querySelector('#sun-scale-input');
    const timeInput = ws.querySelector('#sun-time-input');
    const timeSlider = ws.querySelector('#sun-time-slider');
    
    const altEl = ws.querySelector('#sun-stat-alt');
    const aziEl = ws.querySelector('#sun-stat-azi');
    const intEl = ws.querySelector('#sun-stat-int');

    if (!state.sunDate) state.sunDate = new Date();

    // Fill current values if not already set (one-time sync on view load)
    if (latInput.value === "") {
        const loc = project.location || { lat: 51.5, lng: -0.1 };
        latInput.value = loc.lat;
        lngInput.value = loc.lng;
        bearingSlider.value = project.northBearing || 0;
        bearingInput.value = project.northBearing || 0;
        scaleSlider.value = project.pixelsPerUnit || 10;
        scaleInput.value = project.pixelsPerUnit || 10;
        timeInput.value = state.sunDate.toTimeString().substring(0, 5);
        timeSlider.value = state.sunDate.getHours() * 60 + state.sunDate.getMinutes();
    }

    const saveProjectLocBear = () => {
        // Robust parsing for locales that use commas (e.g. 51,5)
        const parseCoord = (val) => parseFloat(String(val).replace(',', '.'));
        
        project.location.lat = parseCoord(latInput.value) || 0;
        project.location.lng = parseCoord(lngInput.value) || 0;
        project.northBearing = parseFloat(bearingInput.value) || 0;
        project.pixelsPerUnit = parseFloat(scaleInput.value) || 10;
        project.updatedAt = Date.now();
        Storage.saveProject(project);
    };

    const updateCalculations = () => {
        if (!timeInput.value) return;
        
        const [hours, mins] = timeInput.value.split(':').map(Number);
        if (isNaN(hours) || isNaN(mins)) return;

        state.sunDate.setHours(hours, mins, 0, 0);

        const parseCoord = (val) => parseFloat(String(val).replace(',', '.'));
        const lat = parseCoord(latInput.value) || 0;
        const lng = parseCoord(lngInput.value) || 0;

        const pos = SunCalc.getPosition(state.sunDate, lat, lng);
        const altDeg = pos.altitude * 180 / Math.PI;
        
        // Correct Azimuth calculation (SunCalc 0 is South, move Pi West)
        // Standard compass 0 is North.
        let aziDeg = (pos.azimuth * 180 / Math.PI + 180) % 360;

        if (isNaN(altDeg) || isNaN(aziDeg)) return;

        altEl.textContent = `${altDeg.toFixed(1)}°`;
        aziEl.textContent = `${aziDeg.toFixed(1)}°`;
        
        const intensity = Math.max(0, Math.min(100, (pos.altitude / (Math.PI/2)) * 100));
        intEl.textContent = `${intensity.toFixed(0)}%`;

        syncSunOverlay(project, state, updateSunOverlay);
    };

    // --- Listeners ---
    const onLocationChange = () => { saveProjectLocBear(); updateCalculations(); };
    latInput.oninput = onLocationChange;
    lngInput.oninput = onLocationChange;

    ws.querySelector('#sun-use-location-btn').onclick = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
                latInput.value = pos.coords.latitude.toFixed(4);
                lngInput.value = pos.coords.longitude.toFixed(4);
                onLocationChange();
            });
        }
    };

    bearingSlider.oninput = () => {
        bearingInput.value = bearingSlider.value;
        onLocationChange();
    };
    bearingInput.oninput = () => {
        bearingSlider.value = bearingInput.value;
        onLocationChange();
    };

    scaleSlider.oninput = () => {
        scaleInput.value = scaleSlider.value;
        onLocationChange();
    };
    scaleInput.oninput = () => {
        scaleSlider.value = scaleInput.value;
        onLocationChange();
    };

    timeInput.oninput = () => {
        const [h, m] = timeInput.value.split(':').map(Number);
        timeSlider.value = h * 60 + m;
        updateCalculations();
    };
    timeSlider.oninput = () => {
        const h = Math.floor(timeSlider.value / 60);
        const m = timeSlider.value % 60;
        timeInput.value = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        updateCalculations();
    };

    // Initial calculation
    updateCalculations();
}

/**
 * Calculates current sun pos and calls the overlay update function with the correct signature.
 */
export function syncSunOverlay(project, state, updateSunOverlay) {
    if (!updateSunOverlay) return;

    const loc = project.location || { lat: 51.5, lng: -0.1 };
    const date = state.sunDate || new Date();
    const pos = SunCalc.getPosition(date, loc.lat, loc.lng);
    
    const altDeg = pos.altitude * 180 / Math.PI;
    const aziDeg = (pos.azimuth * 180 / Math.PI + 180) % 360;
    const intensity = Math.max(0, Math.sin(pos.altitude)) * 100;
    const bearing = project.northBearing || 0;
    
    updateSunOverlay(altDeg, aziDeg, intensity, bearing, project, state);
}
