import './style.css';
import { state } from './state';
import { Storage } from './storage';
import { initWorkspace, syncWorkspace } from './components/workspace';
import { initHelp } from './components/help';

const workspaceView = document.querySelector('#workspace-view');
const appContainer = document.querySelector('#app');

function renderApp() {
    workspaceView.classList.remove('hidden');
    appContainer.classList.add('workspace-mode');
    syncWorkspace(state, renderApp);
}

// Load project from URL
const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get('id');

if (projectId) {
    const project = Storage.getProject(projectId);
    if (project) {
        state.currentProject = project;
        state.view = 'workspace';
        
        // Initialize components
        initWorkspace(state, renderApp);
        initHelp();

        // Initial render
        renderApp();
    } else {
        // Project not found, redirect to dashboard
        window.location.href = '/';
    }
} else {
    // No ID provided, redirect to dashboard
    window.location.href = '/';
}

export { renderApp };
