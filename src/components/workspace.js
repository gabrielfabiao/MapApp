import { Storage } from '../storage';
import { getNextAutoLabel, reindexMarkers } from '../state';
import { openMarkerEditor } from './markerEditor';
import { wireSunPanel, syncSunOverlay } from './sunPanel';
import { renderSunOverlay, updateSunOverlayStyles } from './sunOverlay';
import { fetchWeather, syncWeatherPanel } from './weather';
import { showConfirm } from './deletionmodal';
 
// --- Helpers ---
function deleteMarker(idx, state, renderApp) {
    showConfirm('Delete Marker', 'Are you sure you want to remove this marker? This will also remove its photos and notes.', () => {
        state.currentProject.markers.splice(idx, 1);
        reindexMarkers(state.currentProject);
        state.selectedMarkerIdx = null; // Clear selection
        state.currentProject.updatedAt = Date.now();
        saveAndSyncWorkspace(state, renderApp);
    });
}
 
function saveAndSyncWorkspace(state, renderApp) {
    Storage.saveProject(state.currentProject);
    syncWorkspace(state, renderApp);
}
 
/**
 * Optimized sync that only updates the canvas transform without re-rendering everything.
 */
function syncTransform(state) {
    const ws = document.querySelector('#workspace-view');
    const imageCanvas = ws.querySelector('#image-canvas');
    if (imageCanvas) {
        imageCanvas.style.transform = `translate(${state.zoom.x}px, ${state.zoom.y}px) scale(${state.zoom.scale})`;
    }
}
 
async function refreshWeather(state, renderApp) {
    const project = state.currentProject;
    if (project && project.location && project.location.lat && project.location.lng) {
        state.weatherData = await fetchWeather(project.location.lat, project.location.lng);
        syncWorkspace(state, renderApp);
    }
}
 
