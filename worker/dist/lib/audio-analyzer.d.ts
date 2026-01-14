export interface AudioFeatures {
    duration: number;
    sampleRate: number;
    channels: number;
    bitrate: number | undefined;
    format: string | undefined;
    tempo: number;
    beats: number[];
    timeSignature: string;
    key: {
        note: string;
        scale: 'major' | 'minor';
        confidence: number;
    };
    loudness: {
        integrated: number;
        range: number;
        peak: number;
    };
    dynamicRange: number;
    sections: Section[];
    energyCurve: number[];
    spectral: {
        centroid: number;
        rolloff: number;
        flux: number;
    };
}
export interface Section {
    type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'instrumental';
    startTime: number;
    endTime: number;
    energy: number;
}
export interface AnalysisProgress {
    stage: string;
    progress: number;
}
type ProgressCallback = (progress: AnalysisProgress) => void;
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
export declare function analyzeAudio(audioUrl: string, onProgress?: ProgressCallback): Promise<AudioFeatures>;
/**
 * Detect subtle cues in the audio (breath, vibrato, silence)
 * This would use more sophisticated analysis in production
 */
export declare function detectSubtleCues(features: AudioFeatures): {
    breaths: number[];
    vibrato: Array<{
        start: number;
        end: number;
        intensity: number;
    }>;
    silences: Array<{
        start: number;
        end: number;
    }>;
};
export {};
//# sourceMappingURL=audio-analyzer.d.ts.map