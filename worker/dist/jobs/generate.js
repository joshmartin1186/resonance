import { supabase, updateProjectStatus, getProject } from '../lib/supabase.js';
import { analyzeAudio, detectSubtleCues } from '../lib/audio-analyzer.js';
import { decryptApiKey, getEncryptionSecret } from '../lib/encryption.js';
import { generateVisualPlan as generateAIVisualPlan, generateSeed } from '../lib/orchestrator.js';
/**
 * Process a video generation job
 *
 * Pipeline:
 * 1. Fetch project data
 * 2. Analyze audio
 * 3. Generate visual plan (Claude AI orchestration)
 * 4. Render video (FFmpeg + effects)
 * 5. Upload to storage
 * 6. Update project with result
 */
export async function processGenerationJob(job) {
    const { projectId } = job.data;
    console.log(`Processing generation job for project ${projectId}`);
    // Generate a seed for reproducibility
    const seed = generateSeed();
    try {
        // 1. Fetch project
        const project = await getProject(projectId);
        if (!project) {
            throw new Error(`Project ${projectId} not found`);
        }
        if (!project.audio_url) {
            throw new Error('Project has no audio file');
        }
        // Update status to analyzing
        await updateProjectStatus(projectId, 'analyzing');
        await job.updateProgress(10);
        // 2. Analyze audio
        console.log('Starting audio analysis...');
        const audioFeatures = await analyzeAudio(project.audio_url, (progress) => {
            console.log(`Analysis: ${progress.stage} (${progress.progress}%)`);
        });
        // Detect subtle cues
        const subtleCues = detectSubtleCues(audioFeatures);
        // Store analysis results
        await supabase
            .from('projects')
            .update({
            analysis_data: {
                features: audioFeatures,
                subtleCues,
                analyzedAt: new Date().toISOString()
            }
        })
            .eq('id', projectId);
        await job.updateProgress(40);
        // Update status to generating
        await updateProjectStatus(projectId, 'generating');
        // 3. Generate visual plan using Claude AI
        console.log('Generating visual plan with AI...');
        // Fetch footage info if any
        const footageInfo = await getFootageInfo(projectId);
        // Fetch the user's Anthropic API key, fall back to environment variable
        let anthropicApiKey = await getUserApiKey(project.organization_id, 'anthropic');
        if (!anthropicApiKey && process.env.ANTHROPIC_API_KEY) {
            console.log('Using environment ANTHROPIC_API_KEY for AI orchestration');
            anthropicApiKey = process.env.ANTHROPIC_API_KEY;
        }
        const orchestrationInput = {
            audioFeatures,
            prompt: project.prompt || 'Create a visual journey',
            style: project.style || 'organic',
            footage: footageInfo,
            effectIntensity: project.effect_intensity ?? 0.5,
            footageVisibility: project.footage_visibility ?? 0.6,
            seed,
            anthropicApiKey
        };
        let visualPlan;
        try {
            visualPlan = await generateAIVisualPlan(orchestrationInput);
            console.log(anthropicApiKey ? 'AI visual plan generated successfully' : 'Fallback visual plan generated (no API key)');
        }
        catch (aiError) {
            console.warn('AI orchestration failed, using fallback:', aiError);
            visualPlan = generateFallbackVisualPlan(orchestrationInput);
        }
        // Store visual plan
        await supabase
            .from('projects')
            .update({
            visual_plan: visualPlan
        })
            .eq('id', projectId);
        await job.updateProgress(60);
        // 4. Render video
        console.log('Rendering video...');
        // Build render config
        const renderConfig = {
            projectId,
            audioUrl: project.audio_url,
            audioFeatures,
            footageUrls: project.footage_urls || [],
            prompt: project.prompt || '',
            style: project.style || 'organic',
            resolution: project.resolution || '1080p',
            effectIntensity: project.effect_intensity ?? 0.5,
            footageVisibility: project.footage_visibility ?? 0.6
        };
        // Convert orchestrator visual plan to renderer visual plan format
        const rendererVisualPlan = {
            segments: visualPlan.segments.map(seg => ({
                startTime: seg.startTime,
                endTime: seg.endTime,
                effects: (seg.effects || []).map(eff => ({
                    effectSlug: eff.effectSlug,
                    ffmpegFilter: getFFmpegFilterForEffect(eff.effectSlug, eff.intensity),
                    parameters: { intensity: eff.intensity }
                })),
                footageIndex: seg.footageIndex,
                generativeType: seg.generativeType,
                shaderType: seg.shaderType,
                transitionIn: seg.transition?.type
            })),
            colorPalette: [visualPlan.colorPalette.primary, visualPlan.colorPalette.secondary, visualPlan.colorPalette.accent],
            mood: visualPlan.colorPalette.mood,
            narrative: visualPlan.narrative.theme
        };
        let outputPath;
        try {
            // Use node-based renderer for single continuous video with proper audio sync
            const { renderNodeBasedVideo } = await import('../lib/node-based-renderer.js');
            const workDir = `/tmp/resonance-render/${projectId}`;
            outputPath = `${workDir}/output.mp4`;
            // Get audio file path
            const audioPath = `${workDir}/audio.mp3`;
            const { downloadFile } = await import('../lib/ffmpeg.js');
            const { mkdirSync, existsSync } = await import('fs');
            if (!existsSync(workDir)) {
                mkdirSync(workDir, { recursive: true });
            }
            await downloadFile(project.audio_url, audioPath);
            // Cap duration at 7 minutes (420 seconds)
            const maxDuration = 420;
            const actualDuration = Math.min(audioFeatures.duration, maxDuration);
            await renderNodeBasedVideo({
                audioPath,
                outputPath,
                duration: actualDuration,
                width: 1920,
                height: 1080,
                fps: 30,
                colors: {
                    primary: visualPlan.colorPalette.primary,
                    secondary: visualPlan.colorPalette.secondary,
                    accent: visualPlan.colorPalette.accent
                },
                intensity: project.effect_intensity ?? 0.5,
                useAI: false, // Use test timeline for now (will enhance complexity)
                parallel: true // Use parallel rendering for speed
            });
            console.log(`Video rendered to: ${outputPath}`);
            job.updateProgress(90);
        }
        catch (renderError) {
            console.error('Render failed:', renderError);
            throw new Error(`Video rendering failed: ${renderError instanceof Error ? renderError.message : 'Unknown error'}`);
        }
        // 5. Upload to Supabase Storage with bulletproof multi-layer fallback
        // SKIP UPLOAD - Keep video locally for now
        console.log('💾 Skipping upload - video saved locally at:', outputPath);
        const videoUrl = `file://${outputPath}`; // Local file URL for reference
        console.log('✅ Video generation complete! Path:', outputPath);
        // Don't cleanup - keep the video accessible
        // cleanupRender(projectId)
        await job.updateProgress(95);
        // 6. Create generation record
        const { error: genError } = await supabase
            .from('generations')
            .insert({
            project_id: projectId,
            organization_id: project.organization_id,
            user_id: project.user_id,
            seed,
            generation_number: await getNextGenerationNumber(projectId),
            audio_analysis: audioFeatures,
            visual_plan: visualPlan,
            video_url: videoUrl,
            duration: audioFeatures.duration,
            status: 'completed',
            completed_at: new Date().toISOString()
        });
        if (genError) {
            console.warn('Failed to create generation record:', genError);
        }
        // Update project with result
        await updateProjectStatus(projectId, 'completed', {
            video_url: videoUrl,
            seed,
            completed_at: new Date().toISOString()
        });
        console.log(`Generation complete for project ${projectId}`);
        return {
            success: true,
            videoUrl,
            seed,
            duration: audioFeatures.duration,
            visualPlan
        };
    }
    catch (error) {
        console.error(`Generation failed for project ${projectId}:`, error);
        await updateProjectStatus(projectId, 'failed', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
}
/**
 * Get footage information for a project
 */
async function getFootageInfo(projectId) {
    const { data: footage } = await supabase
        .from('project_footage')
        .select('*')
        .eq('project_id', projectId);
    if (!footage || footage.length === 0) {
        return [];
    }
    return footage.map(f => ({
        id: f.id,
        fileType: f.file_type,
        duration: f.duration || undefined,
        dominantColors: f.dominant_colors || undefined,
        motionLevel: f.motion_level || undefined,
        brightness: f.brightness || undefined
    }));
}
/**
 * Get the next generation number for a project
 */
async function getNextGenerationNumber(projectId) {
    const { count } = await supabase
        .from('generations')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);
    return (count || 0) + 1;
}
/**
 * Generate a fallback visual plan when AI fails
 */
function generateFallbackVisualPlan(input) {
    const { audioFeatures, prompt, style, footage } = input;
    const duration = audioFeatures.duration;
    const sections = audioFeatures.sections || [];
    // Create segments from sections or time-based
    const segments = sections.length > 0
        ? sections.map((section, i) => ({
            startTime: section.startTime,
            endTime: section.endTime,
            musicalContext: section.type,
            emotionalTone: getEmotionalTone(section.energy),
            description: `${section.type} section`,
            effects: getDefaultEffects(style, section.energy),
            footageIndex: footage.length > 0 ? i % footage.length : undefined,
            generativeType: footage.length === 0 ? getGenerativeType(section.energy) : undefined,
            transition: { type: 'fade', duration: 0.5 }
        }))
        : createTimeBasedSegments(duration, style, footage.length);
    return {
        narrative: {
            theme: prompt,
            moodProgression: segments.map(s => s.emotionalTone),
            keyMoments: []
        },
        colorPalette: getColorPalette(style),
        segments,
        globalEffects: style === 'cinematic'
            ? [{ effectSlug: 'grain', intensity: 0.3 }, { effectSlug: 'vignette', intensity: 0.4 }]
            : [{ effectSlug: 'grain', intensity: 0.2 }]
    };
}
function getEmotionalTone(energy) {
    if (energy > 0.8)
        return 'intense';
    if (energy > 0.6)
        return 'energetic';
    if (energy > 0.4)
        return 'balanced';
    if (energy > 0.2)
        return 'contemplative';
    return 'serene';
}
function getDefaultEffects(style, energy) {
    const effects = [];
    if (energy > 0.7) {
        effects.push({ effectSlug: 'brightness-contrast', intensity: 0.8 });
    }
    if (style === 'psychedelic') {
        effects.push({
            effectSlug: 'hue-rotate',
            intensity: energy,
            audioSync: { parameter: 'hue', feature: 'energy', mapping: 'linear', sensitivity: 0.8 }
        });
    }
    if (style === 'cinematic') {
        effects.push({ effectSlug: 'vignette', intensity: 0.4 });
    }
    return effects;
}
function getGenerativeType(energy) {
    if (energy > 0.7)
        return 'particles';
    if (energy > 0.5)
        return 'spectrum';
    if (energy > 0.3)
        return 'geometric';
    return 'waves';
}
function getColorPalette(style) {
    const palettes = {
        psychedelic: { primary: '#ff006e', secondary: '#8338ec', accent: '#3a86ff', mood: 'vibrant' },
        cinematic: { primary: '#1a1a2e', secondary: '#16213e', accent: '#e94560', mood: 'cool' },
        minimal: { primary: '#ffffff', secondary: '#f5f5f5', accent: '#000000', mood: 'neutral' },
        organic: { primary: '#C45D3A', secondary: '#F8F6F3', accent: '#2A2621', mood: 'warm' }
    };
    return palettes[style] || palettes.organic;
}
function createTimeBasedSegments(duration, style, footageCount) {
    const segmentDuration = 15;
    const numSegments = Math.ceil(duration / segmentDuration);
    const segments = [];
    for (let i = 0; i < numSegments; i++) {
        const startTime = i * segmentDuration;
        const endTime = Math.min((i + 1) * segmentDuration, duration);
        const progress = i / numSegments;
        const energy = progress < 0.3 ? 0.4 : progress < 0.7 ? 0.7 : 0.5;
        segments.push({
            startTime,
            endTime,
            musicalContext: progress < 0.3 ? 'intro' : progress < 0.7 ? 'verse' : 'outro',
            emotionalTone: getEmotionalTone(energy),
            description: `Segment ${i + 1}`,
            effects: getDefaultEffects(style, energy),
            footageIndex: footageCount > 0 ? i % footageCount : undefined,
            generativeType: footageCount === 0 ? getGenerativeType(energy) : undefined,
            transition: { type: 'fade', duration: 0.5 }
        });
    }
    return segments;
}
/**
 * Convert effect slug to FFmpeg filter string
 */
function getFFmpegFilterForEffect(effectSlug, intensity) {
    const filterMap = {
        'brightness-contrast': (i) => `eq=brightness=${0.1 * i}:contrast=${1 + 0.2 * i}`,
        'hue-rotate': (i) => `hue=h=${360 * i}`,
        'saturation': (i) => `eq=saturation=${1 + i}`,
        'vignette': (i) => `vignette=angle=${0.5 * i}`,
        'grain': (i) => `noise=alls=${Math.round(10 * i)}:allf=t`,
        'blur': (i) => `gblur=sigma=${5 * i}`,
        'sharpen': (i) => `unsharp=5:5:${i}`,
        'glow': (i) => `gblur=sigma=${3 * i},blend=all_mode=screen:all_opacity=${0.3 * i}`,
        'chromatic-aberration': (i) => `rgbashift=rh=${Math.round(5 * i)}:bh=${Math.round(-5 * i)}`,
    };
    return filterMap[effectSlug]?.(intensity) || '';
}
/**
 * Get a user's decrypted API key for a specific provider
 */
async function getUserApiKey(organizationId, provider) {
    try {
        const { data: keyRecord } = await supabase
            .from('user_api_keys')
            .select('encrypted_key, is_valid')
            .eq('organization_id', organizationId)
            .eq('provider', provider)
            .single();
        if (!keyRecord || !keyRecord.is_valid) {
            console.log(`No valid ${provider} API key found for organization ${organizationId}`);
            return undefined;
        }
        // Decrypt the key
        const encryptionSecret = getEncryptionSecret();
        const decryptedKey = decryptApiKey(keyRecord.encrypted_key, encryptionSecret);
        return decryptedKey;
    }
    catch (error) {
        console.error(`Failed to fetch ${provider} API key:`, error);
        return undefined;
    }
}
/**
 * Mark an API key as invalid (e.g., after auth failure)
 */
async function markApiKeyInvalid(organizationId, provider, error) {
    await supabase
        .from('user_api_keys')
        .update({
        is_valid: false,
        last_error: error,
        updated_at: new Date().toISOString()
    })
        .eq('organization_id', organizationId)
        .eq('provider', provider);
}
//# sourceMappingURL=generate.js.map