/**
 * AI Orchestrator - Generates visual timelines based on audio analysis
 *
 * This is the brain of the system:
 * 1. Analyzes deep audio features (beats, tempo, frequency, energy)
 * 2. Identifies musical structure (intro, verse, chorus, bridge, outro)
 * 3. Generates 100+ unique visual states that react to the music
 * 4. Commands the node system to create infinite complexity
 *
 * Uses Claude API to generate sophisticated visual timelines
 */
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});
/**
 * Generate a visual timeline for a song
 */
export async function generateVisualTimeline(audioFeatures, songName) {
    console.log('[AI Orchestrator] Generating visual timeline...');
    // Analyze musical structure
    const structure = analyzeMusicStructure(audioFeatures);
    console.log('[AI Orchestrator] Musical structure:', structure);
    // Create prompt for Claude
    const prompt = buildOrchestratorPrompt(audioFeatures, structure, songName);
    // Call Claude API
    console.log('[AI Orchestrator] Calling Claude API...');
    const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 16000,
        temperature: 1.0, // High creativity for unique visuals
        messages: [{
                role: 'user',
                content: prompt
            }]
    });
    // Parse timeline from response
    const content = response.content[0];
    if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
    }
    const timeline = parseTimelineFromResponse(content.text, audioFeatures.duration);
    console.log(`[AI Orchestrator] Generated ${timeline.nodes.length} nodes`);
    return timeline;
}
/**
 * Analyze musical structure (intro, verse, chorus, etc.)
 */
function analyzeMusicStructure(features) {
    const { duration, beats, rms, tempo } = features;
    // Detect energy changes (often indicate section changes)
    const sectionChanges = [0];
    const windowSize = Math.floor(30 * 4); // 4 second window at 30fps
    for (let i = windowSize; i < rms.length - windowSize; i += windowSize) {
        const prevEnergy = rms.slice(i - windowSize, i).reduce((a, b) => a + b, 0) / windowSize;
        const nextEnergy = rms.slice(i, i + windowSize).reduce((a, b) => a + b, 0) / windowSize;
        // Significant energy change = section change
        if (Math.abs(nextEnergy - prevEnergy) > 0.1) {
            sectionChanges.push(i / 30); // Convert to seconds
        }
    }
    sectionChanges.push(duration);
    // Label sections based on position and energy
    const sections = [];
    for (let i = 0; i < sectionChanges.length - 1; i++) {
        const startTime = sectionChanges[i];
        const endTime = sectionChanges[i + 1];
        const startFrame = Math.floor(startTime * 30);
        const endFrame = Math.floor(endTime * 30);
        const energy = rms.slice(startFrame, endFrame).reduce((a, b) => a + b, 0) / (endFrame - startFrame);
        // Simple heuristic for section types
        let type;
        if (i === 0 && endTime - startTime < 20) {
            type = 'intro';
        }
        else if (i === sectionChanges.length - 2 && endTime - startTime < 20) {
            type = 'outro';
        }
        else if (energy > 0.5) {
            type = i % 2 === 0 ? 'chorus' : 'verse';
        }
        else if (energy < 0.3) {
            type = 'bridge';
        }
        else {
            type = 'verse';
        }
        sections.push({
            type,
            startTime,
            endTime,
            energy,
            beatCount: beats.filter(b => b.time >= startTime && b.time < endTime).length
        });
    }
    return {
        duration,
        tempo,
        sections,
        totalBeats: beats.length,
        averageEnergy: rms.reduce((a, b) => a + b, 0) / rms.length
    };
}
/**
 * Build orchestrator prompt for Claude
 */
