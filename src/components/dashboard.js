import { Storage } from '../storage';
import { generateId } from '../state';

export function renderDashboard(app, state, renderApp) {
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
                        <div class="card-meta">${p.markers.length} markers &bull; ${new Date(p.updatedAt).toLocaleDateString()}</div>
                        <div class="card-actions">
                            <button class="card-action-btn rename-project-btn" data-id="${p.id}" title="Rename project">&#9998;</button>
                            <button class="card-action-btn delete-project-btn" data-id="${p.id}" title="Delete project">&#10005;</button>
                        </div>
                    </div>
                `).join('')}
                ${filteredProjects.length === 0 ? '<div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-secondary);">No projects found. Create one to get started!</div>' : ''}
            </div>
        </div>

        <!-- New Project Modal -->
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

        <!-- Rename Project Modal -->
        <div class="modal-overlay" id="rename-project-modal">
            <div class="modal">
                <h2 style="margin-bottom: 1rem;">Rename Project</h2>
                <input type="text" id="rename-project-input" class="search-input" placeholder="Project Name" style="margin-bottom: 1rem; padding-left: 1rem;">
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button class="btn" id="cancel-rename-btn">Cancel</button>
                    <button class="btn btn-primary" id="confirm-rename-btn">Save</button>
                </div>
            </div>
        </div>
    `;

    // --- Search ---
    app.querySelector('.search-input').addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderDashboard(app, state, renderApp);
    });

    // --- New Project ---
    const newModal = app.querySelector('#new-project-modal');
    app.querySelector('#new-project-btn').addEventListener('click', () => {
        app.querySelector('#project-name-input').value = '';
        newModal.classList.add('open');
        setTimeout(() => app.querySelector('#project-name-input').focus(), 50);
    });
    app.querySelector('#cancel-project-btn').addEventListener('click', () => {
        newModal.classList.remove('open');
    });
    app.querySelector('#create-project-btn').addEventListener('click', () => {
        const name = app.querySelector('#project-name-input').value.trim();
        if (name) {
            const newProject = {
                id: generateId(),
                name,
                image: null,
                markers: [],
                markerType: 'number',
                buildings: [],
                pixelsPerUnit: 10,
                location: { lat: 51.5, lng: -0.1 }, // Standard default (London)
                northBearing: 0,
                updatedAt: Date.now()
            };
            state.projects.push(newProject);
            Storage.saveProjects(state.projects);
            state.currentProject = newProject;
            state.view = 'workspace';
            renderApp();
        }
    });
    app.querySelector('#project-name-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') app.querySelector('#create-project-btn').click();
        if (e.key === 'Escape') newModal.classList.remove('open');
    });

    // --- Open Project ---
    app.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.card-action-btn')) return;
            const id = card.dataset.id;
            state.currentProject = state.projects.find(p => p.id === id);
            state.view = 'workspace';
            renderApp();
        });
    });

    // --- Rename Project ---
    const renameModal = app.querySelector('#rename-project-modal');
    const renameInput = app.querySelector('#rename-project-input');
    let renameTargetId = null;

    app.querySelectorAll('.rename-project-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            renameTargetId = btn.dataset.id;
            const project = state.projects.find(p => p.id === renameTargetId);
            renameInput.value = project.name;
            renameModal.classList.add('open');
            setTimeout(() => { renameInput.focus(); renameInput.select(); }, 50);
        });
    });

    const doRename = () => {
        const name = renameInput.value.trim();
        if (name && renameTargetId) {
            const project = state.projects.find(p => p.id === renameTargetId);
            project.name = name;
            project.updatedAt = Date.now();
            Storage.saveProject(project);
            renameModal.classList.remove('open');
            renderDashboard(app, state, renderApp);
        }
    };

    app.querySelector('#confirm-rename-btn').addEventListener('click', doRename);
    app.querySelector('#cancel-rename-btn').addEventListener('click', () => renameModal.classList.remove('open'));
    renameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doRename();
        if (e.key === 'Escape') renameModal.classList.remove('open');
    });

    // --- Delete Project ---
    app.querySelectorAll('.delete-project-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this project?')) {
                const id = btn.dataset.id;
                state.projects = state.projects.filter(p => p.id !== id);
                Storage.deleteProject(id);
                renderDashboard(app, state, renderApp);
            }
        });
    });
}
