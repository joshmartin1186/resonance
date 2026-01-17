/**
 * Deep Audio Analysis - Extract detailed features for music reactivity
 *
 * Uses Meyda for real-time audio feature extraction
 * Extracts 30fps time-series data for all audio features
 */
import Meyda from 'meyda';
import { spawn } from 'child_process';
import { readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
/**
 * Analyze audio file and extract deep features at 30fps
 */
export async function analyzeAudioDeep(audioPath) {
    console.log('[Deep Audio] Starting analysis...');
    // 1. Get audio metadata
    const metadata = await getAudioMetadata(audioPath);
    const duration = metadata.duration;
    const sampleRate = metadata.sampleRate;
    console.log(`[Deep Audio] Duration: ${duration}s, Sample rate: ${sampleRate}Hz`);
    // 2. Decode audio to raw PCM
    const audioData = await decodeAudioToPCM(audioPath, sampleRate);
    // 3. Extract features at 30fps
    const fps = 30;
    const hopSize = Math.floor(sampleRate / fps);
    const frameCount = Math.floor(audioData.length / hopSize);
    // Meyda requires buffer size to be power of 2
    // Use 2048 samples (good frequency resolution, ~42ms at 48kHz)
    const bufferSize = 2048;
    console.log(`[Deep Audio] Extracting features for ${frameCount} frames at ${fps}fps (buffer: ${bufferSize})...`);
    // Initialize feature arrays
    const features = {
        duration,
        sampleRate,
        tempo: 0, // Will be estimated
        rms: [],
        zcr: [],
        spectralCentroid: [],
        spectralRolloff: [],
        spectralFlux: [],
        bass: [],
        lowMid: [],
        mid: [],
        highMid: [],
        high: [],
        mfcc: [],
        chroma: [],
        beats: [],
        loudness: [],
        energy: []
    };
    // Configure Meyda
    Meyda.bufferSize = bufferSize;
    Meyda.sampleRate = sampleRate;
    // Extract features frame by frame using Meyda
    for (let i = 0; i < frameCount; i++) {
        const start = i * hopSize;
        const end = Math.min(start + bufferSize, audioData.length);
        const frame = audioData.slice(start, end);
        // Pad to power of 2 if needed
        const frameArray = new Float32Array(bufferSize);
        for (let j = 0; j < frame.length; j++) {
            frameArray[j] = frame[j];
        }
        const meydaFeatures = Meyda.extract([
            'rms',
            'zcr',
            'spectralCentroid',
            'spectralRolloff',
            'mfcc',
            'chroma',
            'loudness',
            'energy'
        ], frameArray);
        features.rms.push(meydaFeatures.rms || 0);
        features.zcr.push(meydaFeatures.zcr || 0);
        features.spectralCentroid.push(meydaFeatures.spectralCentroid || 0);
        features.spectralRolloff.push(meydaFeatures.spectralRolloff || 0);
        // Calculate spectralFlux manually (rate of change in energy)
        const currentEnergy = meydaFeatures.energy || 0;
        const prevEnergy = i > 0 ? features.energy[i - 1] : 0;
        features.spectralFlux.push(Math.abs(currentEnergy - prevEnergy));
        features.loudness.push(meydaFeatures.loudness?.total || 0);
        features.energy.push(meydaFeatures.energy || 0);
        // MFCC and Chroma are arrays
        features.mfcc.push(meydaFeatures.mfcc || new Array(13).fill(0));
        features.chroma.push(meydaFeatures.chroma || new Array(12).fill(0));
        // Extract frequency bands manually using FFT
        const bands = extractFrequencyBands(frameArray, sampleRate);
        features.bass.push(bands.bass);
        features.lowMid.push(bands.lowMid);
        features.mid.push(bands.mid);
        features.highMid.push(bands.highMid);
        features.high.push(bands.high);
        if (i % 100 === 0) {
            console.log(`[Deep Audio] Processed ${i}/${frameCount} frames (${Math.round(i / frameCount * 100)}%)`);
        }
    }
    // 4. Detect beats
    features.beats = detectBeats(features.spectralFlux, fps);
    console.log(`[Deep Audio] Detected ${features.beats.length} beats`);
    // 5. Estimate tempo from beats
    features.tempo = estimateTempo(features.beats, duration);
    console.log(`[Deep Audio] Estimated tempo: ${features.tempo} BPM`);
    console.log('[Deep Audio] Analysis complete!');
    return features;
}
/**
 * Get audio metadata using FFprobe
 */
async function getAudioMetadata(audioPath) {
    return new Promise((resolve, reject) => {
        const ffprobe = spawn('ffprobe', [
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            '-show_streams',
            audioPath
        ]);
        let output = '';
        ffprobe.stdout.on('data', (data) => output += data);
        ffprobe.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`FFprobe failed with code ${code}`));
                return;
            }
            const metadata = JSON.parse(output);
            const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');
            resolve({
                duration: parseFloat(metadata.format.duration),
                sampleRate: parseInt(audioStream.sample_rate)
            });
        });
    });
}
/**
 * Decode audio to PCM using FFmpeg
 */
