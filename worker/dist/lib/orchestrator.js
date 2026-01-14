import Anthropic from '@anthropic-ai/sdk';
// Available effects for Claude to use
const AVAILABLE_EFFECTS = `
GEOMETRIC:
- scale: Zoom in/out, params: {factor: 0.5-2}
- rotate: Spin, params: {angle: -360 to 360}
- mirror: Reflect horizontally/vertically
- kaleidoscope: Psychedelic mirror effect

DISTORTION:
- wave: Liquid wave distortion, params: {amplitude: 0-50, wavelength: 10-200}
- pixelate: 8-bit effect, params: {factor: 2-32}
- glitch: Digital corruption, params: {intensity: 0-100, shift: 0-20}

COLOR:
- hue-rotate: Shift colors, params: {hue: -180 to 180}, can sync to pitch
- saturation: Vivid/desaturate, params: {saturation: 0-3}
- brightness-contrast: Light/dark, params: {brightness: -1 to 1, contrast: 0-2}
- invert: Negative colors

BLUR:
- blur: Soft/dreamy, params: {sigma: 0-50}, can sync to energy (inverse)
- motion-blur: Speed effect, params: {amount: 0-100}
- radial-blur: Zoom blur from center

PATTERN:
- grain: Film texture, params: {amount: 0-50}
- vignette: Dark edges, params: {angle: 0-1.5}
- scanlines: CRT/retro, params: {spacing: 2-10, opacity: 0-1}

GENERATIVE SHADERS (use shaderType instead of generativeType):
- perlin-noise: Organic flowing patterns with fractal noise layers, audio-reactive distortions
- particle-flow: GPU particle system guided by Perlin noise flow fields, density varies with energy
- fractal-mandelbrot: Dynamic Mandelbrot fractal zoom, bass-driven rotation, mid-freq view shifts
- voronoi-cells: Organic cellular patterns with animated boundaries, pulsing with bass
- reaction-diffusion: Biological pattern formation (coral/tiger stripes), smooth organic morphing

Use shaderType for sophisticated generative visuals that respond to audio in complex ways.
Use generativeType only for simple legacy patterns (particles, waves, geometric, noise, spectrum).
`;
// System prompt for Claude
const SYSTEM_PROMPT = `You are an AI cinematographer and visual artist creating music videos. Your role is to generate detailed visual plans that:

1. CREATE EMOTIONAL RESONANCE: Match visuals to the feeling of the music
2. RESPOND TO STRUCTURE: Use verse/chorus/bridge to shape visual narrative
3. SYNC TO SUBTLETIES: React to beats, transients, pitch changes, dynamics
4. BUILD NARRATIVE: Create a visual story with beginning, development, climax, resolution
5. BALANCE ELEMENTS: Mix footage, effects, and generative elements appropriately
6. USE SOPHISTICATED VISUALS: Prefer shaderType over generativeType for stunning procedural graphics

You respond ONLY with valid JSON matching the VisualPlan schema. No explanations.

${AVAILABLE_EFFECTS}

Audio sync options let effects react to music in real-time:
- energy: Overall loudness (good for brightness, scale, particle count)
- transients: Sudden sounds like drums (good for flashes, glitches)
- pitch: Melodic content (good for hue rotation, vertical position)
- tempo: BPM (good for motion blur, transition speed)

IMPORTANT: When no footage is available, always use shaderType (not generativeType) to create sophisticated visuals.
Choose shaders based on mood:
- perlin-noise: Calm, flowing, organic, meditative
- particle-flow: Energetic, dynamic, cosmic, explosive
- fractal-mandelbrot: Psychedelic, infinite, mathematical, hypnotic
- voronoi-cells: Structured, biological, cellular, pulsing
- reaction-diffusion: Natural, organic growth patterns, evolving textures`;
/**
 * Generate a visual plan using Claude
 */
