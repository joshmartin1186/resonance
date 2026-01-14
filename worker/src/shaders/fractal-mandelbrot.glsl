// Audio-Reactive Mandelbrot Fractal GLSL Shader
// Dynamic fractal zooming and morphing synchronized to music

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

// Mandelbrot iteration
int mandelbrot(vec2 c, int maxIter) {
    vec2 z = vec2(0.0);
    int iter = 0;

    for (int i = 0; i < maxIter; i++) {
        if (dot(z, z) > 4.0) break;

        // z = z² + c
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        iter++;
    }

    return iter;
}

// Smooth iteration count for better gradients
float smoothMandelbrot(vec2 c, int maxIter) {
    vec2 z = vec2(0.0);
    int iter = 0;

    for (int i = 0; i < maxIter; i++) {
        if (dot(z, z) > 256.0) break;

        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        iter++;
    }

    if (iter == maxIter) return float(maxIter);

    // Smooth coloring
    float zn = length(z);
    return float(iter) + 1.0 - log2(log2(zn));
}

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec2 p = (uv * 2.0 - 1.0);
    p.x *= iResolution.x / iResolution.y;

    // Audio-reactive zoom
    float zoom = 0.5 + iTime * 0.05;
    zoom *= exp(-iAudioEnergy * 0.5); // Energy zooms in

    // Bass-driven rotation
    float angle = iTime * 0.1 + iAudioBass * 3.14159;
    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    p = rot * p;

    // Dynamic center point (explores different regions)
    vec2 center = vec2(
        -0.5 + sin(iTime * 0.1) * 0.3,
        0.0 + cos(iTime * 0.15) * 0.3
    );

    // Mid frequencies shift the view
    center.x += (iAudioMid - 0.5) * 0.2;
    center.y += (iAudioHigh - 0.5) * 0.2;

    // Calculate Mandelbrot coordinate
    vec2 c = p * zoom + center;

    // Max iterations based on zoom (more detail when zoomed in)
    int maxIter = int(50.0 + 150.0 * (1.0 - zoom));
    maxIter = min(maxIter, 200);

    // Calculate smooth iteration count
    float iter = smoothMandelbrot(c, maxIter);

    // Normalize to 0-1
    float t = iter / float(maxIter);

    // Transient beats create color shifts
    t = fract(t + iAudioTransient * 0.5);

    // Multi-color gradient
    vec3 color;

    if (t < 0.33) {
        color = mix(iColorPrimary, iColorSecondary, t * 3.0);
    } else if (t < 0.66) {
        color = mix(iColorSecondary, iColorAccent, (t - 0.33) * 3.0);
    } else {
        color = mix(iColorAccent, iColorPrimary, (t - 0.66) * 3.0);
    }

    // Interior coloring (black hole effect)
    if (iter >= float(maxIter) - 0.5) {
        color = vec3(0.0);
    }

    // Energy-based brightness
    color *= 0.8 + iAudioEnergy * 0.4;

    // Intensity control
    color = mix(vec3(0.0), color, iIntensity);

    fragColor = vec4(color, 1.0);
}
