// Particle Flow Field GLSL Shader
// GPU-accelerated particle system with Perlin noise flow fields

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

// Hash functions for pseudo-random
float hash(float n) {
    return fract(sin(n) * 43758.5453123);
}

vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)),
             dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// 2D Perlin noise for flow field
float perlin2D(vec2 p) {
    vec2 pi = floor(p);
    vec2 pf = p - pi;

    vec2 w = pf * pf * (3.0 - 2.0 * pf);

    float a = dot(pf - vec2(0, 0), hash2(pi + vec2(0, 0)));
    float b = dot(pf - vec2(1, 0), hash2(pi + vec2(1, 0)));
    float c = dot(pf - vec2(0, 1), hash2(pi + vec2(0, 1)));
    float d = dot(pf - vec2(1, 1), hash2(pi + vec2(1, 1)));

    return mix(mix(a, b, w.x), mix(c, d, w.x), w.y);
}

// Flow field based on Perlin noise
vec2 flowField(vec2 p, float t) {
    float angle = perlin2D(p * 0.5 + vec2(t * 0.1)) * 6.28318;
    return vec2(cos(angle), sin(angle));
}

// Simulate particle at position based on flow field
vec2 traceParticle(vec2 startPos, float particleId, float t) {
    vec2 pos = startPos;
    float timeOffset = hash(particleId) * 100.0;
    float effectiveTime = t + timeOffset;

    // Audio-reactive flow strength
    float flowStrength = 0.5 + iAudioMid * 1.5;

    // Trace particle through flow field
    const int steps = 20;
    for (int i = 0; i < steps; i++) {
        vec2 flow = flowField(pos, effectiveTime);
        pos += flow * 0.02 * flowStrength;
    }

    // Bass creates turbulence
    pos += vec2(
        sin(effectiveTime * 2.0 + particleId) * iAudioBass * 0.3,
        cos(effectiveTime * 2.0 + particleId) * iAudioBass * 0.3
    );

    return pos;
}

// Render particle density field
float particleDensity(vec2 uv) {
    float density = 0.0;

    // Number of particles scales with energy
    int particleCount = int(200.0 + iAudioEnergy * 300.0);

    for (int i = 0; i < 500; i++) {
        if (i >= particleCount) break;

        float id = float(i);

        // Initial position (hash-based)
        vec2 startPos = vec2(
            hash(id * 12.345) * 2.0 - 1.0,
            hash(id * 23.456) * 2.0 - 1.0
        ) * 2.0;

        // Trace particle
        vec2 particlePos = traceParticle(startPos, id, iTime);

        // Distance to current pixel
        float dist = length(uv - particlePos);

        // Particle size scales with high frequencies
        float particleSize = 0.02 + iAudioHigh * 0.05;

        // Transients create bright flashes
        float brightness = 1.0 + iAudioTransient * 3.0;

        // Soft circular particles
        float particle = smoothstep(particleSize, 0.0, dist) * brightness;
        density += particle;
    }

    return density;
}

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= iResolution.x / iResolution.y;

    // Calculate particle density
    float density = particleDensity(p);

    // Add glow/bloom effect
    float glow = 0.0;
    const int glowSamples = 8;
    for (int i = 0; i < glowSamples; i++) {
        float angle = float(i) * 6.28318 / float(glowSamples);
        vec2 offset = vec2(cos(angle), sin(angle)) * 0.03;
        glow += particleDensity(p + offset);
    }
    glow /= float(glowSamples);
    glow *= 0.5;

    float totalBrightness = density + glow;

    // Color gradient based on density
    vec3 color;
    if (totalBrightness < 0.3) {
        color = mix(iColorPrimary * 0.1, iColorPrimary, totalBrightness / 0.3);
    } else if (totalBrightness < 0.7) {
        color = mix(iColorPrimary, iColorSecondary, (totalBrightness - 0.3) / 0.4);
    } else {
        color = mix(iColorSecondary, iColorAccent, (totalBrightness - 0.7) / 0.3);
    }

    // Bass adds color saturation
    color = mix(vec3(length(color)), color, 0.7 + iAudioBass * 0.3);

    // Intensity control
    color = mix(vec3(0.0), color, iIntensity);

    fragColor = vec4(color, 1.0);
}
