/**
 * GPU-accelerated shader renderer using headless Chrome + WebGL
 *
 * This renderer creates actual GPU-rendered shader videos instead of
 * using slow CPU-based FFmpeg geq filters.
 */

import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';

export interface ShaderRenderConfig {
  shaderType: 'perlin-noise' | 'particle-flow' | 'fractal-mandelbrot' | 'voronoi-cells' | 'reaction-diffusion';
  duration: number;
  width: number;
  height: number;
  fps: number;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  intensity: number;
  audioFeatures?: {
    energyCurve: number[];
    bassCurve: number[];
    midCurve: number[];
    highCurve: number[];
  };
}

/**
 * Render a shader to a video file using WebGL
 */
export async function renderShaderVideo(
  config: ShaderRenderConfig,
  outputPath: string
): Promise<void> {
  const { duration, width, height, fps } = config;
  const totalFrames = Math.ceil(duration * fps);

  // Create temp directory for frames
  const tempDir = join('/tmp', `shader-render-${Date.now()}`);
  mkdirSync(tempDir, { recursive: true });

  console.log(`[GPU Shader] Rendering ${totalFrames} frames at ${width}x${height}...`);

  const html = generateShaderHTML(config);
  const RESTART_INTERVAL = 15; // Restart browser every 15 frames to prevent crashes on Mac

  let browser = null;
  let page = null;

  try {
    // Render frames with periodic browser restarts
    for (let frame = 0; frame < totalFrames; frame++) {
      // Restart browser every RESTART_INTERVAL frames to prevent memory issues
      if (frame % RESTART_INTERVAL === 0) {
        if (browser) {
          await browser.close();
        }

        // Launch browser
        // For Mac development: use visible browser (headless WebGL doesn't work on Mac)
        // For production Linux: use headless mode with SwiftShader
        const isLinux = process.platform === 'linux';

        browser = await puppeteer.launch({
          headless: isLinux ? true : false,
          args: isLinux ? [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--use-gl=swiftshader',
            '--enable-webgl',
            '--enable-webgl2'
          ] : [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--window-size=1920,1080',
            '--window-position=0,0'
          ]
        });

        page = await browser.newPage();
        await page.setViewport({ width, height });

        // Capture console logs
        page.on('console', msg => {
          const type = msg.type();
          if (type === 'error') {
            console.error(`[Browser Console Error] ${msg.text()}`);
          }
        });

        // Load shader HTML
        await page.setContent(html);
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for WebGL to initialize
      }

      const time = frame / fps;

      try {
        if (!page) {
          throw new Error('Browser page not initialized');
        }

        // Update shader uniforms
        await page.evaluate((t: number) => {
          // @ts-ignore - window.updateShaderTime is defined in the injected HTML
          window.updateShaderTime(t);
        }, time);

        // Capture frame
        const screenshot = await page.screenshot({
          type: 'png',
          omitBackground: false
        });

        const framePath = join(tempDir, `frame_${String(frame).padStart(6, '0')}.png`);
        writeFileSync(framePath, screenshot);

        if (frame % 30 === 0) {
          console.log(`[GPU Shader] Rendered frame ${frame}/${totalFrames} (${Math.round(frame/totalFrames*100)}%)`);
        }
      } catch (error) {
        console.error(`[GPU Shader] Error rendering frame ${frame}:`, error);
        throw new Error(`Failed to render frame ${frame}: ${error}`);
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log(`[GPU Shader] Encoding video with FFmpeg...`);

  // Encode frames to video using FFmpeg
  await encodeFramesToVideo(tempDir, outputPath, fps);

  console.log(`[GPU Shader] Shader video rendered: ${outputPath}`);
}

/**
 * Generate HTML page with WebGL shader
 */
function generateShaderHTML(config: ShaderRenderConfig): string {
  const { shaderType, width, height, colors, intensity } = config;

  const fragmentShader = getFragmentShader(shaderType);

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 0; overflow: hidden; }
    canvas { display: block; width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <canvas id="canvas" width="${width}" height="${height}"></canvas>
  <script>
    const canvas = document.getElementById('canvas');
    const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true }) ||
               canvas.getContext('webgl', { preserveDrawingBuffer: true }) ||
               canvas.getContext('experimental-webgl', { preserveDrawingBuffer: true });

    if (!gl) {
      console.error('WebGL not supported');
      window.updateShaderTime = function() { console.error('WebGL not available'); };
      throw new Error('WebGL not supported');
    }

    console.log('WebGL context initialized');

    // Vertex shader (simple fullscreen quad)
    const vertexShaderSource = \`
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    \`;

    // Fragment shader
    const fragmentShaderSource = \`
      precision highp float;
      uniform float time;
      uniform vec2 resolution;
      uniform vec3 primaryColor;
      uniform vec3 secondaryColor;
      uniform vec3 accentColor;
      uniform float intensity;

      ${fragmentShader}
    \`;

    // Compile shaders
    function createShader(gl, type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }

      return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
    }

    gl.useProgram(program);

    // Set up geometry (fullscreen quad)
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const timeLocation = gl.getUniformLocation(program, 'time');
    const resolutionLocation = gl.getUniformLocation(program, 'resolution');
    const primaryColorLocation = gl.getUniformLocation(program, 'primaryColor');
    const secondaryColorLocation = gl.getUniformLocation(program, 'secondaryColor');
    const accentColorLocation = gl.getUniformLocation(program, 'accentColor');
    const intensityLocation = gl.getUniformLocation(program, 'intensity');

    // Set uniforms
    gl.uniform2f(resolutionLocation, ${width}, ${height});
    gl.uniform3f(primaryColorLocation, ${hexToGLSL(colors.primary)});
    gl.uniform3f(secondaryColorLocation, ${hexToGLSL(colors.secondary)});
    gl.uniform3f(accentColorLocation, ${hexToGLSL(colors.accent)});
    gl.uniform1f(intensityLocation, ${intensity});

    console.log('Uniforms set:');
    console.log('  resolution:', ${width}, ${height});
    console.log('  primaryColor:', [${hexToGLSL(colors.primary)}]);
    console.log('  secondaryColor:', [${hexToGLSL(colors.secondary)}]);
    console.log('  accentColor:', [${hexToGLSL(colors.accent)}]);
    console.log('  intensity:', ${intensity});

    // Render function
    window.updateShaderTime = function(time) {
      try {
        gl.uniform1f(timeLocation, time);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Debug: Sample pixel color from center of canvas
        if (time === 0 || time === 1) {
          const pixels = new Uint8Array(4);
          gl.readPixels(${Math.floor(width/2)}, ${Math.floor(height/2)}, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
          console.log(\`Frame at t=\${time}s - Center pixel RGBA: [\${pixels[0]}, \${pixels[1]}, \${pixels[2]}, \${pixels[3]}]\`);
        }
      } catch (e) {
        console.error('Render error:', e);
      }
    };

    console.log('Shader setup complete, updateShaderTime defined');

    // Initial render
    window.updateShaderTime(0);
  </script>
</body>
</html>
  `;
}

/**
 * Get GLSL fragment shader code for a shader type
 */
function getFragmentShader(shaderType: string): string {
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
      return getPerlinNoiseShader(); // Default fallback
  }
}

