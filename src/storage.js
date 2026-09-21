import { supabase } from './lib/supabase/browser';
import { fromDbRow, toDbRow } from './lib/projectMapper';

const SAVE_DEBOUNCE_MS = 600;

// Each save is a full-row upsert, so rapid edits (slider drags, marker drags)
// only need the last payload to land. Pending writes are keyed by project id
// and flushed when the tab is hidden so nothing is lost on navigation.
const pendingSaves = new Map();

function writeProject(project, userId) {
    return supabase.from('projects').upsert(toDbRow(project, userId));
}

function flushProject(id) {
    const pending = pendingSaves.get(id);
    if (!pending) return Promise.resolve();
    clearTimeout(pending.timer);
    pendingSaves.delete(id);
    return writeProject(pending.project, pending.userId).then(({ error }) => {
        if (error) throw error;
    });
}

export function flushPendingSaves() {
    return Promise.all([...pendingSaves.keys()].map(flushProject));
}

if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flushPendingSaves().catch(console.error);
    });
}

export const Storage = {
    async loadProjects() {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('updated_at', { ascending: false });
        if (error) throw error;
        return data.map(fromDbRow);
    },

    saveProject(project, userId) {
        const existing = pendingSaves.get(project.id);
        if (existing) clearTimeout(existing.timer);
        const timer = setTimeout(() => flushProject(project.id).catch(console.error), SAVE_DEBOUNCE_MS);
        pendingSaves.set(project.id, { project, userId, timer });
        return Promise.resolve();
    },

    async deleteProject(id) {
        const pending = pendingSaves.get(id);
        if (pending) {
            clearTimeout(pending.timer);
            pendingSaves.delete(id);
        }
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) throw error;
    },

    async loadSettings() {
        const { data, error } = await supabase.from('user_settings').select('*').maybeSingle();
        if (error) throw error;
        return { plantApiKey: data?.plant_api_key || '' };
    },

    async saveSettings(settings, userId) {
        const { error } = await supabase.from('user_settings').upsert({
            user_id: userId,
            plant_api_key: settings.plantApiKey,
            updated_at: new Date().toISOString(),
        });
        if (error) throw error;
    },
};
