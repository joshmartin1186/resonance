/**
 * Node System - Foundation for Infinite Complexity
 *
 * Architecture:
 * - Generator nodes: Create base visual patterns
 * - Effect nodes: Transform and enhance visuals
 * - Composition nodes: Combine multiple layers
 * - Control params: Audio-reactive or evolving parameters
 *
 * The AI orchestrator commands these nodes to create 100+ unique visual states
 */
/**
 * Evaluate a control parameter at current time/audio state
 */
export function evaluateParam(param, time, duration, audioFeatures, audioFrame) {
    switch (param.type) {
        case 'static':
            return param.value ?? 0;
        case 'evolving': {
            const progress = time / duration;
            const start = param.startValue ?? 0;
            const end = param.endValue ?? 1;
            const curve = param.curve ?? 'linear';
            let t = progress;
            switch (curve) {
                case 'ease-in':
                    t = t * t;
                    break;
                case 'ease-out':
                    t = 1 - (1 - t) * (1 - t);
                    break;
                case 'sine':
                    t = Math.sin(t * Math.PI / 2);
                    break;
                case 'bounce':
                    t = Math.sin(t * Math.PI * 4) * (1 - t) + t;
                    break;
            }
            return start + (end - start) * t;
        }
        case 'audio-reactive': {
            if (!param.audioSource)
                return 0;
            let rawValue = 0;
            const source = param.audioSource;
            // Extract audio value at current frame
            if (audioFrame < 0)
                return 0;
            switch (source.type) {
                case 'rms':
                    rawValue = audioFeatures.rms[audioFrame] ?? 0;
                    break;
                case 'bass':
                    rawValue = audioFeatures.bass[audioFrame] ?? 0;
                    break;
                case 'mid':
                    rawValue = audioFeatures.mid[audioFrame] ?? 0;
                    break;
                case 'high':
                    rawValue = audioFeatures.high[audioFrame] ?? 0;
                    break;
                case 'spectralCentroid':
                    rawValue = audioFeatures.spectralCentroid[audioFrame] ?? 0;
                    break;
                case 'spectralFlux':
                    rawValue = audioFeatures.spectralFlux[audioFrame] ?? 0;
                    break;
                case 'beat': {
                    // Find closest beat within 0.1s
                    const currentTime = audioFrame / 30; // 30fps
                    const closestBeat = audioFeatures.beats.find(b => Math.abs(b.time - currentTime) < 0.1);
                    rawValue = closestBeat ? closestBeat.confidence : 0;
                    break;
                }
                case 'mfcc':
                    rawValue = audioFeatures.mfcc[audioFrame]?.[source.coefficient] ?? 0;
                    break;
                case 'chroma':
                    rawValue = audioFeatures.chroma[audioFrame]?.[source.note] ?? 0;
                    break;
            }
            // Apply smoothing (simple exponential moving average)
            // Note: This is a simplified smoothing. For proper smoothing, we'd need to maintain state
            // For now, just use the raw value without recursion
            // Map to target range
            const [min, max] = param.audioRange ?? [0, 1];
            return min + rawValue * (max - min);
        }
    }
}
/**
 * Calculate node opacity based on fade in/out
 */
export function calculateNodeOpacity(node, time) {
    if (!node.enabled)
        return 0;
    if (time < node.startTime || time > node.endTime)
        return 0;
    let opacity = 1;
    // Fade in
    if (node.fadeIn && time < node.startTime + node.fadeIn) {
        opacity = (time - node.startTime) / node.fadeIn;
    }
    // Fade out
    if (node.fadeOut && time > node.endTime - node.fadeOut) {
        opacity = (node.endTime - time) / node.fadeOut;
    }
    return Math.max(0, Math.min(1, opacity));
}
//# sourceMappingURL=types.js.map