// --- Initialization (Run Once) ---
export function initWorkspace(state, renderApp) {
    const ws = document.querySelector('#workspace-view');
    const imageContainer = ws.querySelector('#image-container');
    const imageCanvas = ws.querySelector('#image-canvas');
    const fileInput = ws.querySelector('#file-input');
    const toggleBtn = ws.querySelector('#sidebar-toggle-btn');
    const titleEl = ws.querySelector('#project-title');
 
    // --- Toolbar: Back ---
    ws.querySelector('#back-btn').onclick = () => {
        window.location.href = '/';
    };
 
    // --- Toolbar: Reset Zoom ---
    ws.querySelector('#reset-zoom-btn').onclick = () => {
        state.zoom = { scale: 1, x: 0, y: 0 };
        syncWorkspace(state, renderApp);
    };
 
    // --- Toolbar: Upload ---
    ws.querySelector('#upload-btn').onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                state.currentProject.image = ev.target.result;
                state.currentProject.updatedAt = Date.now();
                saveAndSyncWorkspace(state, renderApp);
            };
            reader.readAsDataURL(file);
        }
    };
 
    // --- Toolbar: Marker Type ---
    ws.querySelector('#marker-type-select').onchange = (e) => {
        state.currentProject.markerType = e.target.value;
        saveAndSyncWorkspace(state, renderApp);
    };
 
    // --- Toolbar: Mode Toggle ---
 
    ws.querySelector('#mode-buildings-btn').addEventListener('click', (e) => {
        e.preventDefault();
        if (state.mode === 'buildings') {
            state.mode = 'markers';
        } else {
            state.mode = 'buildings';
        }
        syncWorkspace(state, renderApp);
    });
 
    // --- Toolbar: Toggle Shadows ---
    ws.querySelector('#toggle-shadows-btn').onclick = () => {
        state.showShadows = !state.showShadows;
        syncWorkspace(state, renderApp);
    };
 
    // --- Toolbar: Sidebar Toggle ---
    ws.querySelector('#sidebar-toggle-btn').addEventListener('click', () => {
        state.isDrawerOpen = !state.isDrawerOpen;
        syncWorkspace(state, renderApp);
    });
 
    // --- Toolbar: Weather Toggle ---
    ws.querySelector('#weather-toggle-btn').addEventListener('click', () => {
        state.isWeatherOpen = !state.isWeatherOpen;
        if (state.isWeatherOpen) {
            refreshWeather(state, renderApp);
        }
        syncWorkspace(state, renderApp);
    });
 
    // --- Toolbar: Project Rename ---
    titleEl.addEventListener('click', () => {
        const project = state.currentProject;
        const current = project.name;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = current;
        input.className = 'toolbar-title-input';
 
        const save = () => {
            const name = input.value.trim();
            if (name && name !== current) {
                project.name = name;
                project.updatedAt = Date.now();
                Storage.saveProject(project);
                const idx = state.projects.findIndex(p => p.id === project.id);
                if (idx !== -1) state.projects[idx].name = name;
            }
            titleEl.textContent = project.name;
            input.replaceWith(titleEl);
        };
 
        input.addEventListener('blur', save);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
            if (e.key === 'Escape') { input.value = current; input.blur(); }
        });
 
        titleEl.replaceWith(input);
        input.focus();
        input.select();
    });
 
    // --- Sidebar: Tabs ---
    ws.querySelector('#tab-markers').onclick = () => {
        state.activeTab = 'markers';
        syncWorkspace(state, renderApp);
    };
    ws.querySelector('#tab-plants').onclick = () => {
        state.activeTab = 'plants';
        syncWorkspace(state, renderApp);
    };
    ws.querySelector('#tab-sun').onclick = () => {
        state.activeTab = 'sun';
        syncWorkspace(state, renderApp);
    };
 
    // --- Sidebar: Plants Search ---
    ws.querySelector('#plant-search-input').oninput = (e) => {
        state.plantSearchQuery = e.target.value.toLowerCase();
        syncWorkspace(state, renderApp);
    };
 
    // --- Sidebar: Events (Delegation) ---
    const legendList = ws.querySelector('#marker-legend-list');
    legendList.onclick = (e) => {
        const item = e.target.closest('.caption-item');
        if (item) {
            openMarkerEditor(parseInt(item.dataset.idx), state, state.currentProject, renderApp);
            return;
        }
    };
 
    legendList.onmouseover = (e) => {
        const item = e.target.closest('.caption-item');
        if (item) {
            const idx = item.dataset.idx;
            const markerEl = ws.querySelector(`#marker-${idx}`);
            if (markerEl) markerEl.classList.add('highlighted');
        }
    };
 
    legendList.onmouseout = (e) => {
        const item = e.target.closest('.caption-item');
        if (item) {
            const idx = item.dataset.idx;
            const markerEl = ws.querySelector(`#marker-${idx}`);
            if (markerEl) markerEl.classList.remove('highlighted');
        }
    };
 
    let draggedIdx = null;
    legendList.addEventListener('dragstart', (e) => {
        const item = e.target.closest('.caption-item');
        if (item) {
            draggedIdx = parseInt(item.dataset.idx);
            item.classList.add('dragging');
            ws.classList.add('dragging-active');
            e.dataTransfer.effectAllowed = 'move';
            // Ensure only the dragged marker is highlighted
            ws.querySelectorAll('.marker.selected').forEach(m => m.classList.remove('selected'));
            const marker = ws.querySelector(`#marker-${draggedIdx}`);
            if (marker) marker.classList.add('selected');
        }
    });
 
    legendList.addEventListener('dragover', (e) => {
        e.preventDefault();
        const item = e.target.closest('.caption-item');
        if (item) {
            const rect = item.getBoundingClientRect();
            const relY = e.clientY - rect.top;
            const idx = parseInt(item.dataset.idx);
            
            // Determine the single logic insertion index
            const targetDropIdx = (relY < rect.height / 2) ? idx : idx + 1;
            
            // Clear all previous highlights
            legendList.querySelectorAll('.caption-item').forEach(el => {
                el.classList.remove('drag-over-top', 'drag-over-bottom');
            });
            
            // Apply highlight to the single correct item
            const items = legendList.querySelectorAll('.caption-item');
            if (targetDropIdx < items.length) {
                // Show gap ABOVE the item at targetDropIdx
                const targetEl = legendList.querySelector(`.caption-item[data-idx="${targetDropIdx}"]`);
                if (targetEl) targetEl.classList.add('drag-over-top');
            } else {
                // Show gap BELOW the very last item
                const lastEl = items[items.length - 1];
                if (lastEl) lastEl.classList.add('drag-over-bottom');
            }
        }
    });
 
    legendList.addEventListener('dragleave', (e) => {
        // Only clear if we actually left the list area or moved to a non-item
        if (!e.relatedTarget || !e.relatedTarget.closest('#marker-legend-list')) {
            legendList.querySelectorAll('.caption-item').forEach(el => {
                el.classList.remove('drag-over-top', 'drag-over-bottom');
            });
        }
    });
 
 
    legendList.addEventListener('drop', (e) => {
        e.preventDefault();
        const item = e.target.closest('.caption-item');
        if (item && draggedIdx !== null) {
            const rect = item.getBoundingClientRect();
            const relY = e.clientY - rect.top;
            const targetIdx = parseInt(item.dataset.idx);
            
            let dropIdx = targetIdx;
            if (relY >= rect.height / 2) {
                dropIdx = targetIdx + 1;
            }
            
            // Adjust for the removal of the original item
            const finalDropIdx = (draggedIdx < dropIdx) ? dropIdx - 1 : dropIdx;
 
            if (draggedIdx !== finalDropIdx) {
                const markers = state.currentProject.markers;
                const [moved] = markers.splice(draggedIdx, 1);
                markers.splice(finalDropIdx, 0, moved);
                reindexMarkers(state.currentProject);
                saveAndSyncWorkspace(state, renderApp);
            }
        }
    });
 
    legendList.addEventListener('dragend', () => {
        draggedIdx = null;
        ws.classList.remove('dragging-active');
        syncWorkspace(state, renderApp);
    });
 
    // Removed onmouseover/onmouseout for marker-legend-list based on user request.
 
    // --- Plant List Events ---
    const plantList = ws.querySelector('#plant-legend-list');
    plantList.onclick = (e) => {
        const item = e.target.closest('.caption-item');
        if (item) {
            const species = item.dataset.species;
            if (state.selectedSpeciesId === species) {
                state.selectedSpeciesId = null;
            } else {
                state.selectedSpeciesId = species;
            }
            syncWorkspace(state, renderApp);
        }
    };
 
    plantList.onmouseover = (e) => {
        const item = e.target.closest('.caption-item');
        if (item) {
            const species = item.dataset.species;
            state.currentProject.markers.forEach((m, idx) => {
                if (m.scientificName === species) {
                    const marker = ws.querySelector(`#marker-${idx}`);
                    if (marker) marker.classList.add('selected');
                }
            });
        }
    };
 
    plantList.onmouseout = (e) => {
        const item = e.target.closest('.caption-item');
        if (item) {
            const species = item.dataset.species;
            state.currentProject.markers.forEach((m, idx) => {
                if (m.scientificName === species && state.selectedSpeciesId !== species) {
                    const marker = ws.querySelector(`#marker-${idx}`);
                    if (marker) marker.classList.remove('selected');
                }
            });
        }
    };
 
    // --- Image interactions: Zoom ---
    // Use capture: true so this fires before any overlay can swallow the event,
    // regardless of pointer-events settings on child layers (buildings overlay, marker overlay, etc.)
    imageContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const delta = -e.deltaY;
        const scaleFactor = 1.1;
        const newScale = delta > 0 ? state.zoom.scale * scaleFactor : state.zoom.scale / scaleFactor;
        const clampedScale = Math.max(0.1, Math.min(10, newScale));
 
        if (clampedScale !== state.zoom.scale) {
            const rect = imageContainer.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            state.zoom.x = mouseX - (mouseX - state.zoom.x) * (clampedScale / state.zoom.scale);
            state.zoom.y = mouseY - (mouseY - state.zoom.y) * (clampedScale / state.zoom.scale);
            state.zoom.scale = clampedScale;
            syncTransform(state);
        }
    }, { passive: false, capture: true });
 
    // --- Image interactions: Pan ---
    let isPanning = false;
    let startPanX = 0, startPanY = 0;
    imageContainer.addEventListener('mousedown', (e) => {
        if (e.shiftKey) {
            isPanning = true;
            imageCanvas.classList.add('panning');
            startPanX = e.clientX - state.zoom.x;
            startPanY = e.clientY - state.zoom.y;
            e.preventDefault();
            e.stopPropagation();
        }
    });
    window.addEventListener('mousemove', (e) => {
        if (isPanning) {
            state.zoom.x = e.clientX - startPanX;
            state.zoom.y = e.clientY - startPanY;
            syncTransform(state);
        }
    });
    window.addEventListener('mouseup', () => {
        isPanning = false;
        imageCanvas.classList.remove('panning');
    });
 
    // --- Drawing & Interaction ---
    const imageLayer = ws.querySelector('#image-wrap');
    
    imageLayer.onmousedown = (e) => {
        const project = state.currentProject;
        const img = ws.querySelector('#main-image');
        if (!img) return;
 
        // Mode: BUILDINGS
        if (state.mode === 'buildings') {
            const delBtn = e.target.closest('.delete-building-btn');
            if (delBtn) return;
            
            const rotateHandle = e.target.closest('.rotate-handle');
            const resizeHandle = e.target.closest('.resize-handle');
            const blockEl = e.target.closest('.building-block');
            
            if (rotateHandle || resizeHandle || blockEl) {
                const action = rotateHandle ? 'rotate' : (resizeHandle ? 'resize' : 'move');
                const idx = parseInt((rotateHandle || resizeHandle || blockEl).dataset.idx);
                handleBuildingAction(e, idx, action, state, renderApp);
                return;
            }
 
            // Start Drawing (Percent based)
            const rect = img.getBoundingClientRect();
            const startX = ((e.clientX - rect.left) / rect.width) * 100;
            const startY = ((e.clientY - rect.top) / rect.height) * 100;
 
            state.drawingState = { active: true, startX, startY, currentX: startX, currentY: startY };
            const preview = ws.querySelector('#drawing-preview');
            
            const onMouseMove = (ev) => {
                state.drawingState.currentX = ((ev.clientX - rect.left) / rect.width) * 100;
                state.drawingState.currentY = ((ev.clientY - rect.top) / rect.height) * 100;
                syncWorkspace(state, renderApp);
            };
 
            const onMouseUp = () => {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
                if (state.drawingState?.active) {
                    const width = Math.abs(state.drawingState.currentX - state.drawingState.startX);
                    const height = Math.abs(state.drawingState.currentY - state.drawingState.startY);
                    if (width > 1 && height > 1) {
                        const left = Math.min(state.drawingState.startX, state.drawingState.currentX);
                        const top = Math.min(state.drawingState.startY, state.drawingState.currentY);
                        const h = prompt("Building height (m):", "10");
                        if (h !== null) {
                            project.buildings.push({ x: left, y: top, width, height, zHeight: parseFloat(h) || 10 });
                            saveAndSyncWorkspace(state, renderApp);
                        }
                    }
                }
                state.drawingState = null;
                syncWorkspace(state, renderApp);
            };
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        } else {
            // Mode: MARKERS
            // Only start a drag if the mousedown is directly on a marker (not delete btn)
            if (e.target.closest('.delete-btn')) return;
            const markerEl = e.target.closest('.marker');
            if (markerEl) {
                handleMarkerMouseDown(e, parseInt(markerEl.dataset.idx), state, renderApp);
            }
        }
    };
 
    imageLayer.onclick = (e) => {
        const project = state.currentProject;
        const img = ws.querySelector('#main-image');
        if (!project.image || !img) return;
 
        if (state.mode === 'buildings') {
            const delBtn = e.target.closest('.delete-building-btn');
            if (delBtn) {
                e.stopPropagation();
                project.buildings.splice(parseInt(delBtn.dataset.idx), 1);
                saveAndSyncWorkspace(state, renderApp);
                return;
            }
            const blockEl = e.target.closest('.building-block');
            if (blockEl && !state.dragState.isDragging) {
                e.stopPropagation();
                const idx = parseInt(blockEl.dataset.idx);
                const h = prompt("Set building height:", project.buildings[idx].zHeight);
                if (h !== null) {
                    project.buildings[idx].zHeight = parseFloat(h) || project.buildings[idx].zHeight;
                    saveAndSyncWorkspace(state, renderApp);
                }
            }
            return;
        }
 
        // Marker Mode: delete button
        const delBtn = e.target.closest('.marker .delete-btn');
        if (delBtn) {
            e.stopPropagation();
            deleteMarker(parseInt(delBtn.dataset.idx), state, renderApp);
            return;
        }
 
        // Marker Mode: open editor on click (only if not a drag)
        const markerEl = e.target.closest('.marker');
        if (markerEl) {
            e.stopPropagation();
            if (!state.dragState.isDragging) {
                openMarkerEditor(parseInt(markerEl.dataset.idx), state, project, renderApp);
            }
            return;
        }
 
        // Add new marker — skip if panning or dragging
        if (e.shiftKey || state.dragState.isDragging) return;
 
        const rect = img.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
 
        if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
            const label = getNextAutoLabel(project);
            project.markers.push({ x, y, label, title: '', description: '', images: [] });
            saveAndSyncWorkspace(state, renderApp);
        }
    };
 
    // --- SETTINGS MODAL ---
    const settingsBtn = ws.querySelector('#settings-btn');
    const settingsModal = ws.querySelector('#settings-modal');
    const apiKeyInput = ws.querySelector('#settings-api-key');
 
    settingsBtn.onclick = () => {
        apiKeyInput.value = state.settings.plantApiKey || '';
        settingsModal.classList.add('open');
    };
 
    ws.querySelector('#close-settings').onclick = () => settingsModal.classList.remove('open');
    settingsModal.onclick = (e) => {
        if (e.target === settingsModal) settingsModal.classList.remove('open');
    };
    ws.querySelector('#save-settings-btn').onclick = () => {
        state.settings.plantApiKey = apiKeyInput.value.trim();
        Storage.saveSettings(state.settings);
        settingsModal.classList.remove('open');
    };
}
 
 
// --- Sync state to DOM ---
export function syncWorkspace(state, renderApp) {
    const ws = document.querySelector('#workspace-view');
    const project = state.currentProject;
    if (!project) return;
 
    // --- Toolbar ---
    ws.querySelector('#project-title').textContent = project.name;
    ws.querySelector('#marker-type-select').value = project.markerType;
    ws.querySelector('#mode-buildings-btn').classList.toggle('active', state.mode === 'buildings');
    
    const toggleShadowsBtn = ws.querySelector('#toggle-shadows-btn');
    if (toggleShadowsBtn) {
        toggleShadowsBtn.classList.toggle('active', state.showShadows);
    }
    
    // --- Sidebar & Weather Drawers ---
    const sidebarDrawer = ws.querySelector('#sidebar-drawer');
    const sidebarToggleBtn = ws.querySelector('#sidebar-toggle-btn');
    const sideIcon = sidebarToggleBtn.querySelector('.sidebar-toggle-icon');
    
    sidebarDrawer.classList.toggle('open', state.isDrawerOpen);
    sidebarToggleBtn.classList.toggle('active', state.isDrawerOpen);
    if (sideIcon) sideIcon.style.transform = state.isDrawerOpen ? 'rotate(90deg)' : 'rotate(0deg)';
 
    const weatherDrawer = ws.querySelector('#weather-drawer');
    const weatherToggleBtn = ws.querySelector('#weather-toggle-btn');
    if (weatherDrawer && weatherToggleBtn) {
        weatherDrawer.classList.toggle('open', state.isWeatherOpen);
        weatherToggleBtn.classList.toggle('active', state.isWeatherOpen);
        if (state.isWeatherOpen) syncWeatherPanel(state, renderApp);
    }
 
    // --- Zoom Layer ---
    const imageCanvas = ws.querySelector('#image-canvas');
    imageCanvas.style.transform = `translate(${state.zoom.x}px, ${state.zoom.y}px) scale(${state.zoom.scale})`;
 
    // --- Image & Layers ---
    const imageWrap = ws.querySelector('#image-wrap');
    let img = ws.querySelector('#main-image');
    if (project.image) {
        if (!img) {
            imageWrap.innerHTML = `
                <img src="${project.image}" id="main-image" class="main-image">
                <svg id="shadow-environment" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <rect width="100%" height="100%" fill="transparent" id="sun-wash-rect"></rect>
                    <g id="shadow-polygons"></g>
                    <g id="tree-shadow-polygons"></g>
                </svg>
                <div class="buildings-overlay" id="buildings-overlay">
                    <div id="drawing-preview" style="display:none; position:absolute; border:2px dashed #0ea5e9; background:rgba(14, 165, 233, 0.2); z-index:50;"></div>
                </div>
                <div class="marker-overlay" id="marker-overlay"></div>
            `;
            img = ws.querySelector('#main-image');
            img.onload = () => syncWorkspace(state, renderApp);
        } else if (img.src !== project.image) {
            img.src = project.image;
        }
    } else {
        imageWrap.innerHTML = '<div style="color: rgba(0,0,0,0.3); font-size: 1.5rem; padding: 4rem;">Upload an image to start tagging</div>';
        return;
    }
 
    if (!img || !img.complete) return;
 
    // Buildings overlay: only interactive in buildings mode.
    // Use pointer-events on the overlay itself so marker-overlay always receives events in marker mode.
    const buildingsOverlayContainer = ws.querySelector('#buildings-overlay');
    buildingsOverlayContainer.style.pointerEvents = state.mode === 'buildings' ? 'auto' : 'none';
    buildingsOverlayContainer.style.display = state.mode === 'buildings' ? 'block' : 'none';
 
    // RENDER MARKERS (Percentages)
    const markerOverlay = ws.querySelector('#marker-overlay');
    markerOverlay.innerHTML = project.markers.map((m, idx) => {
        const isSelectedSpecies = (state.selectedSpeciesId && state.selectedSpeciesId === m.scientificName);
        return `
        <div class="marker ${isSelectedSpecies ? 'selected' : ''} ${m.isTree ? 'is-tree' : ''}" 
             data-idx="${idx}" id="marker-${idx}"
             style="left:${m.x}%; top:${m.y}%;">
            ${m.label || idx + 1}
            <div class="delete-btn" data-idx="${idx}">&times;</div>
        </div>
    `}).join('');
 
    // RENDER BUILDINGS (Percentages)
    const buildingsOverlay = ws.querySelector('#buildings-overlay');
    const existingPreview = ws.querySelector('#drawing-preview');
    const buildingContent = project.buildings.map((b, idx) => `
        <div class="building-block" data-idx="${idx}" style="left:${b.x}%; top:${b.y}%; width:${b.width}%; height:${b.height}%; transform: rotate(${b.angle || 0}deg);">
            <b>${b.zHeight !== undefined ? b.zHeight : 10}m</b>
            ${state.mode==='buildings' ? `
                <div class="delete-building-btn" data-idx="${idx}">&times;</div>
                <div class="resize-handle" data-idx="${idx}"></div>
                <div class="rotate-handle" data-idx="${idx}"></div>
            ` : ''}
        </div>
    `).join('');
    buildingsOverlay.innerHTML = buildingContent + existingPreview.outerHTML;
 
    // DRAWING PREVIEW
    const preview = ws.querySelector('#drawing-preview');
    if (state.drawingState?.active) {
        const ds = state.drawingState;
        preview.style.left = Math.min(ds.startX, ds.currentX) + '%';
        preview.style.top = Math.min(ds.startY, ds.currentY) + '%';
        preview.style.width = Math.abs(ds.currentX - ds.startX) + '%';
        preview.style.height = Math.abs(ds.currentY - ds.startY) + '%';
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
 
    // COMPASS
    const compassContainer = ws.querySelector('#sun-overlay-container');
    if (!compassContainer.querySelector('.sun-compass')) {
        compassContainer.innerHTML = renderSunOverlay();
    }
 
    // --- Sidebar Tabs ---
    ws.querySelector('#tab-markers').classList.toggle('btn-primary', state.activeTab === 'markers');
    ws.querySelector('#tab-plants').classList.toggle('btn-primary', state.activeTab === 'plants');
    ws.querySelector('#tab-sun').classList.toggle('btn-primary', state.activeTab === 'sun');
    ws.querySelector('#marker-list-section').classList.toggle('hidden', state.activeTab !== 'markers');
    ws.querySelector('#plants-list-section').classList.toggle('hidden', state.activeTab !== 'plants');
    ws.querySelector('#sun-panel-section').classList.toggle('hidden', state.activeTab !== 'sun');
 
    if (state.activeTab === 'markers') {
        ws.querySelector('#marker-count-label').textContent = `Markers (${project.markers.length})`;
        ws.querySelector('#marker-legend-list').innerHTML = project.markers.map((m, idx) => `
            <div class="caption-item" data-idx="${idx}" draggable="true">
                <div class="caption-item-card">
                    <div class="caption-label-chip">${m.label || (idx+1)}</div>
                    <div class="caption-content" style="flex:1;">
                        <div class="caption-title">${m.title || 'Add Title...'}</div>
                    </div>
                </div>
            </div>
        `).join('');
    } else if (state.activeTab === 'plants') {
        const query = state.plantSearchQuery || '';
        const speciesMap = new Map();
        
        project.markers.forEach(m => {
            if (m.scientificName) {
                if (!speciesMap.has(m.scientificName)) {
                    speciesMap.set(m.scientificName, {
                        scientificName: m.scientificName,
                        title: m.title || 'Unknown Common Name',
                        count: 0
                    });
                }
                speciesMap.get(m.scientificName).count++;
            }
        });
        
        const speciesList = Array.from(speciesMap.values());
        const filteredSpecies = speciesList.filter(s => 
            s.scientificName.toLowerCase().includes(query) || 
            s.title.toLowerCase().includes(query)
        );
        
        ws.querySelector('#plant-count-label').textContent = `Species (${filteredSpecies.length})`;
        ws.querySelector('#plant-legend-list').innerHTML = filteredSpecies.map(s => `
            <div class="caption-item ${state.selectedSpeciesId === s.scientificName ? 'active' : ''}" data-species="${s.scientificName}">
                <div class="caption-item-card">
                    <div class="caption-label-chip" style="background: var(--amazon-light);">🌱</div>
                    <div class="caption-content" style="flex:1;">
                        <div class="caption-title" style="font-style: italic;">${s.scientificName}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">${s.title} (${s.count} marker${s.count > 1 ? 's' : ''})</div>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        wireSunPanel(state, renderApp, updateSunOverlayStyles);
    }
 
    syncSunOverlay(project, state, updateSunOverlayStyles);
}
 
// --- Interaction Handlers ---
function handleBuildingAction(e, idxInt, action, state, renderApp) {
    e.preventDefault(); e.stopPropagation();
    const ws = document.querySelector('#workspace-view');
    const img = ws.querySelector('#main-image');
    const b = state.currentProject.buildings[idxInt];
    const rect = img.getBoundingClientRect();
    const startClientX = e.clientX, startClientY = e.clientY;
    const startX = b.x, startY = b.y, startW = b.width, startH = b.height;
    const DRAG_THRESHOLD = 3; // pixels
 
    state.dragState.isDragging = false;
    const onMouseMove = (ev) => {
        const dist = Math.sqrt(Math.pow(ev.clientX - startClientX, 2) + Math.pow(ev.clientY - startClientY, 2));
        if (dist < DRAG_THRESHOLD && !state.dragState.isDragging) return;
 
        state.dragState.isDragging = true;
        const dx = ((ev.clientX - startClientX) / rect.width) * 100;
        const dy = ((ev.clientY - startClientY) / rect.height) * 100;
        const blockEl = ws.querySelector(`.building-block[data-idx="${idxInt}"]`);
 
        if (action === 'move') {
            b.x = Math.max(0, Math.min(100 - b.width, startX + dx));
            b.y = Math.max(0, Math.min(100 - b.height, startY + dy));
            if (blockEl) {
                blockEl.style.left = b.x + '%';
                blockEl.style.top = b.y + '%';
            }
        } else if (action === 'resize') {
            b.width = Math.max(1, Math.min(100 - b.x, startW + dx));
            b.height = Math.max(1, Math.min(100 - b.y, startH + dy));
            if (blockEl) {
                blockEl.style.width = b.width + '%';
                blockEl.style.height = b.height + '%';
            }
        } else if (action === 'rotate') {
            const centerX = rect.left + (startX + startW/2) / 100 * rect.width;
            const centerY = rect.top + (startY + startH/2) / 100 * rect.height;
            b.angle = (Math.atan2(ev.clientY - centerY, ev.clientX - centerX) * 180 / Math.PI) + 90;
            if (blockEl) {
                blockEl.style.transform = `rotate(${b.angle || 0}deg)`;
            }
        }
        
        syncSunOverlay(state.currentProject, state, updateSunOverlayStyles);
    };
    const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        if (state.dragState.isDragging) {
            Storage.saveProject(state.currentProject);
            syncWorkspace(state, renderApp);
            setTimeout(() => state.dragState.isDragging = false, 50);
        }
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
}
 
function handleMarkerMouseDown(e, idxInt, state, renderApp) {
    e.preventDefault(); e.stopPropagation();
    const ws = document.querySelector('#workspace-view');
    const img = ws.querySelector('#main-image');
    const marker = state.currentProject.markers[idxInt];
    const markerEl = ws.querySelector(`#marker-${idxInt}`);
    const startClientX = e.clientX, startClientY = e.clientY;
    const DRAG_THRESHOLD = 3; // pixels
    
    state.dragState.isDragging = false;
    const onMouseMove = (ev) => {
        const dist = Math.sqrt(Math.pow(ev.clientX - startClientX, 2) + Math.pow(ev.clientY - startClientY, 2));
        if (dist < DRAG_THRESHOLD && !state.dragState.isDragging) return;
 
        state.dragState.isDragging = true;
        const rect = img.getBoundingClientRect();
        marker.x = Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100));
        marker.y = Math.max(0, Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100));
        
        if (markerEl) {
            markerEl.style.left = `${marker.x}%`;
            markerEl.style.top = `${marker.y}%`;
        }
        
        if (state.showShadows) {
            syncSunOverlay(state.currentProject, state, updateSunOverlayStyles);
        }
    };
    const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        if (state.dragState.isDragging) {
            Storage.saveProject(state.currentProject);
            syncWorkspace(state, renderApp);
            setTimeout(() => state.dragState.isDragging = false, 50);
        }
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
}
 