function buildOrchestratorPrompt(features, structure, songName) {
    // Sample audio features for Claude to understand the music
    const samplePoints = 20;
    const interval = Math.floor(features.rms.length / samplePoints);
    const samples = [];
    for (let i = 0; i < samplePoints; i++) {
        const idx = Math.min(i * interval, features.rms.length - 1);
        samples.push({
            time: (idx / 30).toFixed(1),
            energy: features.rms[idx].toFixed(3),
            bass: features.bass[idx].toFixed(3),
            mid: features.mid[idx].toFixed(3),
            high: features.high[idx].toFixed(3),
            brightness: (features.spectralCentroid[idx] / 1000).toFixed(1) // Convert to kHz
        });
    }
    return `You are an expert visual artist specializing in music visualization. Your task is to create a visual timeline for ${songName ? `the song "${songName}"` : 'a song'}.

**AUDIO ANALYSIS:**

Duration: ${structure.duration.toFixed(1)}s
Tempo: ${structure.tempo} BPM
Total Beats: ${structure.totalBeats}
Average Energy: ${structure.averageEnergy.toFixed(2)}

**MUSICAL STRUCTURE:**
${structure.sections.map((s, i) => `
Section ${i + 1} (${s.type.toUpperCase()}):
  Time: ${s.startTime.toFixed(1)}s - ${s.endTime.toFixed(1)}s (${(s.endTime - s.startTime).toFixed(1)}s)
  Energy: ${s.energy.toFixed(2)}
  Beats: ${s.beatCount}
`).join('')}

**AUDIO FEATURES OVER TIME:**
${samples.map(s => `${s.time}s: Energy=${s.energy} Bass=${s.bass} Mid=${s.mid} High=${s.high} Brightness=${s.brightness}kHz`).join('\n')}

---

**YOUR TASK:**

Create a visual timeline with 50-150 unique visual states. Use the node system to create infinite complexity that reacts to the music.

**AVAILABLE NODES:**

**Generators** (create base patterns):
- perlin-noise: { octaves: 1-8, scale: 0.5-5.0 }
- particles: { count: 10-500, size: 0.5-5.0, speed: 0.1-2.0 }
- fractal: { iterations: 10-100, zoom: 0.5-5.0 }
- voronoi: { points: 5-50, distance: 0-1 (0=euclidean, 1=manhattan) }
- flow-field: { resolution: 1-20, strength: 0.5-3.0 }

**Effects** (transform visuals):
- blur: { radius: 0-20 }
- bloom: { threshold: 0-1, intensity: 0-2 }
- kaleidoscope: { segments: 2-12, rotation: 0-6.28 }
- color-grade: { hue: 0-1, saturation: 0-2, brightness: 0-2 }
- feedback: { amount: 0-1, decay: 0.9-0.99 }

**CONTROL PARAMETERS:**

Each parameter can be:
1. **static**: Fixed value
2. **evolving**: Smoothly change over time (linear, ease-in, ease-out, sine, bounce)
3. **audio-reactive**: React to audio features

**Audio sources for reactivity:**
- rms (overall energy)
- bass (20-250 Hz)
- mid (500-2000 Hz)
- high (4000-20000 Hz)
- spectralCentroid (brightness)
- spectralFlux (rate of change, good for onsets)
- beat (pulse on beats, confidence 0-1)
- mfcc[0-12] (timbre characteristics)
- chroma[0-11] (pitch class)

**CREATIVE GUIDELINES:**

1. **Match the music structure**:
   - Intro: Simple, building up
   - Verse: Moderate complexity
   - Chorus: High energy, maximum complexity
   - Bridge: Contrast, different style
   - Outro: Wind down, simplify

2. **React to audio features**:
   - Bass-heavy sections: Use low-frequency reactivity
   - Bright sections: React to spectralCentroid
   - Rhythmic sections: React to beats
   - Transitions: Use spectralFlux

3. **Create variety**:
   - Use 3-7 different generators throughout the song
   - Layer 2-4 effects at peak moments
   - Transition smoothly between states (use fadeIn/fadeOut)

4. **Build complexity**:
   - Start simple (1-2 nodes)
   - Build to 5-10 simultaneous nodes at climax
   - Create unique moments (100+ total states)

**OUTPUT FORMAT:**

Return a JSON object with this EXACT structure:

\`\`\`json
{
  "backgroundColor": {
    "type": "static",
    "value": 0.05
  },
  "nodes": [
    {
      "id": "gen-1",
      "type": "generator",
      "enabled": true,
      "startTime": 0,
      "endTime": 15.5,
      "fadeIn": 2.0,
      "fadeOut": 1.0,
      "params": {},
      "generator": {
        "name": "perlin-noise",
        "octaves": {
          "type": "evolving",
          "startValue": 3,
          "endValue": 6,
          "curve": "ease-in"
        },
        "scale": {
          "type": "audio-reactive",
          "audioSource": { "type": "bass" },
          "audioRange": [1.0, 3.0],
          "smoothing": 0.3
        }
      }
    },
    {
      "id": "effect-1",
      "type": "effect",
      "enabled": true,
      "startTime": 5.0,
      "endTime": 20.0,
      "fadeIn": 1.0,
      "params": {},
      "effect": {
        "name": "bloom",
        "threshold": {
          "type": "static",
          "value": 0.6
        },
        "intensity": {
          "type": "audio-reactive",
          "audioSource": { "type": "beat", "confidence": 0.7 },
          "audioRange": [0.5, 1.5],
          "smoothing": 0.5
        }
      }
    }
  ]
}
\`\`\`

**IMPORTANT:**
- Create 50-150 nodes total
- Overlap nodes to create layered complexity
- Use audio-reactive params extensively (this is music visualization!)
- Match visual intensity to musical energy
- Create seamless transitions with fadeIn/fadeOut
- Be creative and unpredictable - surprise the viewer!

Generate the visual timeline now:`;
}
/**
 * Parse timeline from Claude's response
 */
