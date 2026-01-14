export declare const supabase: import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>;
export type ProjectStatus = 'draft' | 'queued' | 'analyzing' | 'generating' | 'completed' | 'failed';
export interface Project {
    id: string;
    name: string;
    prompt: string;
    audio_url: string;
    footage_urls: string[];
    style: string;
    resolution: string;
    status: ProjectStatus;
    video_url: string | null;
    error: string | null;
    seed: string | null;
    analysis_data: Record<string, unknown> | null;
    created_at: string;
    completed_at: string | null;
    user_id: string;
    organization_id: string;
    effect_intensity: number;
    footage_visibility: number;
}
export declare function updateProjectStatus(projectId: string, status: ProjectStatus, extra?: Partial<Project>): Promise<void>;
export declare function getProject(projectId: string): Promise<Project | null>;
//# sourceMappingURL=supabase.d.ts.map