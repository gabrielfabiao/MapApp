const STORAGE_KEY = 'image_captioner_projects';

export const Storage = {
    loadProjects() {
        const data = localStorage.getItem(STORAGE_KEY);
        try {
            const parsed = data ? JSON.parse(data) : [];
            return parsed.map(p => ({
                ...p,
                buildings: p.buildings || [],
                trees: p.trees || [],
                pixelsPerUnit: p.pixelsPerUnit || 10,
                location: p.location || { lat: 51.5, lng: -0.1 },
                northBearing: p.northBearing || 0
            }));
        } catch (e) {
            console.error('Failed to parse projects from storage', e);
            return [];
        }
    },

    saveProjects(projects) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    },

    getProject(id) {
        const projects = this.loadProjects();
        return projects.find(p => p.id === id);
    },

    saveProject(project) {
        const projects = this.loadProjects();
        const index = projects.findIndex(p => p.id === project.id);
        if (index !== -1) {
            projects[index] = project;
        } else {
            projects.push(project);
        }
        this.saveProjects(projects);
    },

    deleteProject(id) {
        let projects = this.loadProjects();
        projects = projects.filter(p => p.id !== id);
        this.saveProjects(projects);
    },

    loadSettings() {
        const data = localStorage.getItem('image_captioner_settings');
        try {
            return data ? JSON.parse(data) : { plantApiKey: '' };
        } catch (e) {
            return { plantApiKey: '' };
        }
    },

    saveSettings(settings) {
        localStorage.setItem('image_captioner_settings', JSON.stringify(settings));
    }
};
