import './style.css';
import { Storage } from './storage';

// App State
const state = {
    view: 'dashboard', // 'dashboard' | 'workspace'
    projects: Storage.loadProjects(),
    currentProject: null,
    searchQuery: '',
    captionSearchQuery: '',
    selectedMarkerIdx: null,
    dragState: {
        isDragging: false,
        markerIdx: null
    },
    zoom: {
        scale: 1,
        x: 0,
        y: 0
    }
};

// --- DOM References ---
const app = document.querySelector('#app');

// --- Utilities ---
const generateId = () => Math.random().toString(36).substr(2, 9);

const getNextAutoLabel = (project) => {
    // By default, follow the project's last marker type or project.markerType
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

const reindexMarkers = (project) => {
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

// --- Components ---

function renderApp() {
    app.innerHTML = '';
    
    if (state.view === 'dashboard') {
        renderDashboard();
    } else {
        renderWorkspace();
    }
}

function renderDashboard() {
    const filteredProjects = state.projects.filter(p => 
        p.name.toLowerCase().includes(state.searchQuery.toLowerCase())
    );

    app.innerHTML = `
        <div class="dashboard fade-in">
            <header>
                <h1 class="title">My Projects</h1>
                <div class="search-container">
                    <input type="text" class="search-input" placeholder="Search projects..." value="${state.searchQuery}">
                </div>
                <button class="btn btn-primary" id="new-project-btn">
                    <span>+</span> New Project
                </button>
            </header>

            <div class="grid">
                ${filteredProjects.map(p => `
                    <div class="card" data-id="${p.id}">
                        <div class="card-title">${p.name}</div>
                        <div class="card-meta">${p.markers.length} markers • ${new Date(p.updatedAt).toLocaleDateString()}</div>
                        <button class="btn-danger btn-sm delete-project-btn" data-id="${p.id}" style="position:absolute; top:10px; right:10px; padding: 4px 8px; font-size: 10px; border-radius: 4px;">Delete</button>
                    </div>
                `).join('')}
                ${filteredProjects.length === 0 ? '<div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-secondary);">No projects found. Create one to get started!</div>' : ''}
            </div>
        </div>

        <div class="modal-overlay" id="new-project-modal">
            <div class="modal">
                <h2 style="margin-bottom: 1rem;">New Project</h2>
                <input type="text" id="project-name-input" class="search-input" placeholder="Project Name" style="margin-bottom: 1rem; padding-left: 1rem;">
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button class="btn" id="cancel-project-btn">Cancel</button>
                    <button class="btn btn-primary" id="create-project-btn">Create</button>
                </div>
            </div>
        </div>
    `;

    // Event Listeners for Dashboard
    app.querySelector('.search-input').addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderDashboard(); // Re-render only dashboard content if we want or just the grid
    });

    app.querySelector('#new-project-btn').addEventListener('click', () => {
        document.querySelector('#new-project-modal').classList.add('open');
    });

    app.querySelector('#cancel-project-btn').addEventListener('click', () => {
        document.querySelector('#new-project-modal').classList.remove('open');
    });

    app.querySelector('#create-project-btn').addEventListener('click', () => {
        const name = document.querySelector('#project-name-input').value.trim();
        if (name) {
            const newProject = {
                id: generateId(),
                name: name,
                image: null,
                markers: [],
                markerType: 'number',
                updatedAt: Date.now()
            };
            state.projects.push(newProject);
            Storage.saveProjects(state.projects);
            state.currentProject = newProject;
            state.view = 'workspace';
            renderApp();
        }
    });

    app.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-project-btn')) return;
            const id = card.dataset.id;
            state.currentProject = state.projects.find(p => p.id === id);
            state.view = 'workspace';
            renderApp();
        });
    });

    app.querySelectorAll('.delete-project-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this project?')) {
                const id = btn.dataset.id;
                state.projects = state.projects.filter(p => p.id !== id);
                Storage.deleteProject(id);
                renderDashboard();
            }
        });
    });
}

