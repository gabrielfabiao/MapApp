import SunCalc from 'suncalc';
import { Storage } from '../storage';

export function getSunPanelHTML(project, state) {
    const loc = project.location || { lat: 51.5, lng: -0.1 };
    const bearing = project.northBearing || 0;
    const now = state.sunDate || new Date();
    
    return `
        <div class="sun-panel fade-in">
            <div class="form-group">
                <label class="form-label">Location (Lat / Lng)</label>
                <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <input type="number" id="sun-lat" class="search-input" style="padding-left:0.75rem;" step="any" value="${loc.lat}">
                    <input type="number" id="sun-lng" class="search-input" style="padding-left:0.75rem;" step="any" value="${loc.lng}">
                </div>
                <button class="btn" id="sun-use-location-btn" style="width: 100%; justify-content: center; font-size: 0.75rem; padding: 0.4rem;">
                    📍 Use My Location
                </button>
            </div>

            <div class="form-group">
                <label class="form-label">North Bearing (&deg;)</label>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <input type="range" id="sun-bearing-slider" min="0" max="360" value="${bearing}" style="flex:1;">
                    <input type="number" id="sun-bearing-input" class="search-input" style="width:70px; padding-left:0.5rem;" value="${bearing}" min="0" max="360">
                </div>
                <div style="font-size:0.7rem; color:var(--text-secondary); margin-top:0.25rem;">Which direction is North on your image? (0 = Up)</div>
            </div>

            <div class="form-group">
                <label class="form-label">Shadow Scale Factor</label>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <input type="range" id="sun-scale-slider" min="1" max="100" value="${project.pixelsPerUnit || 10}" style="flex:1;">
                    <input type="number" id="sun-scale-input" class="search-input" style="width:70px; padding-left:0.5rem;" value="${project.pixelsPerUnit || 10}" min="1" max="100">
                </div>
                <div style="font-size:0.7rem; color:var(--text-secondary); margin-top:0.25rem;">Scale building height to shadow length.</div>
            </div>

            <div class="form-group">
                <label class="form-label">Time of Day</label>
                <input type="time" id="sun-time-input" class="search-input" style="width:100%; padding-left:0.75rem;" value="${now.toTimeString().substring(0, 5)}">
                <input type="range" id="sun-time-slider" min="0" max="1440" value="${now.getHours() * 60 + now.getMinutes()}" style="width:100%; margin-top: 0.5rem;">
            </div>

            <div class="sun-stats" style="background: rgba(0,0,0,0.03); border: 1px solid var(--border-color); border-radius: 0.5rem; padding: 1rem; margin-top: 1rem;">
                <div style="display:flex; justify-content:space-between; margin-bottom: 0.5rem;">
                    <span style="font-size:0.8rem; color:var(--text-secondary);">Altitude</span>
                    <strong id="sun-stat-alt">--&deg;</strong>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom: 0.5rem;">
                    <span style="font-size:0.8rem; color:var(--text-secondary);">Azimuth</span>
                    <strong id="sun-stat-azi">--&deg;</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span style="font-size:0.8rem; color:var(--text-secondary);">Intensity</span>
                    <strong id="sun-stat-int">--%</strong>
                </div>
            </div>
        </div>
    `;
}

