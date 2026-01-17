/**
 * GPU Shader Video Renderer using headless-gl (Native WebGL)
 *
 * This replaces the Puppeteer-based renderer with native WebGL rendering
 * for better stability and performance.
 */
import { createCanvas } from 'canvas';
import gl from 'gl';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
/**
 * Main render function - renders shader video using headless WebGL
 */
export async function renderShaderVideo(config, outputPath) {
    const { duration, width, height, fps } = config;
    const totalFrames = Math.ceil(duration * fps);
    // Create temp directory for frames
    const tempDir = join('/tmp', `shader-render-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
    console.log(`[Headless GL] Rendering ${totalFrames} frames at ${width}x${height}...`);
    // Create WebGL context (native, no browser!)
    const glContext = gl(width, height);
    if (!glContext) {
        throw new Error('Failed to create WebGL context');
    }
    console.log(`[Headless GL] WebGL context created successfully`);
    // Get fragment shader code
    const fragmentShader = getFragmentShader(config.shaderType);
    // Compile shaders
    const program = createShaderProgram(glContext, fragmentShader);
    if (!program) {
        throw new Error('Failed to compile shader program');
    }
    // Set up geometry (fullscreen quad)
    setupGeometry(glContext, program);
    // Get uniform locations
    const uniforms = {
        time: glContext.getUniformLocation(program, 'time'),
        resolution: glContext.getUniformLocation(program, 'resolution'),
        primaryColor: glContext.getUniformLocation(program, 'primaryColor'),
        secondaryColor: glContext.getUniformLocation(program, 'secondaryColor'),
        accentColor: glContext.getUniformLocation(program, 'accentColor'),
        intensity: glContext.getUniformLocation(program, 'intensity'),
    };
    // Set static uniforms
    glContext.uniform2f(uniforms.resolution, width, height);
    glContext.uniform3fv(uniforms.primaryColor, hexToRGB(config.colors.primary));
    glContext.uniform3fv(uniforms.secondaryColor, hexToRGB(config.colors.secondary));
    glContext.uniform3fv(uniforms.accentColor, hexToRGB(config.colors.accent));
    glContext.uniform1f(uniforms.intensity, config.intensity);
    console.log(`[Headless GL] Shaders compiled, uniforms set`);
    // Render frames
    for (let frame = 0; frame < totalFrames; frame++) {
        const time = frame / fps;
        // Update time uniform
        glContext.uniform1f(uniforms.time, time);
        // Clear and render
        glContext.viewport(0, 0, width, height);
        glContext.clearColor(0, 0, 0, 1);
        glContext.clear(glContext.COLOR_BUFFER_BIT);
        glContext.drawArrays(glContext.TRIANGLE_STRIP, 0, 4);
        // Read pixels
        const pixels = new Uint8Array(width * height * 4);
        glContext.readPixels(0, 0, width, height, glContext.RGBA, glContext.UNSIGNED_BYTE, pixels);
        // Create canvas and write PNG
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(width, height);
        // Flip Y axis (WebGL is bottom-up, canvas is top-down)
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const srcIdx = ((height - y - 1) * width + x) * 4;
                const dstIdx = (y * width + x) * 4;
                imageData.data[dstIdx] = pixels[srcIdx];
                imageData.data[dstIdx + 1] = pixels[srcIdx + 1];
                imageData.data[dstIdx + 2] = pixels[srcIdx + 2];
                imageData.data[dstIdx + 3] = pixels[srcIdx + 3];
            }
        }
        ctx.putImageData(imageData, 0, 0);
        // Save frame
        const framePath = join(tempDir, `frame_${String(frame).padStart(6, '0')}.png`);
        writeFileSync(framePath, canvas.toBuffer('image/png'));
        if (frame % 30 === 0) {
            console.log(`[Headless GL] Rendered frame ${frame}/${totalFrames} (${Math.round(frame / totalFrames * 100)}%)`);
        }
    }
    console.log(`[Headless GL] Encoding video with FFmpeg...`);
    // Encode frames to video using FFmpeg
    await encodeFramesToVideo(tempDir, outputPath, fps);
    console.log(`[Headless GL] Shader video rendered: ${outputPath}`);
}
/**
 * Encode PNG frames to video using FFmpeg
 */
function encodeFramesToVideo(framesDir, outputPath, fps) {
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
            '-y',
            '-framerate', String(fps),
            '-i', join(framesDir, 'frame_%06d.png'),
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '20',
            '-pix_fmt', 'yuv420p',
            outputPath
        ]);
        ffmpeg.stderr.on('data', (data) => {
            // Suppress FFmpeg output
        });
        ffmpeg.on('close', (code) => {
            if (code === 0) {
                resolve();
            }
            else {
                reject(new Error(`FFmpeg exited with code ${code}`));
            }
        });
        ffmpeg.on('error', reject);
    });
}
/**
 * Create shader program from vertex and fragment shaders
 */
function createShaderProgram(gl, fragmentShaderSource) {
    // Vertex shader (simple fullscreen quad)
    const vertexShaderSource = `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;
    // Create vertex shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('Vertex shader error:', gl.getShaderInfoLog(vertexShader));
        return null;
    }
    // Add precision and uniforms to fragment shader
    const fullFragmentShader = `
    precision highp float;
    uniform float time;
    uniform vec2 resolution;
    uniform vec3 primaryColor;
    uniform vec3 secondaryColor;
    uniform vec3 accentColor;
    uniform float intensity;

    ${fragmentShaderSource}
  `;
    // Create fragment shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fullFragmentShader);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('Fragment shader error:', gl.getShaderInfoLog(fragmentShader));
        return null;
    }
    // Create program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return null;
    }
    gl.useProgram(program);
    return program;
}
/**
 * Set up geometry for fullscreen quad
 */
