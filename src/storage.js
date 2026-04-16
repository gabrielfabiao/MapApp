const STORAGE_KEY = 'image_captioner_projects';

export const Storage = {
    loadProjects() {
        const data = localStorage.getItem(STORAGE_KEY);
        try {
            return data ? JSON.parse(data) : [];
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
    }
};
