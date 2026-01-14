// Audio-Reactive Voronoi Cells GLSL Shader
// Organic cellular patterns with dynamic movement

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

// Hash function for pseudo-random
vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)),
             dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453123);
}

// Smooth minimum for organic blending
float smin(float a, float b, float k) {
    float h = max(k - abs(a - b), 0.0) / k;
    return min(a, b) - h * h * k * 0.25;
}

// Voronoi distance field
vec3 voronoi(vec2 p) {
    vec2 n = floor(p);
    vec2 f = fract(p);

    float minDist = 8.0;
    vec2 minPoint = vec2(0.0);

    // Search neighboring cells
    for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j));
            vec2 o = hash2(n + g);

            // Animate cell points
            o = 0.5 + 0.5 * sin(iTime * 0.5 + 6.28318 * o);

            // Audio makes cells pulse
            o += vec2(
                sin(iTime + o.x * 6.28) * iAudioBass * 0.3,
                cos(iTime + o.y * 6.28) * iAudioBass * 0.3
            );

            vec2 r = g + o - f;
            float d = length(r);

            if (d < minDist) {
                minDist = d;
                minPoint = n + g + o;
            }
        }
    }

    return vec3(minDist, minPoint);
}

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec2 p = (uv * 2.0 - 1.0);
    p.x *= iResolution.x / iResolution.y;

    // Audio-reactive scale
    float scale = 4.0 + iAudioEnergy * 6.0;
    p *= scale;

    // Mid frequencies add rotation
    float angle = iTime * 0.2 + iAudioMid * 1.0;
    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    p = rot * p;

    // Calculate Voronoi
    vec3 vor = voronoi(p);
    float dist = vor.x;
    vec2 cellId = vor.yz;

    // Get cell color based on ID
    vec2 cellHash = hash2(cellId);

    // Assign colors to cells
    vec3 cellColor;
    if (cellHash.x < 0.33) {
        cellColor = iColorPrimary;
    } else if (cellHash.x < 0.66) {
        cellColor = iColorSecondary;
    } else {
        cellColor = iColorAccent;
    }

    // Cell brightness varies
    cellColor *= 0.7 + cellHash.y * 0.5;

    // Edge detection (cell borders)
    float edgeWidth = 0.05 + iAudioHigh * 0.1;
    float edge = smoothstep(edgeWidth, 0.0, dist);

    // Edge color (bright accent)
    vec3 edgeColor = iColorAccent * (1.5 + iAudioTransient * 2.0);

    // Mix cell and edge colors
    vec3 color = mix(cellColor, edgeColor, edge);

    // Energy-based brightness boost
    color *= 0.8 + iAudioEnergy * 0.4;

    // Add subtle glow
    float glow = exp(-dist * 8.0) * 0.3;
    color += glow * iColorSecondary;

    // Intensity control
    color = mix(vec3(0.0), color, iIntensity);

    fragColor = vec4(color, 1.0);
}
