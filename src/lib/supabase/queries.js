import 'server-only';
import { fromDbRow } from '../projectMapper';

export async function loadProjectsServer(supabase) {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });
    if (error) throw error;
    return data.map(fromDbRow);
}

export async function loadSettingsServer(supabase) {
    const { data, error } = await supabase.from('user_settings').select('*').maybeSingle();
    if (error) throw error;
    return { plantApiKey: data?.plant_api_key || '' };
}
