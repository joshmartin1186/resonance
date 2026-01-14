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
/**
 * Render a shader to a video file using WebGL
 */
export async function renderShaderVideo(config, outputPath) {
    const { duration, width, height, fps } = config;
    const totalFrames = Math.ceil(duration * fps);
    // Create temp directory for frames
    const tempDir = join('/tmp', `shader-render-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
    console.log(`[GPU Shader] Rendering ${totalFrames} frames at ${width}x${height}...`);
    // Launch headless browser
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu' // We'll use software rendering which is still faster than geq
        ]
    });
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    // Create HTML page with WebGL shader
    const html = generateShaderHTML(config);
    await page.setContent(html);
    // Render frames
    for (let frame = 0; frame < totalFrames; frame++) {
        const time = frame / fps;
        // Update shader uniforms
        await page.evaluate((t) => {
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
            console.log(`[GPU Shader] Rendered frame ${frame}/${totalFrames} (${Math.round(frame / totalFrames * 100)}%)`);
        }
    }
    await browser.close();
    console.log(`[GPU Shader] Encoding video with FFmpeg...`);
    // Encode frames to video using FFmpeg
    await encodeFramesToVideo(tempDir, outputPath, fps);
    console.log(`[GPU Shader] Shader video rendered: ${outputPath}`);
}
/**
 * Generate HTML page with WebGL shader
 */
function generateShaderHTML(config) {
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
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

    if (!gl) {
      console.error('WebGL not supported');
    }

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

    // Render function
    window.updateShaderTime = function(time) {
      gl.uniform1f(timeLocation, time);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

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
function getFragmentShader(shaderType) {
    // For now, return a simple test shader
    // We'll implement the full shaders later
    return `
    // Simple noise function
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);

      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));

      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / resolution;
      vec2 p = uv * 5.0 + time * 0.5;

      float n = noise(p);
      n += 0.5 * noise(p * 2.0);
      n += 0.25 * noise(p * 4.0);

      vec3 color = mix(primaryColor, secondaryColor, n);
      color = mix(color, accentColor, smoothstep(0.4, 0.6, n));

      gl_FragColor = vec4(color, 1.0);
    }
  `;
}
/**
 * Convert hex color to GLSL RGB values
 */
function hexToGLSL(hex) {
    const r = (parseInt(hex.slice(1, 3), 16) / 255).toFixed(3);
    const g = (parseInt(hex.slice(3, 5), 16) / 255).toFixed(3);
    const b = (parseInt(hex.slice(5, 7), 16) / 255).toFixed(3);
    return `${r}, ${g}, ${b}`;
}
/**
 * Encode frames to video using FFmpeg
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
            // console.log(data.toString());
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
//# sourceMappingURL=gpu-shader-renderer.js.map