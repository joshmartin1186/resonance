import * as musicMetadata from 'music-metadata';
/**
 * Analyze an audio file and extract features
 *
 * This is a simplified version that extracts basic metadata.
 * Full analysis with Essentia.js/Meyda would require:
 * 1. Downloading the audio file
 * 2. Decoding to raw PCM samples
 * 3. Running analysis algorithms on the samples
 *
 * For production, this would run on the worker with FFmpeg + Essentia.js
 */
export async function analyzeAudio(audioUrl, onProgress) {
    onProgress?.({ stage: 'Downloading audio file', progress: 0 });
    // Fetch the audio file
    const response = await fetch(audioUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.statusText}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    onProgress?.({ stage: 'Extracting metadata', progress: 20 });
    // Extract metadata using music-metadata
    const metadata = await musicMetadata.parseBuffer(buffer);
    onProgress?.({ stage: 'Analyzing rhythm', progress: 40 });
    // Get basic info from metadata
    const duration = metadata.format.duration || 0;
    const sampleRate = metadata.format.sampleRate || 44100;
    const channels = metadata.format.numberOfChannels || 2;
    const bitrate = metadata.format.bitrate;
    const format = metadata.format.container;
    onProgress?.({ stage: 'Detecting key and tempo', progress: 60 });
    // Estimate tempo based on duration (placeholder - real impl would use beat detection)
    // Most music is between 60-180 BPM
    const estimatedTempo = estimateTempo(duration);
    // Generate placeholder beats based on tempo
    const beatInterval = 60 / estimatedTempo;
    const beats = [];
    for (let t = 0; t < duration; t += beatInterval) {
        beats.push(t);
    }
    onProgress?.({ stage: 'Analyzing structure', progress: 80 });
    // Estimate sections based on duration
    const sections = estimateSections(duration);
    // Generate energy curve (placeholder - would use RMS analysis)
    const energyCurve = generateEnergyCurve(duration, sections);
    onProgress?.({ stage: 'Finalizing analysis', progress: 95 });
    // Estimate key (placeholder - would use chromagram analysis)
    const key = estimateKey();
    const features = {
        duration,
        sampleRate,
        channels,
        bitrate,
        format,
        tempo: estimatedTempo,
        beats,
        timeSignature: '4/4',
        key,
        loudness: {
            integrated: -14,
            range: 8,
            peak: -1
        },
        dynamicRange: 10,
        sections,
        energyCurve,
        spectral: {
            centroid: 2000,
            rolloff: 8000,
            flux: 0.5
        }
    };
    onProgress?.({ stage: 'Complete', progress: 100 });
    return features;
}
/**
 * Estimate tempo based on duration
 * Longer tracks tend to have slower tempos for ambient/organic music
 */
function estimateTempo(duration) {
    if (duration > 300)
        return 70 + Math.random() * 30; // 70-100 for long tracks
    if (duration > 180)
        return 85 + Math.random() * 35; // 85-120 for medium
    return 100 + Math.random() * 40; // 100-140 for shorter tracks
}
/**
 * Estimate song sections based on duration
 */
function estimateSections(duration) {
    const sections = [];
    if (duration < 60) {
        // Very short - just one section
        sections.push({
            type: 'instrumental',
            startTime: 0,
            endTime: duration,
            energy: 0.5
        });
        return sections;
    }
    // Typical structure: intro (10%), verse (25%), chorus (20%), verse (20%), chorus (15%), outro (10%)
    const intro = duration * 0.1;
    const verse1End = intro + duration * 0.25;
    const chorus1End = verse1End + duration * 0.2;
    const verse2End = chorus1End + duration * 0.2;
    const chorus2End = verse2End + duration * 0.15;
    sections.push({ type: 'intro', startTime: 0, endTime: intro, energy: 0.3 }, { type: 'verse', startTime: intro, endTime: verse1End, energy: 0.5 }, { type: 'chorus', startTime: verse1End, endTime: chorus1End, energy: 0.8 }, { type: 'verse', startTime: chorus1End, endTime: verse2End, energy: 0.6 }, { type: 'chorus', startTime: verse2End, endTime: chorus2End, energy: 0.9 }, { type: 'outro', startTime: chorus2End, endTime: duration, energy: 0.4 });
    return sections;
}
/**
 * Generate energy curve based on sections
 */
function generateEnergyCurve(duration, sections) {
    const resolution = 100; // 100 data points
    const curve = [];
    for (let i = 0; i < resolution; i++) {
        const time = (i / resolution) * duration;
        const section = sections.find(s => time >= s.startTime && time < s.endTime);
        const baseEnergy = section?.energy || 0.5;
        // Add some variation
        const variation = (Math.sin(time * 0.5) * 0.1) + (Math.random() * 0.1 - 0.05);
        curve.push(Math.max(0, Math.min(1, baseEnergy + variation)));
    }
    return curve;
}
/**
 * Estimate key (placeholder - would use chromagram analysis)
 */
function estimateKey() {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const scales = ['major', 'minor'];
    return {
        note: notes[Math.floor(Math.random() * notes.length)],
        scale: scales[Math.floor(Math.random() * scales.length)],
        confidence: 0.7 + Math.random() * 0.2
    };
}
/**
 * Detect subtle cues in the audio (breath, vibrato, silence)
 * This would use more sophisticated analysis in production
 */
export function detectSubtleCues(features) {
    const breaths = [];
    const vibrato = [];
    const silences = [];
    // Find low-energy moments that could be breaths
    for (let i = 0; i < features.energyCurve.length - 1; i++) {
        const time = (i / features.energyCurve.length) * features.duration;
        const energy = features.energyCurve[i];
        const nextEnergy = features.energyCurve[i + 1];
        // Breath detection: energy dip followed by increase
        if (energy < 0.3 && nextEnergy > energy + 0.2) {
            breaths.push(time);
        }
        // Silence detection: very low energy for consecutive samples
        if (energy < 0.1) {
            const lastSilence = silences[silences.length - 1];
            if (lastSilence && lastSilence.end === time - (features.duration / 100)) {
                lastSilence.end = time;
            }
            else {
                silences.push({ start: time, end: time });
            }
        }
    }
    // Add some placeholder vibrato segments in high-energy sections
    for (const section of features.sections) {
        if (section.energy > 0.7 && section.endTime - section.startTime > 5) {
            const vibratoStart = section.startTime + 2;
            const vibratoEnd = Math.min(vibratoStart + 3, section.endTime - 1);
            vibrato.push({
                start: vibratoStart,
                end: vibratoEnd,
                intensity: 0.6 + Math.random() * 0.3
            });
        }
    }
    return { breaths, vibrato, silences };
}
//# sourceMappingURL=audio-analyzer.js.map