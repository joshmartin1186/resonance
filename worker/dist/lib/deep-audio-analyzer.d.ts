/**
 * Deep Audio Analysis - Extract detailed features for music reactivity
 *
 * Uses Meyda for real-time audio feature extraction
 * Extracts 30fps time-series data for all audio features
 */
export interface DeepAudioFeatures {
    duration: number;
    sampleRate: number;
    tempo: number;
    rms: number[];
    zcr: number[];
    spectralCentroid: number[];
    spectralRolloff: number[];
    spectralFlux: number[];
    bass: number[];
    lowMid: number[];
    mid: number[];
    highMid: number[];
    high: number[];
    mfcc: number[][];
    chroma: number[][];
    beats: Beat[];
    loudness: number[];
    energy: number[];
}
export interface Beat {
    time: number;
    confidence: number;
}
/**
 * Analyze audio file and extract deep features at 30fps
 */
export declare function analyzeAudioDeep(audioPath: string): Promise<DeepAudioFeatures>;
/**
 * Normalize feature array to 0-1 range
 */
export declare function normalizeFeature(values: number[]): number[];
//# sourceMappingURL=deep-audio-analyzer.d.ts.map