function renderWorkspace() {
    const project = state.currentProject;
    
    app.innerHTML = `
        <div class="workspace">
            <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <div style="display:flex; align-items:center; gap: 1rem;">
                    <button class="btn" id="back-btn">← Back</button>
                    <h1 class="title">${project.name}</h1>
                </div>
                <div style="display:flex; gap: 0.5rem; align-items: center;">
                    <span style="font-size: 0.75rem; color: var(--text-secondary); margin-right: 0.5rem;">Shift+Scroll: Zoom • Shift+Drag: Pan</span>
                    <button class="btn" id="reset-zoom-btn" title="Reset Zoom">⟲ Reset</button>
                    <select id="marker-type-select" class="search-input" style="width: auto; padding-left: 1rem;">
                        <option value="number" ${project.markerType === 'number' ? 'selected' : ''}>Numbers (1, 2, 3)</option>
                        <option value="letter" ${project.markerType === 'letter' ? 'selected' : ''}>Letters (A, B, C)</option>
                    </select>
                    <button class="btn btn-primary" id="upload-btn">Upload Image</button>
                    <input type="file" id="file-input" hidden accept="image/*">
                </div>
            </div>

            <div class="workspace-layout" style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
                <div class="image-area" id="image-container" style="position: relative; height: 70vh; cursor: crosshair; background: #111;">
                    <div class="image-canvas" id="image-canvas">
                        ${project.image ? `<img src="${project.image}" id="main-image" class="main-image">` : '<div style="color: white; opacity: 0.5;">Upload an image to start tagging</div>'}
                    </div>
                    <div class="marker-overlay" id="marker-overlay">
                        ${project.markers.map((m, idx) => `
                            <div class="marker ${state.selectedMarkerIdx == idx ? 'selected' : ''}" data-idx="${idx}" id="marker-${idx}">
                                ${m.label || idx + 1}
                                <div class="delete-btn" data-idx="${idx}">×</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="sidebar">
                    <div style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 80vh; overflow-y: auto; padding-right: 0.5rem;">
                        ${project.markers.map((m, idx) => {
                            const label = m.label || (idx + 1).toString();
                            return `
                                <div class="caption-item ${state.selectedMarkerIdx == idx ? 'active' : ''}" data-idx="${idx}">
                                    <div class="caption-label-chip">${label}</div>
                                    <div class="caption-content" style="flex: 1;">
                                        <div class="caption-title" style="color: ${m.title ? 'inherit' : 'var(--text-secondary)'}">${m.title || 'Add Title...'}</div>
                                    </div>
                                    <button class="delete-legend-btn" data-idx="${idx}">&times;</button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>

        <!-- Marker Editor Modal -->
        <div class="modal-overlay" id="marker-editor-modal">
            <div class="modal">
                <span class="modal-close" id="close-editor">&times;</span>
                <h2 id="editor-title" style="margin-bottom: 1.5rem; color: var(--amazon-dark);">Edit Marker</h2>
                
                <div class="form-group">
                    <label class="form-label">Title / Name</label>
                    <input type="text" id="edit-title" class="search-input" style="padding-left: 1rem;" placeholder="e.g. Main Entrance">
                </div>

                <div class="form-group">
                    <label class="form-label">Technical Identifier (Number/Letter)</label>
                    <input type="text" id="edit-label" class="search-input" style="padding-left: 1rem;">
                </div>

                <div class="form-group">
                    <label class="form-label">Detailed Description</label>
                    <textarea id="edit-description" class="form-textarea" placeholder="Describe this point in detail..."></textarea>
                </div>

                <div class="form-group">
                    <label class="form-label">Photo Gallery (<span id="img-count">0</span>)</label>
                    <div class="gallery-grid" id="gallery-grid">
                        <!-- Images will be injected here -->
                    </div>
                    <input type="file" id="marker-img-input" hidden accept="image/*" multiple>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;">
                    <button class="btn btn-danger" id="delete-marker-final">Delete Marker</button>
                    <button class="btn btn-primary" id="save-marker-details">Save Changes</button>
                </div>
            </div>
        </div>
    `;

    // References
    const imageContainer = app.querySelector('#image-container');
    const imageCanvas = app.querySelector('#image-canvas');
    const markerOverlay = app.querySelector('#marker-overlay');
    const img = app.querySelector('#main-image');

    // --- High Performance Markers Positioning ---
    const updateWorkspace = () => {
        if (!img) return;
        
        // Update Image Transform
        imageCanvas.style.transform = `translate(${state.zoom.x}px, ${state.zoom.y}px) scale(${state.zoom.scale})`;
        
        // Update Marker Positions in the non-scaled overlay
        const rect = img.getBoundingClientRect();
        const containerRect = imageContainer.getBoundingClientRect();
        
        project.markers.forEach((m, idx) => {
            const markerEl = app.querySelector(`#marker-${idx}`);
            if (markerEl) {
                const x = (m.x / 100) * rect.width + (rect.left - containerRect.left);
                const y = (m.y / 100) * rect.height + (rect.top - containerRect.top);
                markerEl.style.left = `${x}px`;
                markerEl.style.top = `${y}px`;
            }
        });
    };

    if (img) {
        if (img.complete) {
            requestAnimationFrame(updateWorkspace);
        } else {
            img.onload = () => requestAnimationFrame(updateWorkspace);
        }
    }

    // --- Interaction Logic ---
    const openMarkerEditor = (idx) => {
        const marker = project.markers[idx];
        const modal = app.querySelector('#marker-editor-modal');
        const titleInput = modal.querySelector('#edit-title');
        const labelInput = modal.querySelector('#edit-label');
        const descInput = modal.querySelector('#edit-description');
        const gallery = modal.querySelector('#gallery-grid');
        const imgCount = modal.querySelector('#img-count');

        state.selectedMarkerIdx = idx;
        titleInput.value = marker.title || '';
        labelInput.value = marker.label || (idx + 1).toString();
        descInput.value = marker.description || '';
        if (!marker.images) marker.images = [];
        imgCount.textContent = marker.images.length;

        // Render Gallery
        const renderGallery = () => {
            gallery.innerHTML = `
                ${marker.images.map((src, imgIdx) => `
                    <div class="gallery-item">
                        <img src="${src}">
                        <button class="remove-img" data-idx="${imgIdx}">&times;</button>
                    </div>
                `).join('')}
                <div class="add-image-box" id="add-marker-img">
                    <span style="font-size: 1.5rem;">+</span>
                    <span>Add Photo</span>
                </div>
            `;

            gallery.querySelector('#add-marker-img').onclick = () => {
                app.querySelector('#marker-img-input').click();
            };

            gallery.querySelectorAll('.remove-img').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    const imgIdx = parseInt(btn.dataset.idx);
                    marker.images.splice(imgIdx, 1);
                    imgCount.textContent = marker.images.length;
                    renderGallery();
                };
            });
        };

        renderGallery();
        modal.classList.add('open');

        // Modal Events
        modal.querySelector('#save-marker-details').onclick = () => {
            marker.title = titleInput.value;
            marker.label = labelInput.value;
            marker.description = descInput.value;
            reindexMarkers(project);
            project.updatedAt = Date.now();
            Storage.saveProject(project);
            modal.classList.remove('open');
            renderWorkspace();
        };

        modal.querySelector('#delete-marker-final').onclick = () => {
            if (confirm('Are you sure you want to delete this marker and all its photos?')) {
                project.markers.splice(idx, 1);
                reindexMarkers(project);
                project.updatedAt = Date.now();
                Storage.saveProject(project);
                modal.classList.remove('open');
                renderWorkspace();
            }
        };

        modal.querySelector('#close-editor').onclick = () => {
            modal.classList.remove('open');
        };
    };

    app.querySelector('#marker-img-input').addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        const marker = project.markers[state.selectedMarkerIdx];
        
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                marker.images.push(ev.target.result);
                // Trigger gallery re-render if modal is still open
                openMarkerEditor(state.selectedMarkerIdx);
            };
            reader.readAsDataURL(file);
        });
    });

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

            const newX = mouseX - (mouseX - state.zoom.x) * (clampedScale / state.zoom.scale);
            const newY = mouseY - (mouseY - state.zoom.y) * (clampedScale / state.zoom.scale);

            state.zoom.scale = clampedScale;
            state.zoom.x = newX;
            state.zoom.y = newY;
            updateWorkspace();
        }
    }, { passive: false });

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

    // --- Drag Marker Logic ---
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
            
            if (markerEl) markerEl.classList.add('dragging');
        };
        
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            
            if (state.dragState.isDragging) {
                if (markerEl) markerEl.classList.remove('dragging');
                project.updatedAt = Date.now();
                Storage.saveProject(project);
                
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

    // --- Global Event Delegation for Workspace ---
    imageContainer.onmousedown = (e) => {
        const markerEl = e.target.closest('.marker');
        if (markerEl && !e.target.closest('.delete-btn')) {
            const idx = parseInt(markerEl.dataset.idx);
            handleMarkerMouseDown(e, idx);
        }
    };

    imageContainer.onclick = (e) => {
        if (!project.image || !img) return;
        
        // 1. Delete Marker from Image
        const delBtn = e.target.closest('.marker .delete-btn');
        if (delBtn) {
            e.stopPropagation();
            deleteMarker(parseInt(delBtn.dataset.idx));
            return;
        }

        // 2. Open Editor from Marker
        const markerEl = e.target.closest('.marker');
        if (markerEl) {
            e.stopPropagation();
            // Important: don't open if we were just dragging
            if (!state.dragState.isDragging) {
                openMarkerEditor(parseInt(markerEl.dataset.idx));
            }
            return;
        }

        // 3. Add New Marker
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
            saveAndRenderWorkspace();
        }
    };

    app.querySelector('.sidebar').onclick = (e) => {
        // 1. Delete Marker from Legend
        const delLegendBtn = e.target.closest('.delete-legend-btn');
        if (delLegendBtn) {
            e.stopPropagation();
            console.log('Deleting from legend, idx:', delLegendBtn.dataset.idx);
            deleteMarker(parseInt(delLegendBtn.dataset.idx));
            return;
        }

        // 2. Open Editor from Legend Item
        const captionItem = e.target.closest('.caption-item');
        if (captionItem) {
            console.log('Opening editor from legend, idx:', captionItem.dataset.idx);
            openMarkerEditor(parseInt(captionItem.dataset.idx));
            return;
        }
    };

    // Hover effects delegation (using mouseover/out)
    app.querySelector('.sidebar').onmouseover = (e) => {
        const item = e.target.closest('.caption-item');
        if (item) {
            const marker = app.querySelector(`#marker-${item.dataset.idx}`);
            if (marker) marker.classList.add('selected');
        }
    };
    app.querySelector('.sidebar').onmouseout = (e) => {
        const item = e.target.closest('.caption-item');
        if (item) {
            const marker = app.querySelector(`#marker-${item.dataset.idx}`);
            if (marker) marker.classList.remove('selected');
        }
    };

    // Action buttons
    app.querySelector('#reset-zoom-btn').onclick = () => {
        state.zoom = { scale: 1, x: 0, y: 0 };
        updateWorkspace();
    };

    app.querySelector('#back-btn').onclick = () => {
        state.view = 'dashboard';
        state.captionSearchQuery = '';
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
                saveAndRenderWorkspace();
            };
            reader.readAsDataURL(file);
        }
    };

    app.querySelector('#marker-type-select').onchange = (e) => {
        project.markerType = e.target.value;
        saveAndRenderWorkspace();
    };
}

function deleteMarker(idx) {
    console.log('Requesting deletion of marker:', idx);
    if (confirm('Delete this marker?')) {
        state.currentProject.markers.splice(idx, 1);
        reindexMarkers(state.currentProject);
        state.currentProject.updatedAt = Date.now();
        console.log('Marker deleted, re-indexing and saving...');
        saveAndRenderWorkspace();
    }
}

function saveAndRenderWorkspace() {
    Storage.saveProject(state.currentProject);
    renderWorkspace();
}

// Initial Render
renderApp();