function setupGeometry(gl, program) {
    const positions = new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        1, 1,
    ]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
}
/**
 * Convert hex color to RGB float array
 */
function hexToRGB(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return new Float32Array([r, g, b]);
}
/**
 * Get fragment shader code for the specified shader type
 */
function getFragmentShader(shaderType) {
    switch (shaderType) {
        case 'perlin-noise':
            return getPerlinNoiseShader();
        case 'particle-flow':
            return getParticleFlowShader();
        case 'fractal-mandelbrot':
            return getFractalMandelbrotShader();
        case 'voronoi-cells':
            return getVoronoiCellsShader();
        case 'reaction-diffusion':
            return getReactionDiffusionShader();
        default:
            return getPerlinNoiseShader();
    }
}
/**
 * Perlin Noise Shader - Organic flowing patterns
 */
function getPerlinNoiseShader() {
    return `
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

    // Fractal Brownian Motion
    float fbm(vec3 p, int octaves) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;

      for (int i = 0; i < 6; i++) {
        if (i >= octaves) break;
        value += amplitude * perlin3D(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
      }

      return value;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / resolution;
      vec2 p = uv * 2.0 - 1.0;
      p.x *= resolution.x / resolution.y;

      // Audio-reactive time scaling
      float timeScale = 0.3 + intensity * 0.7;
      float t = time * timeScale;

      // Spatial distortion
      vec2 distortion = vec2(
        sin(p.y * 3.0 + t * 0.5) * 0.1 * intensity,
        cos(p.x * 3.0 + t * 0.5) * 0.1 * intensity
      );
      p += distortion;

      // Multi-octave Perlin noise
      vec3 noisePos = vec3(p * 2.0, t * 0.2);
      float midScale = 1.0 + intensity * 2.0;
      noisePos *= midScale;

      float noise = fbm(noisePos, 6);

      // Add detail layer
      float detailNoise = perlin3D(vec3(p * 8.0, t * 0.5)) * intensity;
      noise += detailNoise * 0.3;

      // Normalize to 0-1
      noise = noise * 0.5 + 0.5;
      noise = clamp(noise, 0.0, 1.0);

      // Color mapping with 3-color palette
      vec3 color;
      if (noise < 0.33) {
        color = mix(secondaryColor, primaryColor, noise * 3.0);
      } else if (noise < 0.66) {
        color = mix(primaryColor, accentColor, (noise - 0.33) * 3.0);
      } else {
        color = mix(accentColor, primaryColor, (noise - 0.66) * 3.0);
      }

      // Add subtle glow
      color += vec3(0.05) * intensity;

      gl_FragColor = vec4(color, 1.0);
    }
  `;
}
// Placeholder for other shaders (we'll use the same ones as Puppeteer version)
function getParticleFlowShader() {
    return getPerlinNoiseShader(); // TODO: Copy from gpu-shader-renderer.ts
}
function getFractalMandelbrotShader() {
    return getPerlinNoiseShader(); // TODO: Copy from gpu-shader-renderer.ts
}
function getVoronoiCellsShader() {
    return getPerlinNoiseShader(); // TODO: Copy from gpu-shader-renderer.ts
}
function getReactionDiffusionShader() {
    return getPerlinNoiseShader(); // TODO: Copy from gpu-shader-renderer.ts
}
//# sourceMappingURL=headless-gl-renderer.js.map