async function decodeAudioToPCM(audioPath, targetSampleRate) {
    const tempPCM = join('/tmp', `audio-pcm-${Date.now()}.raw`);
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
            '-i', audioPath,
            '-f', 'f32le', // 32-bit float PCM
            '-acodec', 'pcm_f32le',
            '-ac', '1', // Mono
            '-ar', String(targetSampleRate),
            tempPCM
        ]);
        ffmpeg.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`FFmpeg decode failed with code ${code}`));
                return;
            }
            // Read PCM data
            const buffer = readFileSync(tempPCM);
            const samples = [];
            // Convert buffer to float32 array
            for (let i = 0; i < buffer.length; i += 4) {
                samples.push(buffer.readFloatLE(i));
            }
            // Cleanup
            unlinkSync(tempPCM);
            resolve(samples);
        });
        ffmpeg.on('error', reject);
    });
}
/**
 * Extract frequency bands from audio frame
 */
function extractFrequencyBands(frame, sampleRate) {
    // Simple FFT-like energy calculation by frequency ranges
    // For MVP, we'll use a simplified approach
    // In production, use proper FFT (consider using fft.js library)
    const frameLength = frame.length;
    const nyquist = sampleRate / 2;
    // Calculate energy in frequency bands
    // This is a simplified approximation - for production, use real FFT
    const bass = calculateBandEnergy(frame, 0, 250 / nyquist);
    const lowMid = calculateBandEnergy(frame, 250 / nyquist, 500 / nyquist);
    const mid = calculateBandEnergy(frame, 500 / nyquist, 2000 / nyquist);
    const highMid = calculateBandEnergy(frame, 2000 / nyquist, 4000 / nyquist);
    const high = calculateBandEnergy(frame, 4000 / nyquist, 1.0);
    return { bass, lowMid, mid, highMid, high };
}
/**
 * Calculate energy in a frequency band (simplified)
 */
function calculateBandEnergy(frame, freqStart, freqEnd) {
    let energy = 0;
    const startIdx = Math.floor(freqStart * frame.length);
    const endIdx = Math.ceil(freqEnd * frame.length);
    for (let i = startIdx; i < endIdx && i < frame.length; i++) {
        energy += Math.abs(frame[i]);
    }
    return energy / (endIdx - startIdx);
}
/**
 * Detect beats using onset detection (spectral flux peaks)
 */
function detectBeats(spectralFlux, fps) {
    const beats = [];
    const threshold = 0.1; // Minimum spectral flux for beat
    const minTimeBetweenBeats = 0.1; // Minimum 100ms between beats
    for (let i = 1; i < spectralFlux.length - 1; i++) {
        const current = spectralFlux[i];
        const prev = spectralFlux[i - 1];
        const next = spectralFlux[i + 1];
        // Peak detection
        if (current > threshold && current > prev && current > next) {
            const time = i / fps;
            // Check minimum time between beats
            if (beats.length === 0 || time - beats[beats.length - 1].time >= minTimeBetweenBeats) {
                beats.push({
                    time,
                    confidence: Math.min(current, 1.0)
                });
            }
        }
    }
    return beats;
}
/**
 * Estimate tempo from detected beats
 */
function estimateTempo(beats, duration) {
    if (beats.length < 2)
        return 120; // Default tempo
    // Calculate intervals between beats
    const intervals = [];
    for (let i = 1; i < beats.length; i++) {
        intervals.push(beats[i].time - beats[i - 1].time);
    }
    // Find median interval
    intervals.sort((a, b) => a - b);
    const medianInterval = intervals[Math.floor(intervals.length / 2)];
    // Convert interval to BPM
    const bpm = 60 / medianInterval;
    // Sanity check (typical music is 60-200 BPM)
    if (bpm < 60)
        return bpm * 2;
    if (bpm > 200)
        return bpm / 2;
    return Math.round(bpm);
}
/**
 * Normalize feature array to 0-1 range
 */
export function normalizeFeature(values) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    if (range === 0)
        return values.map(() => 0.5);
    return values.map(v => (v - min) / range);
}
//# sourceMappingURL=deep-audio-analyzer.js.map