export async function generateVisualPlan(input) {
    const { audioFeatures, prompt, style, footage, effectIntensity, footageVisibility, seed, anthropicApiKey } = input;
    // Check if we have an API key
    if (!anthropicApiKey) {
        console.log('No Anthropic API key provided, using fallback plan generator');
        return generateFallbackPlan(input);
    }
    // Initialize Anthropic client with user's API key
    const anthropic = new Anthropic({
        apiKey: anthropicApiKey
    });
    // Build the user prompt
    const userPrompt = buildUserPrompt(input);
    try {
        // Call Claude API
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            temperature: seed ? 0 : 0.7, // Deterministic if seed provided
            system: SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: userPrompt
                }
            ]
        });
        // Extract text content
        const textContent = response.content.find((c) => c.type === 'text');
        if (!textContent || textContent.type !== 'text') {
            throw new Error('No text response from Claude');
        }
        // Parse JSON response
        const plan = parseVisualPlan(textContent.text);
        // Validate and enhance the plan
        return enhancePlan(plan, input);
    }
    catch (error) {
        console.error('Claude orchestration failed:', error);
        // Return fallback plan
        return generateFallbackPlan(input);
    }
}
/**
 * Build the user prompt for Claude
 */
function buildUserPrompt(input) {
    const { audioFeatures, prompt, style, footage, effectIntensity, footageVisibility } = input;
    const sections = audioFeatures.sections?.map(s => ({
        start: s.startTime.toFixed(1),
        end: s.endTime.toFixed(1),
        type: s.type,
        energy: s.energy.toFixed(2)
    })) || [];
    return `Generate a visual plan for this music video:

## User Vision
"${prompt}"

## Style
${style}

## Audio Analysis
- Duration: ${audioFeatures.duration.toFixed(1)} seconds
- Tempo: ${audioFeatures.tempo || 'unknown'} BPM
- Key: ${audioFeatures.key || 'unknown'}
- Time Signature: ${audioFeatures.timeSignature || '4/4'}

## Song Structure
${sections.map(s => `- ${s.start}s - ${s.end}s: ${s.type} (energy: ${s.energy})`).join('\n')}

## Energy Curve
Average energy: ${audioFeatures.energyCurve ? (audioFeatures.energyCurve.reduce((a, b) => a + b, 0) / audioFeatures.energyCurve.length).toFixed(2) : 'unknown'}
Peak moments at: ${findPeaks(audioFeatures.energyCurve || []).join(', ')}s

## Available Footage
${footage.length > 0
        ? footage.map((f, i) => `${i}: ${f.fileType}, ${f.motionLevel || 'unknown'} motion, ${f.brightness || 'unknown'} brightness`).join('\n')
        : 'No footage provided - use generative visuals only'}

## Settings
- Effect Intensity: ${effectIntensity} (0=subtle, 1=intense)
- Footage Visibility: ${footageVisibility} (0=hidden, 1=full)

Generate a VisualPlan JSON with:
1. narrative: theme, moodProgression (array of mood descriptions per section), keyMoments (descriptions)
2. colorPalette: primary, secondary, accent (hex colors), mood (warm/cool/neutral/vibrant)
3. segments: array matching song sections with effects, footageIndex, generativeType, transitions
4. globalEffects: effects applied throughout (like grain, vignette)

Each segment needs: startTime, endTime, musicalContext, emotionalTone, description, effects[], transition`;
}
/**
 * Find peak moments in energy curve
 */
function findPeaks(energyCurve) {
    const peaks = [];
    const threshold = 0.7;
    for (let i = 1; i < energyCurve.length - 1; i++) {
        if (energyCurve[i] > threshold &&
            energyCurve[i] > energyCurve[i - 1] &&
            energyCurve[i] > energyCurve[i + 1]) {
            peaks.push(i);
        }
    }
    return peaks.slice(0, 5); // Return top 5 peaks
}
/**
 * Parse and validate Claude's JSON response
 */
function parseVisualPlan(text) {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = text;
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
        jsonStr = jsonMatch[1];
    }
    else {
        // Try to find raw JSON
        const startIdx = text.indexOf('{');
        const endIdx = text.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
            jsonStr = text.substring(startIdx, endIdx + 1);
        }
    }
    try {
        return JSON.parse(jsonStr);
    }
    catch (err) {
        throw new Error(`Failed to parse Claude response as JSON: ${err}`);
    }
}
/**
 * Enhance and validate the plan
 */