function getPerlinNoiseShader(): string {
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

    // Fractal Brownian Motion (layered noise)
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

      // Audio-reactive time scaling (using intensity as proxy for energy)
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

      // Normalize noise to 0-1
      noise = noise * 0.5 + 0.5;
      noise = clamp(noise, 0.0, 1.0);

      // Color mapping with smooth gradients
      vec3 color;
      if (noise < 0.5) {
        color = mix(primaryColor, secondaryColor, noise * 2.0);
      } else {
        color = mix(secondaryColor, accentColor, (noise - 0.5) * 2.0);
      }

      // Brightness boost
      float brightness = 0.8 + intensity * 0.4;
      color *= brightness;

      gl_FragColor = vec4(color, 1.0);
    }
  `;
}

function getParticleFlowShader(): string {
  return `
    // Hash functions for pseudo-random
    float hash1(float n) {
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
      float timeOffset = hash1(particleId) * 100.0;
      float effectiveTime = t + timeOffset;
      float flowStrength = 0.5 + intensity * 1.5;

      // Trace particle through flow field
      for (int i = 0; i < 20; i++) {
        vec2 flow = flowField(pos, effectiveTime);
        pos += flow * 0.02 * flowStrength;
      }

      // Add turbulence
      pos += vec2(
        sin(effectiveTime * 2.0 + particleId) * intensity * 0.3,
        cos(effectiveTime * 2.0 + particleId) * intensity * 0.3
      );

      return pos;
    }

    // Render particle density field
    float particleDensity(vec2 uv) {
      float density = 0.0;
      int particleCount = int(200.0 + intensity * 300.0);

      for (int i = 0; i < 500; i++) {
        if (i >= particleCount) break;

        float id = float(i);
        vec2 startPos = vec2(
          hash1(id * 12.345) * 2.0 - 1.0,
          hash1(id * 23.456) * 2.0 - 1.0
        ) * 2.0;

        vec2 particlePos = traceParticle(startPos, id, time);
        float dist = length(uv - particlePos);
        float particleSize = 0.02 + intensity * 0.05;
        float brightness = 1.0 + intensity * 3.0;
        float particle = smoothstep(particleSize, 0.0, dist) * brightness;
        density += particle;
      }

      return density;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / resolution;
      vec2 p = uv * 2.0 - 1.0;
      p.x *= resolution.x / resolution.y;

      float density = particleDensity(p);

      // Add glow/bloom effect
      float glow = 0.0;
      for (int i = 0; i < 8; i++) {
        float angle = float(i) * 6.28318 / 8.0;
        vec2 offset = vec2(cos(angle), sin(angle)) * 0.03;
        glow += particleDensity(p + offset);
      }
      glow /= 8.0;
      glow *= 0.5;

      float totalBrightness = density + glow;

      // Color gradient based on density
      vec3 color;
      if (totalBrightness < 0.3) {
        color = mix(primaryColor * 0.1, primaryColor, totalBrightness / 0.3);
      } else if (totalBrightness < 0.7) {
        color = mix(primaryColor, secondaryColor, (totalBrightness - 0.3) / 0.4);
      } else {
        color = mix(secondaryColor, accentColor, (totalBrightness - 0.7) / 0.3);
      }

      // Add color saturation
      color = mix(vec3(length(color)), color, 0.7 + intensity * 0.3);

      gl_FragColor = vec4(color, 1.0);
    }
  `;
}

function getFractalMandelbrotShader(): string {
  return `
    // Smooth Mandelbrot iteration
    float smoothMandelbrot(vec2 c, int maxIter) {
      vec2 z = vec2(0.0);
      int iter = 0;

      for (int i = 0; i < 200; i++) {
        if (i >= maxIter) break;
        if (dot(z, z) > 256.0) break;

        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        iter++;
      }

      if (iter >= maxIter - 1) return float(maxIter);

      float zn = length(z);
      return float(iter) + 1.0 - log2(log2(zn));
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / resolution;
      vec2 p = (uv * 2.0 - 1.0);
      p.x *= resolution.x / resolution.y;

      // Audio-reactive zoom
      float zoom = 0.5 + time * 0.05;
      zoom *= exp(-intensity * 0.5);

      // Rotation
      float angle = time * 0.1 + intensity * 3.14159;
      mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
      p = rot * p;

      // Dynamic center point
      vec2 center = vec2(
        -0.5 + sin(time * 0.1) * 0.3,
        0.0 + cos(time * 0.15) * 0.3
      );

      center.x += (intensity - 0.5) * 0.2;
      center.y += (intensity - 0.5) * 0.2;

      vec2 c = p * zoom + center;

      int maxIter = int(50.0 + 150.0 * (1.0 - zoom));
      maxIter = min(maxIter, 200);

      float iter = smoothMandelbrot(c, maxIter);
      float t = iter / float(maxIter);
      t = fract(t + intensity * 0.5);

      // Multi-color gradient
      vec3 color;
      if (t < 0.33) {
        color = mix(primaryColor, secondaryColor, t * 3.0);
      } else if (t < 0.66) {
        color = mix(secondaryColor, accentColor, (t - 0.33) * 3.0);
      } else {
        color = mix(accentColor, primaryColor, (t - 0.66) * 3.0);
      }

      // Interior coloring
      if (iter >= float(maxIter) - 0.5) {
        color = vec3(0.0);
      }

      color *= 0.7 + intensity * 0.5;

      gl_FragColor = vec4(color, 1.0);
    }
  `;
}

function getVoronoiCellsShader(): string {
  return `
    // Hash function
    vec2 hash2v(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)),
               dot(p, vec2(269.5, 183.3)));
      return fract(sin(p) * 43758.5453123);
    }

    // Voronoi distance field
    vec3 voronoi(vec2 p) {
      vec2 n = floor(p);
      vec2 f = fract(p);

      float minDist = 8.0;
      vec2 minPoint = vec2(0.0);

      for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
          vec2 g = vec2(float(i), float(j));
          vec2 o = hash2v(n + g);

          // Animate cell points
          o = 0.5 + 0.5 * sin(time * 0.5 + 6.28318 * o);

          // Make cells pulse
          o += vec2(
            sin(time + o.x * 6.28) * intensity * 0.3,
            cos(time + o.y * 6.28) * intensity * 0.3
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
      vec2 uv = gl_FragCoord.xy / resolution;
      vec2 p = (uv * 2.0 - 1.0);
      p.x *= resolution.x / resolution.y;

      // Audio-reactive scale
      float scale = 4.0 + intensity * 6.0;
      p *= scale;

      // Rotation
      float angle = time * 0.2 + intensity * 1.0;
      mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
      p = rot * p;

      vec3 vor = voronoi(p);
      float dist = vor.x;
      vec2 cellId = vor.yz;

      vec2 cellHash = hash2v(cellId);

      // Assign colors to cells
      vec3 cellColor;
      if (cellHash.x < 0.33) {
        cellColor = primaryColor;
      } else if (cellHash.x < 0.66) {
        cellColor = secondaryColor;
      } else {
        cellColor = accentColor;
      }

      cellColor *= 0.7 + cellHash.y * 0.5;

      // Edge detection
      float edgeWidth = 0.05 + intensity * 0.1;
      float edge = smoothstep(edgeWidth, 0.0, dist);

      vec3 edgeColor = accentColor * (1.5 + intensity * 2.0);
      vec3 color = mix(cellColor, edgeColor, edge);

      color *= 0.7 + intensity * 0.5;

      // Add glow
      float glow = exp(-dist * 8.0) * 0.3;
      color += glow * secondaryColor;

      gl_FragColor = vec4(color, 1.0);
    }
  `;
}

function getReactionDiffusionShader(): string {
  return `
    // Hash for pseudo-random
    float hashRD(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    // Simplified reaction-diffusion pattern
    float reactionDiffusion(vec2 p, float t) {
      float scale = 10.0;
      p *= scale;

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

      // Add noise
      float noise = hashRD(floor(p * 5.0) + vec2(t * 0.1));
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
      vec2 uv = gl_FragCoord.xy / resolution;
      vec2 p = (uv * 2.0 - 1.0);
      p.x *= resolution.x / resolution.y;

      // Audio-reactive time scaling
      float timeScale = 1.0 + intensity * 2.0;
      float t = time * 0.5 * timeScale;

      // Warping
      vec2 warp = vec2(
        sin(p.y * 2.0 + t) * intensity * 0.3,
        cos(p.x * 2.0 + t) * intensity * 0.3
      );
      p += warp;

      float pattern = multiScaleRD(p, t);
      float threshold = 0.5 + (intensity - 0.5) * 0.3;

      // Create sharp transitions
      float cells = smoothstep(threshold - 0.1, threshold + 0.1, pattern);
      cells = clamp(cells, 0.0, 1.0);

      // Edge detection
      vec2 pixelSize = 1.0 / resolution;
      float dx = multiScaleRD(p + vec2(pixelSize.x, 0.0), t) -
                 multiScaleRD(p - vec2(pixelSize.x, 0.0), t);
      float dy = multiScaleRD(p + vec2(0.0, pixelSize.y), t) -
                 multiScaleRD(p - vec2(0.0, pixelSize.y), t);
      float edge = length(vec2(dx, dy)) * 10.0;
      edge *= 1.0 + intensity * 2.0;

      vec3 color = mix(primaryColor, secondaryColor, cells);
      color += accentColor * edge;
      color *= 0.6 + intensity * 0.6;

      gl_FragColor = vec4(color, 1.0);
    }
  `;
}

/**
 * Convert hex color to GLSL RGB values
 */
function hexToGLSL(hex: string): string {
  const r = (parseInt(hex.slice(1, 3), 16) / 255).toFixed(3);
  const g = (parseInt(hex.slice(3, 5), 16) / 255).toFixed(3);
  const b = (parseInt(hex.slice(5, 7), 16) / 255).toFixed(3);
  return `${r}, ${g}, ${b}`;
}

/**
 * Encode frames to video using FFmpeg
 */
function encodeFramesToVideo(
  framesDir: string,
  outputPath: string,
  fps: number
): Promise<void> {
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
      // console.log(data.toString());
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    ffmpeg.on('error', reject);
  });
}
