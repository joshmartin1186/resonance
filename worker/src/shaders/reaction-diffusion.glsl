// Reaction-Diffusion System GLSL Shader
// Organic pattern generation like coral, cells, or tiger stripes

#version 330

uniform vec2 iResolution;
uniform float iTime;
uniform float iAudioEnergy;
uniform float iAudioBass;
uniform float iAudioMid;
uniform float iAudioHigh;
uniform float iAudioTransient;
uniform vec3 iColorPrimary;
uniform vec3 iColorSecondary;
uniform vec3 iColorAccent;
uniform float iIntensity;

out vec4 fragColor;

// Hash for pseudo-random
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// Simplified reaction-diffusion (Gray-Scott model simulation)
// We approximate the pattern without full simulation for real-time rendering
float reactionDiffusion(vec2 p, float t) {
    float scale = 10.0;
    p *= scale;

    // Create organic flowing patterns using layered sine waves
    float pattern = 0.0;

    // Layer 1: Base cellular structure
    pattern += sin(p.x * 0.5 + t * 0.3) * cos(p.y * 0.5 + t * 0.2);

    // Layer 2: Detail from cross-influence
    pattern += sin(p.x * 1.5 + sin(p.y * 0.8 + t * 0.5) * 2.0) * 0.5;
    pattern += cos(p.y * 1.5 + sin(p.x * 0.8 + t * 0.5) * 2.0) * 0.5;

    // Layer 3: High frequency detail
    pattern += sin(p.x * 3.0 + p.y * 2.0 + t) * 0.25;

    // Normalize
    pattern = pattern * 0.5 + 0.5;

    // Add noise for organic feel
    float noise = hash(floor(p * 5.0) + vec2(t * 0.1));
    pattern = mix(pattern, noise, 0.1);

    return pattern;
}

// Multi-scale reaction-diffusion
float multiScaleRD(vec2 p, float t) {
    float rd1 = reactionDiffusion(p, t);
    float rd2 = reactionDiffusion(p * 2.0, t * 1.5);
    float rd3 = reactionDiffusion(p * 0.5, t * 0.7);

    return rd1 * 0.5 + rd2 * 0.3 + rd3 * 0.2;
}

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec2 p = (uv * 2.0 - 1.0);
    p.x *= iResolution.x / iResolution.y;

    // Audio-reactive time scaling
    float timeScale = 1.0 + iAudioEnergy * 2.0;
    float t = iTime * 0.5 * timeScale;

    // Bass adds warping
    vec2 warp = vec2(
        sin(p.y * 2.0 + t) * iAudioBass * 0.3,
        cos(p.x * 2.0 + t) * iAudioBass * 0.3
    );
    p += warp;

    // Calculate reaction-diffusion pattern
    float pattern = multiScaleRD(p, t);

    // Mid frequencies affect threshold
    float threshold = 0.5 + (iAudioMid - 0.5) * 0.3;

    // Create sharp transitions for cellular effect
    float cells = smoothstep(threshold - 0.1, threshold + 0.1, pattern);

    // Transients create flashes
    cells += iAudioTransient * 0.3;
    cells = clamp(cells, 0.0, 1.0);

    // Edge detection for pattern borders
    vec2 pixelSize = 1.0 / iResolution.xy;
    float dx = multiScaleRD(p + vec2(pixelSize.x, 0.0), t) -
               multiScaleRD(p - vec2(pixelSize.x, 0.0), t);
    float dy = multiScaleRD(p + vec2(0.0, pixelSize.y), t) -
               multiScaleRD(p - vec2(0.0, pixelSize.y), t);
    float edge = length(vec2(dx, dy)) * 10.0;

    // High frequencies make edges glow
    edge *= 1.0 + iAudioHigh * 2.0;

    // Color the pattern
    vec3 color1 = iColorPrimary;
    vec3 color2 = iColorSecondary;
    vec3 color3 = iColorAccent;

    vec3 color = mix(color1, color2, cells);

    // Add bright edges
    color += color3 * edge;

    // Energy-based brightness
    color *= 0.7 + iAudioEnergy * 0.5;

    // Intensity control
    color = mix(vec3(0.0), color, iIntensity);

    fragColor = vec4(color, 1.0);
}