function enhancePlan(plan, input) {
    // Ensure all segments have required fields
    plan.segments = plan.segments.map((segment, i) => {
        // Extract shaderType from effects array if Claude put it there
        let shaderType = segment.shaderType;
        if (!shaderType && segment.effects) {
            const shaderEffect = segment.effects.find((eff) => eff.type === 'shaderType' &&
                ['perlin-noise', 'particle-flow', 'fractal-mandelbrot', 'voronoi-cells', 'reaction-diffusion'].includes(eff.name));
            if (shaderEffect) {
                shaderType = shaderEffect.name;
                console.log(`[Orchestrator] Extracted shaderType: ${shaderType} from effects for segment ${i}`);
            }
        }
        return {
            ...segment,
            startTime: segment.startTime ?? 0,
            endTime: segment.endTime ?? input.audioFeatures.duration,
            musicalContext: segment.musicalContext || 'verse',
            emotionalTone: segment.emotionalTone || 'neutral',
            description: segment.description || `Segment ${i + 1}`,
            effects: segment.effects || [],
            shaderType, // Add extracted shaderType
            transition: segment.transition || { type: 'fade', duration: 0.5 }
        };
    });
    // Ensure color palette
    plan.colorPalette = plan.colorPalette || {
        primary: '#C45D3A',
        secondary: '#F8F6F3',
        accent: '#2A2621',
        mood: 'warm'
    };
    // Ensure narrative
    plan.narrative = plan.narrative || {
        theme: input.prompt,
        moodProgression: ['opening', 'development', 'climax', 'resolution'],
        keyMoments: []
    };
    return plan;
}
/**
 * Generate a fallback plan when Claude fails
 */