export function wireSunPanel(app, state, renderWorkspace, renderApp, updateSunOverlay) {
    const project = state.currentProject;

    const latInput = app.querySelector('#sun-lat');
    const lngInput = app.querySelector('#sun-lng');
    const bearingSlider = app.querySelector('#sun-bearing-slider');
    const bearingInput = app.querySelector('#sun-bearing-input');
    const scaleSlider = app.querySelector('#sun-scale-slider');
    const scaleInput = app.querySelector('#sun-scale-input');
    const timeInput = app.querySelector('#sun-time-input');
    const timeSlider = app.querySelector('#sun-time-slider');
    
    const altEl = app.querySelector('#sun-stat-alt');
    const aziEl = app.querySelector('#sun-stat-azi');
    const intEl = app.querySelector('#sun-stat-int');

    if (!state.sunDate) state.sunDate = new Date();

    const saveProjectLocBear = () => {
        project.location.lat = parseFloat(latInput.value) || 0;
        project.location.lng = parseFloat(lngInput.value) || 0;
        project.northBearing = parseFloat(bearingInput.value) || 0;
        project.updatedAt = Date.now();
        Storage.saveProject(project);
    };

    const updateCalculations = () => {
        // Parse time
        const [hours, mins] = timeInput.value.split(':').map(Number);
        state.sunDate.setHours(hours, mins, 0, 0);

        const lat = parseFloat(latInput.value) || 0;
        const lng = parseFloat(lngInput.value) || 0;
        const bearing = parseFloat(bearingInput.value) || 0;

        const pos = SunCalc.getPosition(state.sunDate, lat, lng);
        const altDeg = pos.altitude * 180 / Math.PI;
        
        // SunCalc azimuth is 0 at South, moving to West (Pi/2 is West).
        // Standard compass bearing is 0 at North, moving to East.
        // Conversion: Azimuth = (SunCalc.azimuth * 180 / Math.PI + 180) % 360
        let aziDeg = (pos.azimuth * 180 / Math.PI + 180) % 360;

        const intensity = Math.max(0, Math.sin(pos.altitude)) * 100;

        if (altEl) altEl.innerHTML = `${altDeg.toFixed(1)}&deg;`;
        if (aziEl) aziEl.innerHTML = `${aziDeg.toFixed(1)}&deg;`;
        if (intEl) intEl.innerHTML = `${intensity.toFixed(0)}%`;

        // Update Overlay
        if (updateSunOverlay) {
            updateSunOverlay(altDeg, aziDeg, intensity, bearing, project);
        }
    };

    // Location inputs
    const onLocChange = () => {
        saveProjectLocBear();
        updateCalculations();
    };
    if (latInput) latInput.addEventListener('change', onLocChange);
    if (lngInput) lngInput.addEventListener('change', onLocChange);

    // Geolocation
    const useLocBtn = app.querySelector('#sun-use-location-btn');
    if (useLocBtn) {
        useLocBtn.addEventListener('click', () => {
            if ("geolocation" in navigator) {
                useLocBtn.textContent = 'Locating...';
                navigator.geolocation.getCurrentPosition((position) => {
                    latInput.value = position.coords.latitude.toFixed(4);
                    lngInput.value = position.coords.longitude.toFixed(4);
                    useLocBtn.textContent = '📍 Use My Location';
                    onLocChange();
                }, (error) => {
                    useLocBtn.textContent = '📍 Use My Location';
                    alert("Error getting location: " + error.message);
                });
            } else {
                alert("Geolocation is not supported by your browser");
            }
        });
    }

    // Bearing inputs
    const syncBearing = (val) => {
        if (bearingSlider) bearingSlider.value = val;
        if (bearingInput) bearingInput.value = val;
        saveProjectLocBear();
        updateCalculations();
    };
    if (bearingSlider) bearingSlider.addEventListener('input', (e) => syncBearing(e.target.value));
    if (bearingInput) bearingInput.addEventListener('change', (e) => syncBearing(e.target.value));

    // Scale inputs
    const syncScale = (val) => {
        if (scaleSlider) scaleSlider.value = val;
        if (scaleInput) scaleInput.value = val;
        project.pixelsPerUnit = parseFloat(val) || 10;
        project.updatedAt = Date.now();
        Storage.saveProject(project);
        updateCalculations();
    };
    if (scaleSlider) scaleSlider.addEventListener('input', (e) => syncScale(e.target.value));
    if (scaleInput) scaleInput.addEventListener('change', (e) => syncScale(e.target.value));

    // Time inputs
    const syncTime = (h, m) => {
        const hh = String(h).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        if (timeInput) timeInput.value = `${hh}:${mm}`;
        if (timeSlider) timeSlider.value = h * 60 + m;
        updateCalculations();
    };

    if (timeInput) {
        timeInput.addEventListener('change', (e) => {
            const [h, m] = e.target.value.split(':').map(Number);
            syncTime(h, m);
        });
    }
    if (timeSlider) {
        timeSlider.addEventListener('input', (e) => {
            const totalMins = parseInt(e.target.value);
            const h = Math.floor(totalMins / 60);
            const m = totalMins % 60;
            syncTime(h, m);
        });
    }

    // Initial calc
    updateCalculations();
}

export function syncSunOverlay(project, state, updateSunOverlay) {
    if (!project || !updateSunOverlay || !state.sunDate) return;
    const loc = project.location || { lat: 51.5, lng: -0.1 };
    const bearing = project.northBearing || 0;
    
    const pos = SunCalc.getPosition(state.sunDate, loc.lat, loc.lng);
    const altDeg = pos.altitude * 180 / Math.PI;
    const aziDeg = (pos.azimuth * 180 / Math.PI + 180) % 360;
    const intensity = Math.max(0, Math.sin(pos.altitude)) * 100;

    updateSunOverlay(altDeg, aziDeg, intensity, bearing, project);
}

