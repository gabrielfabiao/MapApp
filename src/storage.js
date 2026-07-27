import { supabase } from './lib/supabaseClient';

function fromDbRow(row) {
    return {
        id: row.id,
        name: row.name,
        image: row.image,
        markerType: row.marker_type,
        markers: row.markers || [],
        buildings: row.buildings || [],
        trees: [],
        pixelsPerUnit: row.pixels_per_unit,
        location: row.location,
        northBearing: row.north_bearing,
        updatedAt: new Date(row.updated_at).getTime(),
    };
}

function toDbRow(project, userId) {
    return {
        id: project.id,
        user_id: userId,
        name: project.name,
        image: project.image,
        marker_type: project.markerType,
        markers: project.markers,
        buildings: project.buildings,
        pixels_per_unit: project.pixelsPerUnit,
        location: project.location,
        north_bearing: project.northBearing,
        updated_at: new Date(project.updatedAt).toISOString(),
    };
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

    async getProject(id) {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error) throw error;
        return data ? fromDbRow(data) : null;
    },

    async saveProject(project, userId) {
        const { error } = await supabase.from('projects').upsert(toDbRow(project, userId));
        if (error) throw error;
    },

    async deleteProject(id) {
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
