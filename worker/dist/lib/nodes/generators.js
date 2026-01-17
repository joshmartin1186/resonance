/**
 * Generator Nodes - Create base visual patterns
 *
 * Each generator is a GLSL shader that creates procedural graphics
 * Parameters are controlled by the AI orchestrator and can be audio-reactive
 */
import { evaluateParam } from './types.js';
/**
 * Compile and link a shader program
 */
function createShaderProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        throw new Error('Vertex shader compile error: ' + gl.getShaderInfoLog(vertexShader));
    }
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        throw new Error('Fragment shader compile error: ' + gl.getShaderInfoLog(fragmentShader));
    }
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error('Program link error: ' + gl.getProgramInfoLog(program));
    }
    return program;
}
/**
 * Simple vertex shader (used by all generators)
 */
const VERTEX_SHADER = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;
/**
 * Generator 1: Perlin Noise (organic flowing patterns)
 */
export function renderPerlinNoise(node, ctx) {
    const { gl, time, width, height, audioFeatures, audioFrame } = ctx;
    const gen = node.generator;
    // Evaluate parameters
    const octaves = Math.floor(evaluateParam(gen.octaves, time, audioFeatures.duration, audioFeatures, audioFrame));
    const scale = evaluateParam(gen.scale, time, audioFeatures.duration, audioFeatures, audioFrame);
    const fragmentShader = `
    precision highp float;
    uniform float time;
    uniform vec2 resolution;
    uniform float octaves;
    uniform float scale;

    // Perlin noise function
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    // Fractal Brownian Motion (layered noise)
    float fbm(vec2 p, float octaves) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;

      for(float i = 0.0; i < 8.0; i++) {
        if(i >= octaves) break;
        value += amplitude * snoise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
      }

      return value;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / resolution;
      vec2 p = (uv - 0.5) * scale;

      // Animated noise
      vec2 offset = vec2(time * 0.1, time * 0.05);
      float noise = fbm(p + offset, octaves);

      // Color mapping (terracotta/cream palette)
      vec3 color1 = vec3(0.89, 0.47, 0.36); // Terracotta
      vec3 color2 = vec3(0.96, 0.87, 0.70); // Cream
      vec3 color3 = vec3(0.45, 0.32, 0.36); // Dark purple

      // Map noise to colors
      float t = (noise + 1.0) * 0.5; // Remap -1..1 to 0..1
      vec3 color = mix(color1, color2, smoothstep(0.3, 0.7, t));
      color = mix(color, color3, smoothstep(0.7, 1.0, t));

      gl_FragColor = vec4(color, 1.0);
    }
  `;
    const program = createShaderProgram(gl, VERTEX_SHADER, fragmentShader);
    gl.useProgram(program);
    // Set uniforms
    const uniforms = {
        time: gl.getUniformLocation(program, 'time'),
        resolution: gl.getUniformLocation(program, 'resolution'),
        octaves: gl.getUniformLocation(program, 'octaves'),
        scale: gl.getUniformLocation(program, 'scale')
    };
    gl.uniform1f(uniforms.time, time);
    gl.uniform2f(uniforms.resolution, width, height);
    gl.uniform1f(uniforms.octaves, octaves);
    gl.uniform1f(uniforms.scale, scale);
    // Create fullscreen quad
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        1, 1
    ]), gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    // Render
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
/**
 * Generator 2: Particle System
 */
