import { Storage } from '../storage';
import { getNextAutoLabel, reindexMarkers } from '../state';
import { openMarkerEditor } from './markerEditor';
import { getSunPanelHTML, wireSunPanel, syncSunOverlay } from './sunPanel';
import { renderSunOverlay, updateSunOverlayStyles } from './sunOverlay';

// --- Helpers ---
function deleteMarker(idx, app, state, renderWorkspace, renderApp) {
    if (confirm('Delete this marker?')) {
        state.currentProject.markers.splice(idx, 1);
        reindexMarkers(state.currentProject);
        state.currentProject.updatedAt = Date.now();
        saveAndRenderWorkspace(app, state, renderWorkspace, renderApp);
    }
}

function saveAndRenderWorkspace(app, state, renderWorkspace, renderApp) {
    Storage.saveProject(state.currentProject);
    renderWorkspace(app, state, renderApp);
}

// --- Main Render ---
export function renderWorkspace(app, state, renderApp) {
    const project = state.currentProject;

    // Full-screen mode
    app.classList.add('workspace-mode');

    app.innerHTML = `
        <div class="workspace">

            <!-- Full-screen image area (acts as background) -->
            <div class="image-area" id="image-container">
                <div class="image-canvas" id="image-canvas">
                    ${project.image
                        ? `<img src="${project.image}" id="main-image" class="main-image">`
                        : '<div style="color: rgba(0,0,0,0.3); font-size: 1rem; pointer-events:none;">Upload an image to start tagging</div>'}
                </div>
                
                <!-- Shadow Environment SVG -->
                <svg id="shadow-environment" viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:48; pointer-events:none;">
                    <rect width="100%" height="100%" fill="transparent" id="sun-wash-rect"></rect>
                    <g id="shadow-polygons"></g>
                    <g id="tree-shadow-polygons"></g>
                </svg>

                <div class="marker-overlay" id="marker-overlay">
                    ${project.markers.map((m, idx) => `
                        <div class="marker ${state.selectedMarkerIdx == idx ? 'selected' : ''} ${m.isTree ? 'is-tree' : ''}" data-idx="${idx}" id="marker-${idx}">
                            ${m.isTree ? '🌳' : (m.label || idx + 1)}
                            <div class="delete-btn" data-idx="${idx}">&times;</div>
                        </div>
                    `).join('')}
                </div>

                <div class="buildings-overlay" id="buildings-overlay" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:49; pointer-events: ${state.mode==='buildings'?'auto':'none'};">
                    ${project.buildings.map((b, idx) => `
                        <div class="building-block" data-idx="${idx}" style="position:absolute; background:rgba(30,30,30,0.6); border:1px solid #111; cursor: pointer; display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,0.8); font-size: 0.75rem; transform: rotate(${b.angle || 0}deg);">
                            <b>${b.zHeight}m</b>
                            ${state.mode==='buildings' ? `<div class="delete-building-btn" data-idx="${idx}" style="position:absolute; top:-10px; right:-10px; background:#ef4444; color:white; border-radius:50%; width:20px; height:20px; line-height:18px; text-align:center; cursor:pointer; z-index:11;">&times;</div>` : ''}
                            ${state.mode==='buildings' ? `<div class="resize-handle" data-idx="${idx}" style="position:absolute; right:0; bottom:0; width:12px; height:12px; background:rgba(255,255,255,0.4); border-top-left-radius: 4px; cursor:nwse-resize; z-index:10;"></div>` : ''}
                            ${state.mode==='buildings' ? `<div class="rotate-handle" data-idx="${idx}" style="position:absolute; top:-15px; left:50%; margin-left:-6px; width:12px; height:12px; background:rgba(14,165,233,0.8); border:1px solid white; border-radius:50%; cursor:crosshair; z-index:10;"></div>` : ''}
                        </div>
                    `).join('')}
                    <div id="drawing-preview" style="display:none; position:absolute; border:2px dashed #0ea5e9; background:rgba(14, 165, 233, 0.2); z-index:50;"></div>
                </div>

                <!-- Sun Overlay Compass -->
                <div id="sun-overlay-container" style="position: absolute; bottom: 20px; left: 20px; pointer-events: none; z-index: 101;">
                    ${renderSunOverlay()}
                </div>
            </div>

            <!-- Floating toolbar -->
            <div class="workspace-toolbar">
                <button class="btn" id="back-btn">&#8592; Back</button>
                <span style="width:1px;height:1.2rem;background:rgba(255,255,255,0.15);display:inline-block;"></span>
                <h1 class="title toolbar-title" id="project-title" title="Click to rename">${project.name}</h1>
                <span style="width:1px;height:1.2rem;background:rgba(255,255,255,0.15);display:inline-block;"></span>
                <span class="hint">Shift+Scroll: Zoom &bull; Shift+Drag: Pan</span>
                <button class="btn" id="reset-zoom-btn" title="Reset Zoom">&#8634; Reset</button>
                <select id="marker-type-select" class="search-input" style="width:auto;">
                    <option value="number" ${project.markerType === 'number' ? 'selected' : ''}>Numbers</option>
                    <option value="letter" ${project.markerType === 'letter' ? 'selected' : ''}>Letters</option>
                </select>
                <button class="btn btn-primary" id="upload-btn">Upload Image</button>
                <input type="file" id="file-input" hidden accept="image/*">
                
                <span style="width:1px;height:1.2rem;background:rgba(255,255,255,0.15);display:inline-block; margin:0 0.5rem;"></span>
                
                <div style="display:flex; background: rgba(0,0,0,0.1); border-radius: 0.5rem; padding: 2px;">
                    <button class="btn ${state.mode==='markers' ? 'btn-primary' : ''}" id="mode-markers-btn" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; border:none; background: ${state.mode==='markers' ? 'var(--amazon-primary)' : 'transparent'}; color: ${state.mode==='markers' ? '#fff' : 'var(--text-primary)'}; box-shadow: none;">Markers</button>
                    <button class="btn ${state.mode==='buildings' ? 'btn-primary' : ''}" id="mode-buildings-btn" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; border:none; background: ${state.mode==='buildings' ? 'var(--amazon-primary)' : 'transparent'}; color: ${state.mode==='buildings' ? '#fff' : 'var(--text-primary)'}; box-shadow: none;">Buildings</button>
                </div>

                <span style="width:1px;height:1.2rem;background:rgba(255,255,255,0.15);display:inline-block; margin:0 0.5rem;"></span>
                
                <button class="btn toolbar-markers-btn ${state.isDrawerOpen ? 'active' : ''}" id="sidebar-toggle-btn" title="Toggle Sidebar">
                    <span class="sidebar-toggle-icon" style="font-size:1rem; transform: ${state.isDrawerOpen ? 'rotate(90deg)' : 'rotate(0deg)'};">&#9776;</span>
                </button>
            </div>

            <!-- Collapsible right-side drawer -->
            <div class="sidebar-drawer ${state.isDrawerOpen ? 'open' : ''}" id="sidebar-drawer">
                <div class="sidebar-panel" style="display: flex; flex-direction: column;">
                    <!-- Tabs -->
                    <div class="sidebar-tabs" style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
                        <button class="btn ${state.activeTab === 'markers' ? 'btn-primary' : ''}" id="tab-markers" style="flex:1;">Markers</button>
                        <button class="btn ${state.activeTab === 'sun' ? 'btn-primary' : ''}" id="tab-sun" style="flex:1;">Sun Env</button>
                    </div>

                    <div style="flex: 1; overflow-y: auto; overflow-x: hidden;">
                        ${state.activeTab === 'markers' ? `
                            <div class="sidebar-panel-heading">Markers (${project.markers.length})</div>
                            <div class="sidebar">
                                ${project.markers.map((m, idx) => {
                                    const label = m.label || (idx + 1).toString();
                                    return `
                                        <div class="caption-item ${state.selectedMarkerIdx == idx ? 'active' : ''}" data-idx="${idx}">
                                            <div class="caption-label-chip">${label}</div>
                                            <div class="caption-content" style="flex:1;">
                                                <div class="caption-title">${m.title || 'Add Title...'}</div>
                                            </div>
                                            <button class="delete-legend-btn" data-idx="${idx}">&times;</button>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        ` : ''}

                        ${state.activeTab === 'sun' ? getSunPanelHTML(project, state) : ''}
                    </div>
                </div>
            </div>

        </div>

        <!-- Marker Editor Modal -->
        <div class="modal-overlay" id="marker-editor-modal">
            <div class="modal">
                <span class="modal-close" id="close-editor">&times;</span>
                <h2 id="editor-title" style="margin-bottom:1.5rem; color:var(--amazon-dark);">Edit Marker</h2>

                <div class="form-group">
                    <label class="form-label">Title / Name</label>
                    <input type="text" id="edit-title" class="search-input" style="padding-left:1rem;" placeholder="e.g. Main Entrance">
                </div>

                <div class="form-group">
                    <label class="form-label">Technical Identifier (Number/Letter)</label>
                    <input type="text" id="edit-label" class="search-input" style="padding-left:1rem;">
                </div>

                <div class="form-group">
                    <label class="form-label">Detailed Description</label>
                    <textarea id="edit-description" class="form-textarea" placeholder="Describe this point in detail..."></textarea>
                </div>

                <!-- Tree Settings Section -->
                <div style="margin-top: 1rem; padding: 1rem; background: rgba(34, 197, 94, 0.1); border-radius: 0.5rem; border: 1px dashed rgba(34, 197, 94, 0.3);">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <input type="checkbox" id="edit-is-tree" style="width: 1.2rem; height: 1.2rem; cursor: pointer;">
                        <label for="edit-is-tree" class="form-label" style="margin-bottom: 0; cursor: pointer; color: #15803d; font-weight: bold;">Designate as a Tree 🌳</label>
                    </div>
                    
                    <div id="tree-settings-fields" style="display: none; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label">Height (m)</label>
                            <input type="number" id="edit-tree-height" class="search-input" style="padding-left: 1rem;" placeholder="e.g. 15">
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label">Canopy Diam (m)</label>
                            <input type="number" id="edit-tree-canopy" class="search-input" style="padding-left: 1rem;" placeholder="e.g. 8">
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Photo Gallery (<span id="img-count">0</span>)</label>
                    <div class="gallery-grid" id="gallery-grid"></div>
                    <input type="file" id="marker-img-input" hidden accept="image/*" multiple>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:2rem;">
                    <button class="btn btn-danger" id="delete-marker-final">Delete Marker</button>
                    <button class="btn btn-primary" id="save-marker-details">Save Changes</button>
                </div>
            </div>
        </div>
    `;

    // --- DOM References ---
    const imageContainer = app.querySelector('#image-container');
    const imageCanvas = app.querySelector('#image-canvas');
    const img = app.querySelector('#main-image');

    // --- Drawer Toggle ---
    const drawer = app.querySelector('#sidebar-drawer');
    const toggleBtn = app.querySelector('#sidebar-toggle-btn');
    toggleBtn.onclick = () => {
        state.isDrawerOpen = !state.isDrawerOpen;
        drawer.classList.toggle('open', state.isDrawerOpen);
        toggleBtn.classList.toggle('active', state.isDrawerOpen);
        const icon = toggleBtn.querySelector('.sidebar-toggle-icon');
        if (icon) icon.style.transform = state.isDrawerOpen ? 'rotate(90deg)' : 'rotate(0deg)';
    };

    // --- Inline project rename ---
    const titleEl = app.querySelector('#project-title');
    titleEl.addEventListener('click', () => {
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
                // Update state projects list too
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

    // --- Mode Toggle ---
    const markersBtn = app.querySelector('#mode-markers-btn');
    const buildingsBtn = app.querySelector('#mode-buildings-btn');
    if (markersBtn) {
        markersBtn.onclick = () => {
            if (state.mode !== 'markers') {
                state.mode = 'markers';
                renderWorkspace(app, state, renderApp);
            }
        };
    }
    if (buildingsBtn) {
        buildingsBtn.onclick = () => {
            if (state.mode !== 'buildings') {
                state.mode = 'buildings';
                renderWorkspace(app, state, renderApp);
            }
        };
    }

    // --- Sidebar Tabs ---
    app.querySelector('#tab-markers').onclick = () => {
        if (state.activeTab !== 'markers') {
            state.activeTab = 'markers';
            renderWorkspace(app, state, renderApp);
        }
    };
    app.querySelector('#tab-sun').onclick = () => {
        if (state.activeTab !== 'sun') {
            state.activeTab = 'sun';
            renderWorkspace(app, state, renderApp);
        }
    };

    // --- Wire Active Panel ---
    if (state.activeTab === 'sun') {
        wireSunPanel(app, state, renderWorkspace, renderApp, updateSunOverlayStyles);
    }

    // --- Sidebar events (delegation) ---
    const sidebar = app.querySelector('.sidebar');
    if (sidebar) {
        sidebar.onclick = (e) => {
            const delLegendBtn = e.target.closest('.delete-legend-btn');
            if (delLegendBtn) {
                e.stopPropagation();
                deleteMarker(parseInt(delLegendBtn.dataset.idx), app, state, renderWorkspace, renderApp);
                return;
            }
            const captionItem = e.target.closest('.caption-item');
            if (captionItem) {
                openMarkerEditor(parseInt(captionItem.dataset.idx), app, state, project, renderWorkspace, renderApp);
                return;
            }
        };

        sidebar.onmouseover = (e) => {
            const item = e.target.closest('.caption-item');
            if (item) {
                const marker = app.querySelector(`#marker-${item.dataset.idx}`);
                if (marker) marker.classList.add('selected');
            }
        };
        sidebar.onmouseout = (e) => {
            const item = e.target.closest('.caption-item');
            if (item) {
                const marker = app.querySelector(`#marker-${item.dataset.idx}`);
                if (marker) marker.classList.remove('selected');
            }
        };
    }

    // --- Marker Position Sync ---
    const updateWorkspace = () => {
        if (!img) return;

        imageCanvas.style.transform = `translate(${state.zoom.x}px, ${state.zoom.y}px) scale(${state.zoom.scale})`;

        const rect = img.getBoundingClientRect();
        const containerRect = imageContainer.getBoundingClientRect();

        // Sync marker positions
        project.markers.forEach((m, idx) => {
            const markerEl = app.querySelector(`#marker-${idx}`);
            if (markerEl) {
                const x = (m.x / 100) * rect.width + (rect.left - containerRect.left);
                const y = (m.y / 100) * rect.height + (rect.top - containerRect.top);
                markerEl.style.left = `${x}px`;
                markerEl.style.top = `${y}px`;
            }
        });

        // Sync building blocks
        project.buildings.forEach((b, idx) => {
            const blockEl = app.querySelector(`.building-block[data-idx="${idx}"]`);
            if (blockEl) {
                const x = (b.x / 100) * rect.width + (rect.left - containerRect.left);
                const y = (b.y / 100) * rect.height + (rect.top - containerRect.top);
                const w = (b.width / 100) * rect.width;
                const h = (b.height / 100) * rect.height;
                blockEl.style.left = `${x}px`;
                blockEl.style.top = `${y}px`;
                blockEl.style.width = `${w}px`;
                blockEl.style.height = `${h}px`;
                blockEl.style.transform = `rotate(${b.angle || 0}deg)`;
            }
        });

        // We also need to map the Shadow SVG layer to the image perfectly
        const shadowEnv = app.querySelector('#shadow-environment');
        if (shadowEnv) {
            shadowEnv.style.left = `${rect.left - containerRect.left}px`;
            shadowEnv.style.top = `${rect.top - containerRect.top}px`;
            shadowEnv.style.width = `${rect.width}px`;
            shadowEnv.style.height = `${rect.height}px`;
        }

        const drawingPreview = app.querySelector('#drawing-preview');
        if (drawingPreview && state.drawingState && state.drawingState.active) {
            const ds = state.drawingState;
            const leftPct = Math.min(ds.startX, ds.currentX);
            const topPct = Math.min(ds.startY, ds.currentY);
            const wPct = Math.abs(ds.currentX - ds.startX);
            const hPct = Math.abs(ds.currentY - ds.startY);
            
            const pxLeft = (leftPct / 100) * rect.width + (rect.left - containerRect.left);
            const pxTop = (topPct / 100) * rect.height + (rect.top - containerRect.top);
            const pxW = (wPct / 100) * rect.width;
            const pxH = (hPct / 100) * rect.height;

            drawingPreview.style.left = `${pxLeft}px`;
            drawingPreview.style.top = `${pxTop}px`;
            drawingPreview.style.width = `${pxW}px`;
            drawingPreview.style.height = `${pxH}px`;
        }
    };

    if (img) {
        if (img.complete) {
            requestAnimationFrame(updateWorkspace);
        } else {
            img.onload = () => requestAnimationFrame(updateWorkspace);
        }
    }

    // --- Zoom (Shift+Scroll) ---
    imageContainer.addEventListener('wheel', (e) => {
        if (!e.shiftKey) return;
        e.preventDefault();

        const delta = -e.deltaY;
        const scaleFactor = 1.1;
        const newScale = delta > 0 ? state.zoom.scale * scaleFactor : state.zoom.scale / scaleFactor;
        const clampedScale = Math.max(0.2, Math.min(5, newScale));

        if (clampedScale !== state.zoom.scale) {
            const rect = imageContainer.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            state.zoom.x = mouseX - (mouseX - state.zoom.x) * (clampedScale / state.zoom.scale);
            state.zoom.y = mouseY - (mouseY - state.zoom.y) * (clampedScale / state.zoom.scale);
            state.zoom.scale = clampedScale;
            updateWorkspace();
        }
    }, { passive: false });

    // --- Pan (Shift+Drag) ---
    let isPanning = false;
    let startPanX = 0, startPanY = 0;

    imageContainer.addEventListener('mousedown', (e) => {
        if (e.shiftKey) {
            isPanning = true;
            imageCanvas.classList.add('panning');
            startPanX = e.clientX - state.zoom.x;
            startPanY = e.clientY - state.zoom.y;
            e.preventDefault();
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (isPanning) {
            state.zoom.x = e.clientX - startPanX;
            state.zoom.y = e.clientY - startPanY;
            updateWorkspace();
        }
    });

    window.addEventListener('mouseup', () => {
        isPanning = false;
        if (imageCanvas) imageCanvas.classList.remove('panning');
    });

    // --- Marker Drag ---
    const handleMarkerMouseDown = (e, idxInt) => {
        if (e.target.classList.contains('delete-btn')) return;
        if (e.shiftKey) return;

        e.preventDefault();
        e.stopPropagation();

        state.dragState.isDragging = false;
        state.dragState.markerIdx = idxInt;

        const markerEl = app.querySelector(`#marker-${idxInt}`);

        const onMouseMove = (moveEvent) => {
            state.dragState.isDragging = true;
            const rect = img.getBoundingClientRect();

            let x = ((moveEvent.clientX - rect.left) / rect.width) * 100;
            let y = ((moveEvent.clientY - rect.top) / rect.height) * 100;

            x = Math.max(0, Math.min(100, x));
            y = Math.max(0, Math.min(100, y));

            project.markers[idxInt].x = x;
            project.markers[idxInt].y = y;
            updateWorkspace();
            syncSunOverlay(project, state, updateSunOverlayStyles);

            if (markerEl) markerEl.classList.add('dragging');
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            if (state.dragState.isDragging) {
                if (markerEl) markerEl.classList.remove('dragging');
                project.updatedAt = Date.now();
                Storage.saveProject(project);
                syncSunOverlay(project, state, updateSunOverlayStyles);

                setTimeout(() => {
                    state.dragState.isDragging = false;
                    state.dragState.markerIdx = null;
                }, 50);
            } else {
                state.dragState.markerIdx = null;
            }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    // --- Building Drag & Resize ---
    const handleBuildingAction = (e, idxInt, action) => {
        e.preventDefault();
        e.stopPropagation();

        state.dragState.isDragging = false;
        state.dragState.blockIdx = idxInt;
        state.dragState.action = action;

        const rect = img.getBoundingClientRect();
        const startClientX = e.clientX;
        const startClientY = e.clientY;
        const b = project.buildings[idxInt];
        const startX = b.x;
        const startY = b.y;
        const startW = b.width;
        const startH = b.height;

        const onMouseMove = (moveEvent) => {
            state.dragState.isDragging = true;
            
            const deltaXPct = ((moveEvent.clientX - startClientX) / rect.width) * 100;
            const deltaYPct = ((moveEvent.clientY - startClientY) / rect.height) * 100;

            if (action === 'move') {
                let newX = startX + deltaXPct;
                let newY = startY + deltaYPct;
                newX = Math.max(0, Math.min(100 - startW, newX));
                newY = Math.max(0, Math.min(100 - startH, newY));
                project.buildings[idxInt].x = newX;
                project.buildings[idxInt].y = newY;
            } else if (action === 'resize') {
                let newW = startW + deltaXPct;
                let newH = startH + deltaYPct;
                newW = Math.max(2, Math.min(100 - startX, newW));
                newH = Math.max(2, Math.min(100 - startY, newH));
                project.buildings[idxInt].width = newW;
                project.buildings[idxInt].height = newH;
            } else if (action === 'rotate') {
                const centerPxX = rect.left + ((startX + startW/2) / 100) * rect.width;
                const centerPxY = rect.top + ((startY + startH/2) / 100) * rect.height;
                const dy = moveEvent.clientY - centerPxY;
                const dx = moveEvent.clientX - centerPxX;
                project.buildings[idxInt].angle = (Math.atan2(dy, dx) * 180 / Math.PI) + 90;
            }
            
            updateWorkspace();
            syncSunOverlay(project, state, updateSunOverlayStyles);
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            if (state.dragState.isDragging) {
                project.updatedAt = Date.now();
                Storage.saveProject(project);

                setTimeout(() => {
                    state.dragState.isDragging = false;
                    state.dragState.blockIdx = null;
                    state.dragState.action = null;
                }, 50);
            } else {
                state.dragState.blockIdx = null;
                state.dragState.action = null;
            }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    // --- Global Event Delegation ---
    imageContainer.onmousedown = (e) => {
        if (state.mode === 'buildings') {
            const delBtn = e.target.closest('.delete-building-btn');
            if (delBtn) return; // let click handle it
            
            const rotateHandle = e.target.closest('.rotate-handle');
            if (rotateHandle) {
                e.preventDefault();
                e.stopPropagation();
                handleBuildingAction(e, parseInt(rotateHandle.dataset.idx), 'rotate');
                return;
            }

            const resizeHandle = e.target.closest('.resize-handle');
            if (resizeHandle) {
                e.preventDefault();
                e.stopPropagation();
                handleBuildingAction(e, parseInt(resizeHandle.dataset.idx), 'resize');
                return;
            }

            const blockEl = e.target.closest('.building-block');
            if (blockEl) {
                e.preventDefault();
                e.stopPropagation();
                handleBuildingAction(e, parseInt(blockEl.dataset.idx), 'move');
                return;
            }

            const rect = img.getBoundingClientRect();
            const startX = ((e.clientX - rect.left) / rect.width) * 100;
            const startY = ((e.clientY - rect.top) / rect.height) * 100;

            if (startX < 0 || startX > 100 || startY < 0 || startY > 100) return;

            state.drawingState = {
                active: true,
                startX, startY,
                currentX: startX, currentY: startY
            };

            const preview = app.querySelector('#drawing-preview');
            const onMouseMove = (ev) => {
                state.drawingState.currentX = ((ev.clientX - rect.left) / rect.width) * 100;
                state.drawingState.currentY = ((ev.clientY - rect.top) / rect.height) * 100;
                
                preview.style.display = 'block';
                updateWorkspace();
            };

            const onMouseUp = (ev) => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                preview.style.display = 'none';

                if (state.drawingState && state.drawingState.active) {
                    const width = Math.abs(state.drawingState.currentX - state.drawingState.startX);
                    const height = Math.abs(state.drawingState.currentY - state.drawingState.startY);
                    
                    if (width > 2 && height > 2) {
                        const left = Math.min(state.drawingState.startX, state.drawingState.currentX);
                        const top = Math.min(state.drawingState.startY, state.drawingState.currentY);
                        
                        const heightInput = prompt("Enter building height (e.g. 5 for 5 meters):", "10");
                        
                        if (heightInput !== null) {
                            project.buildings.push({ x: left, y: top, width, height, zHeight: parseFloat(heightInput) || 10 });
                            project.updatedAt = Date.now();
                            saveAndRenderWorkspace(app, state, renderWorkspace, renderApp);
                        }
                    }
                }
                state.drawingState = null;
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            return;
        }

        // Marker mode logic
        const markerEl = e.target.closest('.marker');
        if (markerEl && !e.target.closest('.delete-btn')) {
            const idx = parseInt(markerEl.dataset.idx);
            handleMarkerMouseDown(e, idx);
        }
    };

    imageContainer.onclick = (e) => {
        if (!project.image || !img) return;

        if (state.mode === 'buildings') {
            const delBtn = e.target.closest('.delete-building-btn');
            if (delBtn) {
                e.stopPropagation();
                project.buildings.splice(parseInt(delBtn.dataset.idx), 1);
                project.updatedAt = Date.now();
                saveAndRenderWorkspace(app, state, renderWorkspace, renderApp);
                return;
            }
            const blockEl = e.target.closest('.building-block');
            if (blockEl && !state.dragState.isDragging) {
                e.stopPropagation();
                const idx = parseInt(blockEl.dataset.idx);
                const currentHeight = project.buildings[idx].zHeight;
                const newHeight = prompt("Set building height:", currentHeight);
                if (newHeight !== null) {
                    project.buildings[idx].zHeight = parseFloat(newHeight) || currentHeight;
                    project.updatedAt = Date.now();
                    saveAndRenderWorkspace(app, state, renderWorkspace, renderApp);
                }
                return;
            }
            return;
        }

        // Delete marker from image
        const delBtn = e.target.closest('.marker .delete-btn');
        if (delBtn) {
            e.stopPropagation();
            deleteMarker(parseInt(delBtn.dataset.idx), app, state, renderWorkspace, renderApp);
            return;
        }

        // Open editor on marker click
        const markerEl = e.target.closest('.marker');
        if (markerEl) {
            e.stopPropagation();
            if (!state.dragState.isDragging) {
                openMarkerEditor(parseInt(markerEl.dataset.idx), app, state, project, renderWorkspace, renderApp);
            }
            return;
        }

        // Add new marker on empty click
        if (e.shiftKey || state.dragState.isDragging) {
            state.dragState.isDragging = false;
            return;
        }

        const rect = img.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
            const label = getNextAutoLabel(project);
            project.markers.push({ x, y, label, title: '', description: '', images: [] });
            reindexMarkers(project);
            project.updatedAt = Date.now();
            saveAndRenderWorkspace(app, state, renderWorkspace, renderApp);
        }
    };

    // --- Toolbar Buttons ---
    app.querySelector('#reset-zoom-btn').onclick = () => {
        state.zoom = { scale: 1, x: 0, y: 0 };
        updateWorkspace();
    };

    app.querySelector('#back-btn').onclick = () => {
        state.view = 'dashboard';
        state.captionSearchQuery = '';
        app.classList.remove('workspace-mode');
        renderApp();
    };

    app.querySelector('#upload-btn').onclick = () => {
        app.querySelector('#file-input').click();
    };

    app.querySelector('#file-input').onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                project.image = ev.target.result;
                project.updatedAt = Date.now();
                saveAndRenderWorkspace(app, state, renderWorkspace, renderApp);
            };
            reader.readAsDataURL(file);
        }
    };

    app.querySelector('#marker-type-select').onchange = (e) => {
        project.markerType = e.target.value;
        saveAndRenderWorkspace(app, state, renderWorkspace, renderApp);
    };

    // Always sync the compass overlay visual, even if Sun tab isn't active
    syncSunOverlay(project, state, updateSunOverlayStyles);
}

