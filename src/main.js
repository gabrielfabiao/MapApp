import './style.css';
import { state } from './state';
import { initDashboard, syncDashboard } from './components/dashboard';
import { initWorkspace, syncWorkspace } from './components/workspace';
import { initHelp } from './components/help';

const dashboardView = document.querySelector('#dashboard-view');
const workspaceView = document.querySelector('#workspace-view');
const appContainer = document.querySelector('#app');

// Initialize components once on core load
initDashboard(state, renderApp);
initWorkspace(state, renderApp);
initHelp();

function renderApp() {
    if (state.view === 'dashboard') {
        dashboardView.classList.remove('hidden');
        workspaceView.classList.add('hidden');
        appContainer.classList.remove('workspace-mode');
        syncDashboard(state, renderApp);
    } else {
        dashboardView.classList.add('hidden');
        workspaceView.classList.remove('hidden');
        appContainer.classList.add('workspace-mode');
        syncWorkspace(state, renderApp);
    }
}

// Initial render
renderApp();

export { renderApp };