export function renderParticles(node, ctx) {
    const { gl, time, width, height, audioFeatures, audioFrame } = ctx;
    const gen = node.generator;
    const count = Math.floor(evaluateParam(gen.count, time, audioFeatures.duration, audioFeatures, audioFrame));
    const size = evaluateParam(gen.size, time, audioFeatures.duration, audioFeatures, audioFrame);
    const speed = evaluateParam(gen.speed, time, audioFeatures.duration, audioFeatures, audioFrame);
    const fragmentShader = `
    precision highp float;
    uniform float time;
    uniform vec2 resolution;
    uniform float particleCount;
    uniform float particleSize;
    uniform float speed;

    // Hash function for particle positions
    float hash(float n) { return fract(sin(n) * 43758.5453123); }

    void main() {
      vec2 uv = gl_FragCoord.xy / resolution;
      vec3 color = vec3(0.0);

      // Draw particles
      for(float i = 0.0; i < 1000.0; i++) {
        if(i >= particleCount) break;

        // Particle position (pseudo-random)
        vec2 pos = vec2(
          hash(i * 12.9898),
          hash(i * 78.233)
        );

        // Animate position
        pos.x = fract(pos.x + time * speed * hash(i * 45.123));
        pos.y = fract(pos.y + time * speed * hash(i * 67.456));

        // Distance to particle
        float dist = distance(uv, pos);

        // Particle glow
        float glow = particleSize / (dist * 100.0 + 1.0);

        // Color based on position
        vec3 particleColor = vec3(
          0.5 + 0.5 * sin(i * 0.1),
          0.5 + 0.5 * cos(i * 0.15),
          0.7
        );

        color += particleColor * glow;
      }

      gl_FragColor = vec4(color, 1.0);
    }
  `;
    const program = createShaderProgram(gl, VERTEX_SHADER, fragmentShader);
    gl.useProgram(program);
    const uniforms = {
        time: gl.getUniformLocation(program, 'time'),
        resolution: gl.getUniformLocation(program, 'resolution'),
        particleCount: gl.getUniformLocation(program, 'particleCount'),
        particleSize: gl.getUniformLocation(program, 'particleSize'),
        speed: gl.getUniformLocation(program, 'speed')
    };
    gl.uniform1f(uniforms.time, time);
    gl.uniform2f(uniforms.resolution, width, height);
    gl.uniform1f(uniforms.particleCount, count);
    gl.uniform1f(uniforms.particleSize, size);
    gl.uniform1f(uniforms.speed, speed);
    // Fullscreen quad
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
/**
 * Generator 3: Fractal (Mandelbrot-style)
 */
export function renderFractal(node, ctx) {
    const { gl, time, width, height, audioFeatures, audioFrame } = ctx;
    const gen = node.generator;
    const iterations = Math.floor(evaluateParam(gen.iterations, time, audioFeatures.duration, audioFeatures, audioFrame));
    const zoom = evaluateParam(gen.zoom, time, audioFeatures.duration, audioFeatures, audioFrame);
    const fragmentShader = `
    precision highp float;
    uniform float time;
    uniform vec2 resolution;
    uniform float iterations;
    uniform float zoom;

    void main() {
      vec2 uv = (gl_FragCoord.xy - resolution * 0.5) / min(resolution.y, resolution.x);

      // Zoom and pan
      uv *= zoom;
      uv.x += sin(time * 0.2) * 0.5;
      uv.y += cos(time * 0.15) * 0.5;

      // Mandelbrot calculation
      vec2 z = vec2(0.0);
      float iter = 0.0;

      for(float i = 0.0; i < 100.0; i++) {
        if(i >= iterations) break;
        if(dot(z, z) > 4.0) break;

        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + uv;
        iter++;
      }

      // Color based on iterations
      float t = iter / iterations;
      vec3 color = vec3(
        0.5 + 0.5 * sin(t * 6.28 + time),
        0.5 + 0.5 * cos(t * 6.28 + time * 0.5),
        0.5 + 0.5 * sin(t * 6.28 + time * 0.7)
      );

      gl_FragColor = vec4(color, 1.0);
    }
  `;
    const program = createShaderProgram(gl, VERTEX_SHADER, fragmentShader);
    gl.useProgram(program);
    const uniforms = {
        time: gl.getUniformLocation(program, 'time'),
        resolution: gl.getUniformLocation(program, 'resolution'),
        iterations: gl.getUniformLocation(program, 'iterations'),
        zoom: gl.getUniformLocation(program, 'zoom')
    };
    gl.uniform1f(uniforms.time, time);
    gl.uniform2f(uniforms.resolution, width, height);
    gl.uniform1f(uniforms.iterations, iterations);
    gl.uniform1f(uniforms.zoom, zoom);
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
/**
 * Generator 4: Voronoi (organic cells)
 */
export function renderVoronoi(node, ctx) {
    const { gl, time, width, height, audioFeatures, audioFrame } = ctx;
    const gen = node.generator;
    const points = Math.floor(evaluateParam(gen.points, time, audioFeatures.duration, audioFeatures, audioFrame));
    const distanceType = evaluateParam(gen.distance, time, audioFeatures.duration, audioFeatures, audioFrame);
    const fragmentShader = `
    precision highp float;
    uniform float time;
    uniform vec2 resolution;
    uniform float pointCount;
    uniform float distanceType;

    float hash(float n) { return fract(sin(n) * 43758.5453123); }

    void main() {
      vec2 uv = gl_FragCoord.xy / resolution;

      float minDist = 999.0;
      vec3 cellColor = vec3(0.0);

      // Find closest point
      for(float i = 0.0; i < 50.0; i++) {
        if(i >= pointCount) break;

        vec2 point = vec2(
          hash(i * 12.9898 + time * 0.1),
          hash(i * 78.233 + time * 0.1)
        );

        // Distance calculation
        float dist;
        if(distanceType < 0.5) {
          // Euclidean
          dist = distance(uv, point);
        } else {
          // Manhattan
          dist = abs(uv.x - point.x) + abs(uv.y - point.y);
        }

        if(dist < minDist) {
          minDist = dist;
          cellColor = vec3(
            0.5 + 0.5 * sin(i * 0.5 + time),
            0.5 + 0.5 * cos(i * 0.7 + time),
            0.6
          );
        }
      }

      // Edge detection
      float edge = smoothstep(0.0, 0.02, minDist);
      vec3 color = mix(vec3(0.0), cellColor, edge);

      gl_FragColor = vec4(color, 1.0);
    }
  `;
    const program = createShaderProgram(gl, VERTEX_SHADER, fragmentShader);
    gl.useProgram(program);
    const uniforms = {
        time: gl.getUniformLocation(program, 'time'),
        resolution: gl.getUniformLocation(program, 'resolution'),
        pointCount: gl.getUniformLocation(program, 'pointCount'),
        distanceType: gl.getUniformLocation(program, 'distanceType')
    };
    gl.uniform1f(uniforms.time, time);
    gl.uniform2f(uniforms.resolution, width, height);
    gl.uniform1f(uniforms.pointCount, points);
    gl.uniform1f(uniforms.distanceType, distanceType);
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
/**
 * Generator 5: Flow Field (fluid-like motion)
 */
export function renderFlowField(node, ctx) {
    const { gl, time, width, height, audioFeatures, audioFrame } = ctx;
    const gen = node.generator;
    const resolution = Math.floor(evaluateParam(gen.resolution, time, audioFeatures.duration, audioFeatures, audioFrame));
    const strength = evaluateParam(gen.strength, time, audioFeatures.duration, audioFeatures, audioFrame);
    const fragmentShader = `
    precision highp float;
    uniform float time;
    uniform vec2 res;
    uniform float resolution;
    uniform float strength;

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m; m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / res;
      vec2 p = uv * resolution;

      // Flow field using noise
      float angle = snoise(p + time * 0.5) * 6.28 * strength;
      vec2 flow = vec2(cos(angle), sin(angle));

      // Trace particle along flow
      vec2 pos = uv;
      for(int i = 0; i < 20; i++) {
        float a = snoise(pos * resolution + time * 0.5) * 6.28 * strength;
        pos += vec2(cos(a), sin(a)) * 0.01;
      }

      // Color based on final position
      vec3 color = vec3(
        0.5 + 0.5 * sin(pos.x * 10.0 + time),
        0.5 + 0.5 * cos(pos.y * 10.0 + time),
        0.7
      );

      gl_FragColor = vec4(color, 1.0);
    }
  `;
    const program = createShaderProgram(gl, VERTEX_SHADER, fragmentShader);
    gl.useProgram(program);
    const uniforms = {
        time: gl.getUniformLocation(program, 'time'),
        res: gl.getUniformLocation(program, 'res'),
        resolution: gl.getUniformLocation(program, 'resolution'),
        strength: gl.getUniformLocation(program, 'strength')
    };
    gl.uniform1f(uniforms.time, time);
    gl.uniform2f(uniforms.res, width, height);
    gl.uniform1f(uniforms.resolution, resolution);
    gl.uniform1f(uniforms.strength, strength);
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
/**
 * Generator: Geometric shapes (rotating polygons)
 */
export function renderGeometric(node, ctx) {
    const { gl, time, width, height, audioFeatures, audioFrame } = ctx;
    const gen = node.generator;
    const sides = Math.floor(evaluateParam(gen.sides, time, audioFeatures.duration, audioFeatures, audioFrame));
    const rotation = evaluateParam(gen.rotation, time, audioFeatures.duration, audioFeatures, audioFrame);
    const scale = evaluateParam(gen.scale, time, audioFeatures.duration, audioFeatures, audioFrame);
    const fragmentShader = `
    precision highp float;
    uniform float time;
    uniform vec2 resolution;
    uniform float sides;
    uniform float rotation;
    uniform float scale;

    void main() {
      vec2 uv = (gl_FragCoord.xy - resolution * 0.5) / resolution.y;
      float angle = atan(uv.y, uv.x) + rotation;
      float dist = length(uv);

      float slice = 6.28318 / sides;
      float edge = cos(floor(0.5 + angle / slice) * slice - angle) * dist;

      float shape = smoothstep(scale + 0.02, scale, edge);

      gl_FragColor = vec4(vec3(shape), shape);
    }
  `;
    const program = createShaderProgram(gl, VERTEX_SHADER, fragmentShader);
    gl.useProgram(program);
    const posLoc = gl.getAttribLocation(program, 'position');
    const resLoc = gl.getUniformLocation(program, 'resolution');
    const timeLoc = gl.getUniformLocation(program, 'time');
    const sidesLoc = gl.getUniformLocation(program, 'sides');
    const rotationLoc = gl.getUniformLocation(program, 'rotation');
    const scaleLoc = gl.getUniformLocation(program, 'scale');
    gl.uniform1f(timeLoc, time);
    gl.uniform2f(resLoc, width, height);
    gl.uniform1f(sidesLoc, sides);
    gl.uniform1f(rotationLoc, rotation);
    gl.uniform1f(scaleLoc, scale);
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
/**
 * Generator: Radial waves (expanding circles)
 */
export function renderRadialWaves(node, ctx) {
    const { gl, time, width, height, audioFeatures, audioFrame } = ctx;
    const gen = node.generator;
    const frequency = evaluateParam(gen.frequency, time, audioFeatures.duration, audioFeatures, audioFrame);
    const amplitude = evaluateParam(gen.amplitude, time, audioFeatures.duration, audioFeatures, audioFrame);
    const speed = evaluateParam(gen.speed, time, audioFeatures.duration, audioFeatures, audioFrame);
    const fragmentShader = `
    precision highp float;
    uniform float time;
    uniform vec2 resolution;
    uniform float frequency;
    uniform float amplitude;
    uniform float speed;

    void main() {
      vec2 uv = (gl_FragCoord.xy - resolution * 0.5) / resolution.y;
      float dist = length(uv);

      float wave = sin(dist * frequency - time * speed) * amplitude;
      float intensity = smoothstep(0.0, amplitude, wave);

      gl_FragColor = vec4(vec3(intensity), intensity);
    }
  `;
    const program = createShaderProgram(gl, VERTEX_SHADER, fragmentShader);
    gl.useProgram(program);
    const posLoc = gl.getAttribLocation(program, 'position');
    const resLoc = gl.getUniformLocation(program, 'resolution');
    const timeLoc = gl.getUniformLocation(program, 'time');
    const freqLoc = gl.getUniformLocation(program, 'frequency');
    const ampLoc = gl.getUniformLocation(program, 'amplitude');
    const speedLoc = gl.getUniformLocation(program, 'speed');
    gl.uniform1f(timeLoc, time);
    gl.uniform2f(resLoc, width, height);
    gl.uniform1f(freqLoc, frequency);
    gl.uniform1f(ampLoc, amplitude);
    gl.uniform1f(speedLoc, speed);
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
/**
 * Generator: Solid color (for flashes/backgrounds)
 */
export function renderSolidColor(node, ctx) {
    const { gl } = ctx;
    const gen = node.generator;
    const color = gen.color?.value || [1.0, 1.0, 1.0];
    gl.clearColor(color[0], color[1], color[2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}
/**
 * Render a generator node
 */
export function renderGenerator(node, ctx) {
    const genName = node.generator.name;
    switch (genName) {
        case 'perlin-noise':
            renderPerlinNoise(node, ctx);
            break;
        case 'particles':
            renderParticles(node, ctx);
            break;
        case 'fractal':
            renderFractal(node, ctx);
            break;
        case 'voronoi':
            renderVoronoi(node, ctx);
            break;
        case 'flow-field':
            renderFlowField(node, ctx);
            break;
        case 'geometric':
            renderGeometric(node, ctx);
            break;
        case 'radial-waves':
            renderRadialWaves(node, ctx);
            break;
        case 'solid-color':
            renderSolidColor(node, ctx);
            break;
        default:
            throw new Error(`Unknown generator: ${genName}`);
    }
}
//# sourceMappingURL=generators.js.map