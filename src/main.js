import './style.css';
import { state } from './state';
import { renderDashboard } from './components/dashboard';
import { renderWorkspace } from './components/workspace';

const app = document.querySelector('#app');

function renderApp() {
    app.innerHTML = '';
    if (state.view === 'dashboard') {
        renderDashboard(app, state, renderApp);
    } else {
        renderWorkspace(app, state, renderApp);
    }
}

renderApp();
