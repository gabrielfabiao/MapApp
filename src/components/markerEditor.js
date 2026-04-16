import { Storage } from '../storage';
import { reindexMarkers } from '../state';

export function openMarkerEditor(idx, app, state, project, renderWorkspace, renderApp) {
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

    // --- Tree Settings Initialization ---
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

    // --- Modal Event Handlers ---
    modal.querySelector('#save-marker-details').onclick = () => {
        marker.title = titleInput.value;
        marker.label = labelInput.value;
        marker.description = descInput.value;
        
        // Save tree fields
        marker.isTree = isTreeCheckbox.checked;
        marker.treeHeight = parseFloat(treeHeightInput.value) || 15;
        marker.treeCanopy = parseFloat(treeCanopyInput.value) || 8;

        reindexMarkers(project);
        project.updatedAt = Date.now();
        Storage.saveProject(project);
        modal.classList.remove('open');
        renderWorkspace(app, state, renderApp);
    };

    modal.querySelector('#delete-marker-final').onclick = () => {
        if (confirm('Are you sure you want to delete this marker and all its photos?')) {
            project.markers.splice(idx, 1);
            reindexMarkers(project);
            project.updatedAt = Date.now();
            Storage.saveProject(project);
            modal.classList.remove('open');
            renderWorkspace(app, state, renderApp);
        }
    };

    modal.querySelector('#close-editor').onclick = () => {
        modal.classList.remove('open');
    };

    // Image upload handler — re-attach each time modal opens so it uses the current marker/idx
    const imgInput = app.querySelector('#marker-img-input');
    // Clone to remove previous listener
    const newImgInput = imgInput.cloneNode(true);
    imgInput.parentNode.replaceChild(newImgInput, imgInput);

    newImgInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                marker.images.push(ev.target.result);
                openMarkerEditor(state.selectedMarkerIdx, app, state, project, renderWorkspace, renderApp);
            };
            reader.readAsDataURL(file);
        });
    });
}
