import './style.css';
import { state } from './state';
import { initDashboard, syncDashboard } from './components/dashboard';
import { initHelp } from './components/help';

const dashboardView = document.querySelector('#dashboard-view');
const appContainer = document.querySelector('#app');

function renderApp() {
    dashboardView.classList.remove('hidden');
    appContainer.classList.remove('workspace-mode');
    syncDashboard(state, renderApp);
}

// Initialize components
initDashboard(state, renderApp);
initHelp();

// Initial render
renderApp();

export { renderApp };
