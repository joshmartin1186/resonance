import { createClient } from '@supabase/supabase-js';
if (!process.env.SUPABASE_URL) {
    throw new Error('SUPABASE_URL is required');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}
export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});
export async function updateProjectStatus(projectId, status, extra) {
    const { error } = await supabase
        .from('projects')
        .update({
        status,
        ...extra,
        ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {})
    })
        .eq('id', projectId);
    if (error) {
        console.error('Failed to update project status:', error);
        throw error;
    }
}
export async function getProject(projectId) {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
    if (error) {
        console.error('Failed to get project:', error);
        return null;
    }
    return data;
}
//# sourceMappingURL=supabase.js.map