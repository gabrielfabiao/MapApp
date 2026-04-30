import { Storage } from '../storage';
import { reindexMarkers } from '../state';
import { PlantIdService } from '../services/plantIdService';
import { showConfirm } from './deletionmodal';

/**
 * Populates and opens the static marker editor modal.
 */
export function openMarkerEditor(idx, state, project, renderApp) {
    const marker = project.markers[idx];
    const modal = document.querySelector('#marker-editor-modal');
    const titleInput = modal.querySelector('#edit-title');
    const labelInput = modal.querySelector('#edit-label');
    const descInput = modal.querySelector('#edit-description');
    const gallery = modal.querySelector('#gallery-grid');
    const imgCount = modal.querySelector('#img-count');
    const imgInput = document.querySelector('#marker-img-input');
    const identifyBtn = modal.querySelector('#identify-plant-btn');

    state.selectedMarkerIdx = idx;
    
    // Fill data
    titleInput.value = marker.title || '';
    labelInput.value = marker.label || (idx + 1).toString();
    descInput.value = marker.description || '';
    const sciNameContainer = modal.querySelector('#sci-name-container');
    let currentSciName = marker.scientificName || '';

    const renderSciName = () => {
        if (currentSciName) {
            sciNameContainer.innerHTML = `
                <div class="caption-label-chip" style="display:flex; align-items:center; gap:0.5rem; background: var(--amazon-light); margin:0;">
                    <span style="font-style: italic;">${currentSciName}</span>
                    <button id="remove-sci-name" style="background:none; border:none; cursor:pointer; font-weight:bold; color:var(--amazon-dark);">&times;</button>
                </div>
            `;
            sciNameContainer.querySelector('#remove-sci-name').onclick = (e) => {
                e.preventDefault();
                currentSciName = '';
                renderSciName();
            };
        } else {
            sciNameContainer.innerHTML = `
                <input type="text" id="manual-sci-name" class="search-input" style="flex:1; padding-left:0.5rem;" placeholder="e.g. Quercus robur">
                <button class="btn btn-sm" id="add-sci-name">Add</button>
            `;
            sciNameContainer.querySelector('#add-sci-name').onclick = (e) => {
                e.preventDefault();
                const val = sciNameContainer.querySelector('#manual-sci-name').value.trim();
                if (val) {
                    currentSciName = val;
                    renderSciName();
                }
            };
        }
    };
    renderSciName();

    if (!marker.images) marker.images = [];
    imgCount.textContent = marker.images.length;

    // Tree settings
    const isTreeCheckbox = modal.querySelector('#edit-is-tree');
    const treeFields = modal.querySelector('#tree-settings-fields');
    const treeHeightInput = modal.querySelector('#edit-tree-height');
    const treeCanopyInput = modal.querySelector('#edit-tree-canopy');

    isTreeCheckbox.checked = !!marker.isTree;
    treeHeightInput.value = marker.treeHeight || 15;
    treeCanopyInput.value = marker.treeCanopy || 8;
    treeFields.style.display = marker.isTree ? 'grid' : 'none';

    isTreeCheckbox.onchange = (e) => {
        treeFields.style.display = e.target.checked ? 'grid' : 'none';
    };

    // --- Gallery ---
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

        identifyBtn.style.display = marker.images.length > 0 ? 'inline-block' : 'none';

        gallery.querySelector('#add-marker-img').onclick = () => imgInput.click();

        gallery.querySelectorAll('.remove-img').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                marker.images.splice(parseInt(btn.dataset.idx), 1);
                imgCount.textContent = marker.images.length;
                renderGallery();
            };
        });
    };

    renderGallery();
    modal.classList.add('open');

    // --- Modal Actions ---
    modal.querySelector('#save-marker-details').onclick = () => {
        marker.title = titleInput.value;
        marker.label = labelInput.value;
        marker.scientificName = currentSciName;
        marker.description = descInput.value;
        marker.isTree = isTreeCheckbox.checked;
        marker.treeHeight = parseFloat(treeHeightInput.value) || 15;
        marker.treeCanopy = parseFloat(treeCanopyInput.value) || 8;

        reindexMarkers(project);
        project.updatedAt = Date.now();
        Storage.saveProject(project);
        modal.classList.remove('open');
        renderApp();
    };

    modal.querySelector('#delete-marker-final').onclick = () => {
        showConfirm('Delete Marker', 'Are you sure you want to delete this marker?', () => {
            project.markers.splice(idx, 1);
            reindexMarkers(project);
            state.selectedMarkerIdx = null; // Clear selection
            project.updatedAt = Date.now();
            Storage.saveProject(project);
            modal.classList.remove('open');
            renderApp();
        });
    };

    modal.querySelector('#close-editor').onclick = () => {
        modal.classList.remove('open');
    };

    // --- AI Identification ---
    identifyBtn.onclick = async () => {
        if (marker.images.length === 0) return;
        
        try {
            identifyBtn.disabled = true;
            identifyBtn.textContent = '🔍 Identifying...';
            
            const results = await PlantIdService.identify(marker.images, state.settings.plantApiKey);
            const bestMatch = PlantIdService.getBestMatch(results);
            
            if (bestMatch) {
                if (bestMatch.commonName) {
                    titleInput.value = bestMatch.commonName.split(',')[0].trim();
                     // Capitalize first letter
                    titleInput.value = titleInput.value.charAt(0).toUpperCase() + titleInput.value.slice(1);
                } else {
                    titleInput.value = bestMatch.scientificName;
                }
                
                currentSciName = bestMatch.scientificName;
                renderSciName();
                
                const sciInfo = `Botanical Name: ${bestMatch.scientificName}\nConfidence: ${(bestMatch.score * 100).toFixed(1)}%`;
                if (!descInput.value.includes(bestMatch.scientificName)) {
                    descInput.value = sciInfo + (descInput.value ? '\n\n' + descInput.value : '');
                }
                
                alert(`Identified as ${titleInput.value}!`);
            } else {
                alert("Could not identify this plant. Try a clearer photo.");
            }
        } catch (err) {
            console.error(err);
            alert(err.message || "Identification failed.");
        } finally {
            identifyBtn.disabled = false;
            identifyBtn.textContent = '✨ Identify Plant';
        }
    };

    // Image Upload (one-time logic for this specific open session)
    imgInput.onchange = (e) => {
        const files = Array.from(e.target.files);
        let loaded = 0;
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                marker.images.push(ev.target.result);
                loaded++;
                if (loaded === files.length) {
                    imgCount.textContent = marker.images.length;
                    renderGallery();
                }
            };
            reader.readAsDataURL(file);
        });
        e.target.value = ''; // Reset for next selection
    };
}