function generateFallbackPlan(input) {
    const { audioFeatures, prompt, style, footage } = input;
    const duration = audioFeatures.duration;
    const sections = audioFeatures.sections || [];
    // Generate segments from sections or time-based chunks
    const segments = sections.length > 0
        ? sections.map((section, i) => createSegmentFromSection(section, i, style, footage.length))
        : createTimeBasedSegments(duration, style, footage.length);
    return {
        narrative: {
            theme: prompt,
            moodProgression: segments.map(s => s.emotionalTone),
            keyMoments: segments.filter(s => s.musicalContext === 'chorus' || s.musicalContext === 'drop')
                .map(s => `${s.musicalContext} at ${s.startTime}s`)
        },
        colorPalette: getColorPaletteForStyle(style),
        segments,
        globalEffects: getGlobalEffectsForStyle(style)
    };
}
function createSegmentFromSection(section, index, style, footageCount) {
    const emotionalTone = getEmotionalTone(section.energy);
    return {
        startTime: section.startTime,
        endTime: section.endTime,
        musicalContext: section.type,
        emotionalTone,
        description: `${section.type} section with ${emotionalTone} energy`,
        effects: getEffectsForTone(emotionalTone, style, section.energy),
        footageIndex: footageCount > 0 ? index % footageCount : undefined,
        shaderType: footageCount === 0 ? getShaderType(emotionalTone, style) : undefined,
        transition: {
            type: index === 0 ? 'fade' : (section.energy > 0.7 ? 'cut' : 'dissolve'),
            duration: section.energy > 0.7 ? 0.1 : 0.5
        }
    };
}
function createTimeBasedSegments(duration, style, footageCount) {
    const segmentDuration = 15; // seconds
    const numSegments = Math.ceil(duration / segmentDuration);
    const segments = [];
    for (let i = 0; i < numSegments; i++) {
        const startTime = i * segmentDuration;
        const endTime = Math.min((i + 1) * segmentDuration, duration);
        const progress = i / numSegments;
        // Simulate energy curve: quiet start, build to middle, resolve
        const energy = progress < 0.3 ? 0.3 + progress
            : progress < 0.7 ? 0.6 + (progress - 0.3) * 0.5
                : 0.9 - (progress - 0.7) * 1.5;
        const emotionalTone = getEmotionalTone(energy);
        segments.push({
            startTime,
            endTime,
            musicalContext: progress < 0.3 ? 'intro' : progress < 0.7 ? 'verse' : 'outro',
            emotionalTone,
            description: `Segment ${i + 1}`,
            effects: getEffectsForTone(emotionalTone, style, energy),
            footageIndex: footageCount > 0 ? i % footageCount : undefined,
            shaderType: footageCount === 0 ? getShaderType(emotionalTone, style) : undefined,
            transition: {
                type: i === 0 ? 'fade' : 'dissolve',
                duration: 0.5
            }
        });
    }
    return segments;
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
function getEffectsForTone(tone, style, energy) {
    const effects = [];
    // Base effects by tone
    switch (tone) {
        case 'intense':
            effects.push({
                effectSlug: 'brightness-contrast',
                intensity: 0.8,
                audioSync: { parameter: 'contrast', feature: 'energy', mapping: 'linear', sensitivity: 0.7 }
            });
            if (style === 'psychedelic' || style === 'abstract') {
                effects.push({ effectSlug: 'glitch', intensity: 0.5 });
            }
            break;
        case 'energetic':
            effects.push({
                effectSlug: 'saturation',
                intensity: 0.6,
                audioSync: { parameter: 'saturation', feature: 'energy', mapping: 'linear', sensitivity: 0.5 }
            });
            effects.push({ effectSlug: 'motion-blur', intensity: 0.4 });
            break;
        case 'contemplative':
            effects.push({ effectSlug: 'blur', intensity: 0.3 });
            effects.push({ effectSlug: 'vignette', intensity: 0.5 });
            break;
        case 'serene':
            effects.push({ effectSlug: 'blur', intensity: 0.5 });
            effects.push({ effectSlug: 'saturation', intensity: 0.3 }); // desaturate
            break;
        default: // balanced
            effects.push({ effectSlug: 'brightness-contrast', intensity: 0.5 });
    }
    // Style-specific effects
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
// NEW: Intelligent shader selection based on mood and style
function getShaderType(emotionalTone, style) {
    // Psychedelic style favors fractals
    if (style === 'psychedelic') {
        if (emotionalTone === 'intense' || emotionalTone === 'energetic')
            return 'fractal-mandelbrot';
        return 'reaction-diffusion';
    }
    // Abstract style uses varied shaders
    if (style === 'abstract') {
        if (emotionalTone === 'intense')
            return 'particle-flow';
        if (emotionalTone === 'energetic')
            return 'voronoi-cells';
        return 'perlin-noise';
    }
    // Minimal style prefers calm patterns
    if (style === 'minimal') {
        return emotionalTone === 'serene' || emotionalTone === 'contemplative'
            ? 'perlin-noise'
            : 'voronoi-cells';
    }
    // Cinematic and organic styles
    if (emotionalTone === 'intense')
        return 'particle-flow';
    if (emotionalTone === 'energetic')
        return 'voronoi-cells';
    if (emotionalTone === 'balanced')
        return 'reaction-diffusion';
    if (emotionalTone === 'contemplative')
        return 'perlin-noise';
    return 'perlin-noise'; // serene default
}
// LEGACY: Keep for backward compatibility
function getGenerativeType(energy) {
    if (energy > 0.7)
        return 'particles';
    if (energy > 0.5)
        return 'spectrum';
    if (energy > 0.3)
        return 'geometric';
    return 'waves';
}
function getColorPaletteForStyle(style) {
    switch (style) {
        case 'psychedelic':
            return { primary: '#ff006e', secondary: '#8338ec', accent: '#3a86ff', mood: 'vibrant' };
        case 'cinematic':
            return { primary: '#1a1a2e', secondary: '#16213e', accent: '#e94560', mood: 'cool' };
        case 'minimal':
            return { primary: '#ffffff', secondary: '#f5f5f5', accent: '#000000', mood: 'neutral' };
        case 'abstract':
            return { primary: '#ff5500', secondary: '#00ff88', accent: '#0088ff', mood: 'vibrant' };
        default: // organic
            return { primary: '#C45D3A', secondary: '#F8F6F3', accent: '#2A2621', mood: 'warm' };
    }
}
function getGlobalEffectsForStyle(style) {
    switch (style) {
        case 'cinematic':
            return [
                { effectSlug: 'grain', intensity: 0.3 },
                { effectSlug: 'vignette', intensity: 0.4 }
            ];
        case 'psychedelic':
            return [
                { effectSlug: 'saturation', intensity: 0.7 }
            ];
        case 'minimal':
            return [];
        default:
            return [
                { effectSlug: 'grain', intensity: 0.2 }
            ];
    }
}
/**
 * Generate a deterministic seed
 */
export function generateSeed() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let seed = '';
    for (let i = 0; i < 16; i++) {
        seed += chars[Math.floor(Math.random() * chars.length)];
    }
    return seed;
}
/**
 * Create a seeded random number generator
 */
export function createSeededRandom(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return function () {
        hash = Math.imul(hash ^ (hash >>> 15), hash | 1);
        hash ^= hash + Math.imul(hash ^ (hash >>> 7), hash | 61);
        return ((hash ^ (hash >>> 14)) >>> 0) / 4294967296;
    };
}
//# sourceMappingURL=orchestrator.js.map