function parseTimelineFromResponse(response, duration) {
    // Extract JSON from markdown code block if present
    let jsonStr = response;
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
        jsonStr = jsonMatch[1];
    }
    try {
        const parsed = JSON.parse(jsonStr);
        // Validate and return
        const timeline = {
            duration,
            nodes: parsed.nodes || [],
            backgroundColor: parsed.backgroundColor || { type: 'static', value: 0 }
        };
        return timeline;
    }
    catch (error) {
        throw new Error(`Failed to parse timeline from Claude response: ${error}`);
    }
}
/**
 * Preview: Generate a simple test timeline (for testing without API calls)
 */
export function generateTestTimeline(features) {
    const { duration, tempo } = features;
    // Create a complex, varied timeline with multiple generators and effects
    const timeline = {
        duration,
        backgroundColor: {
            type: 'audio-reactive',
            audioSource: { type: 'rms' },
            audioRange: [0.02, 0.15],
            smoothing: 0.8
        },
        nodes: []
    };
    // INTRO: Perlin noise with evolving complexity (0 - 20% of song)
    const introEnd = duration * 0.2;
    timeline.nodes.push({
        id: 'intro-perlin',
        type: 'generator',
        enabled: true,
        startTime: 0,
        endTime: introEnd,
        fadeIn: 3.0,
        fadeOut: 2.0,
        params: {},
        generator: {
            name: 'perlin-noise',
            octaves: {
                type: 'evolving',
                startValue: 2,
                endValue: 5,
                curve: 'ease-in'
            },
            scale: {
                type: 'evolving',
                startValue: 1.5,
                endValue: 2.5,
                curve: 'sine'
            }
        }
    });
    // VERSE 1: Particles react to beats (20% - 40%)
    const verse1Start = introEnd;
    const verse1End = duration * 0.4;
    timeline.nodes.push({
        id: 'verse1-particles',
        type: 'generator',
        enabled: true,
        startTime: verse1Start,
        endTime: verse1End,
        fadeIn: 2.0,
        fadeOut: 1.5,
        params: {},
        generator: {
            name: 'particles',
            count: {
                type: 'audio-reactive',
                audioSource: { type: 'beat', confidence: 0.7 },
                audioRange: [30, 150],
                smoothing: 0.6
            },
            size: {
                type: 'audio-reactive',
                audioSource: { type: 'high' },
                audioRange: [1.0, 3.0],
                smoothing: 0.4
            },
            speed: {
                type: 'audio-reactive',
                audioSource: { type: 'rms' },
                audioRange: [0.2, 0.8],
                smoothing: 0.5
            }
        }
    });
    // Color grade shift during verse 1
    timeline.nodes.push({
        id: 'verse1-color',
        type: 'effect',
        enabled: true,
        startTime: verse1Start + 5,
        endTime: verse1End,
        params: {},
        effect: {
            name: 'color-grade',
            hue: {
                type: 'evolving',
                startValue: 0,
                endValue: 0.3,
                curve: 'linear'
            },
            saturation: {
                type: 'audio-reactive',
                audioSource: { type: 'spectralCentroid' },
                audioRange: [0.8, 1.5],
                smoothing: 0.6
            },
            brightness: {
                type: 'static',
                value: 1.0
            }
        }
    });
    // CHORUS: Maximum complexity with fractal + kaleidoscope (40% - 60%)
    const chorusStart = verse1End;
    const chorusEnd = duration * 0.6;
    // Fractal generator
    timeline.nodes.push({
        id: 'chorus-fractal',
        type: 'generator',
        enabled: true,
        startTime: chorusStart,
        endTime: chorusEnd,
        fadeIn: 3.0,
        fadeOut: 3.0,
        params: {},
        generator: {
            name: 'fractal',
            iterations: {
                type: 'audio-reactive',
                audioSource: { type: 'spectralCentroid' },
                audioRange: [20, 60],
                smoothing: 0.5
            },
            zoom: {
                type: 'evolving',
                startValue: 1.0,
                endValue: 0.4,
                curve: 'ease-in'
            }
        }
    });
    // Kaleidoscope effect
    timeline.nodes.push({
        id: 'chorus-kaleidoscope',
        type: 'effect',
        enabled: true,
        startTime: chorusStart + 2,
        endTime: chorusEnd,
        fadeIn: 2.0,
        fadeOut: 2.0,
        params: {},
        effect: {
            name: 'kaleidoscope',
            segments: {
                type: 'audio-reactive',
                audioSource: { type: 'beat', confidence: 0.8 },
                audioRange: [4, 10],
                smoothing: 0.8
            },
            rotation: {
                type: 'evolving',
                startValue: 0,
                endValue: 12.56, // 2 full rotations
                curve: 'linear'
            }
        }
    });
    // Bloom intensity pulsing
    timeline.nodes.push({
        id: 'chorus-bloom',
        type: 'effect',
        enabled: true,
        startTime: chorusStart,
        endTime: chorusEnd,
        params: {},
        effect: {
            name: 'bloom',
            threshold: { type: 'static', value: 0.5 },
            intensity: {
                type: 'audio-reactive',
                audioSource: { type: 'beat', confidence: 0.7 },
                audioRange: [0.5, 2.5],
                smoothing: 0.6
            }
        }
    });
    // VERSE 2 / BRIDGE: Voronoi cells + flow field (60% - 80%)
    const verse2Start = chorusEnd;
    const verse2End = duration * 0.8;
    timeline.nodes.push({
        id: 'verse2-voronoi',
        type: 'generator',
        enabled: true,
        startTime: verse2Start,
        endTime: verse2End,
        fadeIn: 2.5,
        fadeOut: 2.0,
        params: {},
        generator: {
            name: 'voronoi',
            points: {
                type: 'audio-reactive',
                audioSource: { type: 'mid' },
                audioRange: [8, 30],
                smoothing: 0.7
            },
            distance: {
                type: 'evolving',
                startValue: 0,
                endValue: 1,
                curve: 'sine'
            }
        }
    });
    timeline.nodes.push({
        id: 'verse2-flow',
        type: 'generator',
        enabled: true,
        startTime: verse2Start + 5,
        endTime: verse2End,
        fadeIn: 2.0,
        fadeOut: 1.5,
        params: {},
        generator: {
            name: 'flow-field',
            resolution: {
                type: 'audio-reactive',
                audioSource: { type: 'bass' },
                audioRange: [5, 15],
                smoothing: 0.6
            },
            strength: {
                type: 'audio-reactive',
                audioSource: { type: 'rms' },
                audioRange: [0.5, 2.0],
                smoothing: 0.4
            }
        }
    });
    // Feedback effect for trails
    timeline.nodes.push({
        id: 'verse2-feedback',
        type: 'effect',
        enabled: true,
        startTime: verse2Start + 3,
        endTime: verse2End - 2,
        fadeIn: 1.5,
        params: {},
        effect: {
            name: 'feedback',
            amount: {
                type: 'audio-reactive',
                audioSource: { type: 'spectralFlux' },
                audioRange: [0.1, 0.6],
                smoothing: 0.7
            },
            decay: {
                type: 'static',
                value: 0.95
            }
        }
    });
    // FINAL CHORUS / CLIMAX: All generators active (80% - 95%)
    const finalChorusStart = verse2End;
    const finalChorusEnd = duration * 0.95;
    // Bring back particles
    timeline.nodes.push({
        id: 'final-particles',
        type: 'generator',
        enabled: true,
        startTime: finalChorusStart,
        endTime: finalChorusEnd,
        fadeIn: 2.0,
        fadeOut: 2.0,
        params: {},
        generator: {
            name: 'particles',
            count: {
                type: 'audio-reactive',
                audioSource: { type: 'beat', confidence: 0.6 },
                audioRange: [80, 250],
                smoothing: 0.5
            },
            size: {
                type: 'audio-reactive',
                audioSource: { type: 'high' },
                audioRange: [0.8, 2.5],
                smoothing: 0.3
            },
            speed: {
                type: 'audio-reactive',
                audioSource: { type: 'rms' },
                audioRange: [0.4, 1.2],
                smoothing: 0.4
            }
        }
    });
    // Perlin noise layer
    timeline.nodes.push({
        id: 'final-perlin',
        type: 'generator',
        enabled: true,
        startTime: finalChorusStart + 1,
        endTime: finalChorusEnd,
        fadeIn: 1.5,
        fadeOut: 2.0,
        params: {},
        generator: {
            name: 'perlin-noise',
            octaves: {
                type: 'audio-reactive',
                audioSource: { type: 'rms' },
                audioRange: [4, 7],
                smoothing: 0.4
            },
            scale: {
                type: 'audio-reactive',
                audioSource: { type: 'bass' },
                audioRange: [2.0, 4.0],
                smoothing: 0.5
            }
        }
    });
    // Heavy blur for dreamlike quality
    timeline.nodes.push({
        id: 'final-blur',
        type: 'effect',
        enabled: true,
        startTime: finalChorusStart + 3,
        endTime: finalChorusEnd,
        fadeIn: 2.0,
        params: {},
        effect: {
            name: 'blur',
            radius: {
                type: 'audio-reactive',
                audioSource: { type: 'spectralFlux' },
                audioRange: [2, 12],
                smoothing: 0.8
            }
        }
    });
    // Color shift
    timeline.nodes.push({
        id: 'final-color',
        type: 'effect',
        enabled: true,
        startTime: finalChorusStart,
        endTime: finalChorusEnd,
        params: {},
        effect: {
            name: 'color-grade',
            hue: {
                type: 'evolving',
                startValue: 0.3,
                endValue: 0.8,
                curve: 'sine'
            },
            saturation: {
                type: 'audio-reactive',
                audioSource: { type: 'rms' },
                audioRange: [1.0, 1.8],
                smoothing: 0.6
            },
            brightness: {
                type: 'static',
                value: 1.1
            }
        }
    });
    // OUTRO: Fade to simple perlin (95% - 100%)
    const outroStart = finalChorusEnd;
    timeline.nodes.push({
        id: 'outro-perlin',
        type: 'generator',
        enabled: true,
        startTime: outroStart,
        endTime: duration,
        fadeIn: 2.0,
        params: {},
        generator: {
            name: 'perlin-noise',
            octaves: {
                type: 'evolving',
                startValue: 5,
                endValue: 2,
                curve: 'ease-out'
            },
            scale: {
                type: 'evolving',
                startValue: 3.0,
                endValue: 1.5,
                curve: 'ease-out'
            }
        }
    });
    console.log(`[Test Timeline] Generated ${timeline.nodes.length} nodes for ${duration.toFixed(1)}s song`);
    return timeline;
}
//# sourceMappingURL=ai-orchestrator.js.map