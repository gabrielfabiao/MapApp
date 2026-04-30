import { Storage } from '../storage';
import { generateId } from '../state';
import { showConfirm } from './deletionmodal';

export function initDashboard(state, renderApp) {
    const dashboardView = document.querySelector('#dashboard-view');
    const newModal = dashboardView.querySelector('#new-project-modal');
    const renameModal = dashboardView.querySelector('#rename-project-modal');
    const projectNameInput = dashboardView.querySelector('#project-name-input');
    const renameProjectInput = dashboardView.querySelector('#rename-project-input');

    // --- Search ---
    dashboardView.querySelector('#dashboard-search').addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        syncDashboard(state, renderApp);
    });

    // --- New Project ---
    dashboardView.querySelector('#new-project-btn').addEventListener('click', () => {
        projectNameInput.value = '';
        newModal.classList.add('open');
        setTimeout(() => projectNameInput.focus(), 50);
    });

    dashboardView.querySelector('#cancel-project-btn').addEventListener('click', () => {
        newModal.classList.remove('open');
    });

    dashboardView.querySelector('#create-project-btn').addEventListener('click', () => {
        const name = projectNameInput.value.trim();
        if (name) {
            const newProject = {
                id: generateId(),
                name,
                image: null,
                markers: [],
                markerType: 'number',
                buildings: [],
                pixelsPerUnit: 10,
                location: { lat: 51.5, lng: -0.1 },
                northBearing: 0,
                updatedAt: Date.now()
            };
            state.projects.push(newProject);
            Storage.saveProjects(state.projects);
            state.currentProject = newProject;
            newModal.classList.remove('open');
            window.location.href = 'workspace.html?id=' + newProject.id;
        }
    });

    projectNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') dashboardView.querySelector('#create-project-btn').click();
        if (e.key === 'Escape') newModal.classList.remove('open');
    });

    // --- Rename Project ---
    let renameTargetId = null;

    const doRename = () => {
        const name = renameProjectInput.value.trim();
        if (name && renameTargetId) {
            const project = state.projects.find(p => p.id === renameTargetId);
            project.name = name;
            project.updatedAt = Date.now();
            Storage.saveProject(project);
            renameModal.classList.remove('open');
            syncDashboard(state, renderApp);
        }
    };

    dashboardView.querySelector('#confirm-rename-btn').addEventListener('click', doRename);
    dashboardView.querySelector('#cancel-rename-btn').addEventListener('click', () => renameModal.classList.remove('open'));
    renameProjectInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doRename();
        if (e.key === 'Escape') renameModal.classList.remove('open');
    });

    // --- Event Delegation for Project Grid (Open, Rename, Delete) ---
    dashboardView.querySelector('#project-grid').addEventListener('click', (e) => {
        const card = e.target.closest('.card');
        if (!card) return;

        const id = card.dataset.id;
        
        // Rename Click
        const renameBtn = e.target.closest('.rename-project-btn');
        if (renameBtn) {
            e.stopPropagation();
            renameTargetId = id;
            const project = state.projects.find(p => p.id === id);
            renameProjectInput.value = project.name;
            renameModal.classList.add('open');
            setTimeout(() => { renameProjectInput.focus(); renameProjectInput.select(); }, 50);
            return;
        }

        // Delete Click
        const deleteBtn = e.target.closest('.delete-project-btn');
        if (deleteBtn) {
            e.stopPropagation();
            showConfirm('Delete Project', 'Are you sure you want to delete this project? This cannot be undone.', () => {
                state.projects = state.projects.filter(p => p.id !== id);
                Storage.deleteProject(id);
                syncDashboard(state, renderApp);
            });
            return;
        }

        // Open Project
        window.location.href = 'workspace.html?id=' + id;
    });
}

/**
 * Syncs the project grid with current state (filtered projects)
 */
export function syncDashboard(state) {
    const grid = document.querySelector('#project-grid');
    if (!grid) return;

    const filteredProjects = state.projects.filter(p =>
        p.name.toLowerCase().includes(state.searchQuery.toLowerCase())
    );

    grid.innerHTML = filteredProjects.map(p => `
        <div class="card" data-id="${p.id}">
            <div class="card-title">${p.name}</div>
            <div class="card-meta">${p.markers.length} markers &bull; ${new Date(p.updatedAt).toLocaleDateString()}</div>
            <div class="card-actions">
                <button class="card-action-btn rename-project-btn" data-id="${p.id}" title="Rename project">&#9998;</button>
                <button class="card-action-btn delete-project-btn" data-id="${p.id}" title="Delete project">&#10005;</button>
            </div>
        </div>
    `).join('') || `
        <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-secondary);">
            No projects found. Create one to get started!
        </div>
    `;
}
