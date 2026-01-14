// Perlin Noise GLSL Shader
// Generates organic, flowing noise patterns with audio reactivity

#version 330

uniform vec2 iResolution;
uniform float iTime;
uniform float iAudioEnergy;      // 0-1 audio energy
uniform float iAudioBass;        // 0-1 bass frequency
uniform float iAudioMid;         // 0-1 mid frequency
uniform float iAudioHigh;        // 0-1 high frequency
uniform float iAudioTransient;   // 0-1 transient/beat detection
uniform vec3 iColorPrimary;      // Primary color
uniform vec3 iColorSecondary;    // Secondary color
uniform vec3 iColorAccent;       // Accent color
uniform float iIntensity;        // Effect intensity 0-1

out vec4 fragColor;

// Perlin noise hash function
vec3 hash3(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// 3D Perlin noise
float perlin3D(vec3 p) {
    vec3 pi = floor(p);
    vec3 pf = p - pi;

    vec3 w = pf * pf * (3.0 - 2.0 * pf);

    return mix(
        mix(
            mix(dot(pf - vec3(0, 0, 0), hash3(pi + vec3(0, 0, 0))),
                dot(pf - vec3(1, 0, 0), hash3(pi + vec3(1, 0, 0))), w.x),
            mix(dot(pf - vec3(0, 1, 0), hash3(pi + vec3(0, 1, 0))),
                dot(pf - vec3(1, 1, 0), hash3(pi + vec3(1, 1, 0))), w.x), w.y),
        mix(
            mix(dot(pf - vec3(0, 0, 1), hash3(pi + vec3(0, 0, 1))),
                dot(pf - vec3(1, 0, 1), hash3(pi + vec3(1, 0, 1))), w.x),
            mix(dot(pf - vec3(0, 1, 1), hash3(pi + vec3(0, 1, 1))),
                dot(pf - vec3(1, 1, 1), hash3(pi + vec3(1, 1, 1))), w.x), w.y), w.z);
}

// Fractal Brownian Motion (layered noise)
float fbm(vec3 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < octaves; i++) {
        value += amplitude * perlin3D(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }

    return value;
}

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= iResolution.x / iResolution.y;

    // Audio-reactive time scaling
    float timeScale = 0.3 + iAudioEnergy * 0.7;
    float t = iTime * timeScale;

    // Bass-driven spatial distortion
    vec2 distortion = vec2(
        sin(p.y * 3.0 + t * 0.5 + iAudioBass * 6.28) * 0.1 * iAudioBass,
        cos(p.x * 3.0 + t * 0.5 + iAudioBass * 6.28) * 0.1 * iAudioBass
    );
    p += distortion;

    // Multi-octave Perlin noise
    int octaves = 6;
    vec3 noisePos = vec3(p * 2.0, t * 0.2);

    // Mid frequencies affect noise scale
    float midScale = 1.0 + iAudioMid * 2.0;
    noisePos *= midScale;

    float noise = fbm(noisePos, octaves);

    // High frequencies add detail layer
    float detailNoise = perlin3D(vec3(p * 8.0, t * 0.5)) * iAudioHigh;
    noise += detailNoise * 0.3;

    // Normalize noise to 0-1
    noise = noise * 0.5 + 0.5;

    // Transient/beat detection creates flashes
    float flash = iAudioTransient * 0.3;
    noise = clamp(noise + flash, 0.0, 1.0);

    // Color mapping with smooth gradients
    vec3 color1 = iColorPrimary;
    vec3 color2 = iColorSecondary;
    vec3 color3 = iColorAccent;

    // Multi-stop gradient
    vec3 color;
    if (noise < 0.5) {
        color = mix(color1, color2, noise * 2.0);
    } else {
        color = mix(color2, color3, (noise - 0.5) * 2.0);
    }

    // Energy-based brightness boost
    float brightness = 1.0 + iAudioEnergy * 0.5;
    color *= brightness;

    // Intensity control
    color = mix(vec3(0.5), color, iIntensity);

    fragColor = vec4(color, 1.0);
}
