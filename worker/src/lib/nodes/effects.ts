/**
 * Effect Nodes - Transform and enhance visuals
 *
 * Effects take input from generators or other effects and apply transformations
 * All effects are implemented as post-processing shaders
 */

import { EffectNode, NodeRenderContext, evaluateParam } from './types.js';

const VERTEX_SHADER = `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

function createShaderProgram(gl: any, vertexSource: string, fragmentSource: string): any {
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
 * Effect 1: Blur
 */
export function renderBlur(
  node: EffectNode,
  ctx: NodeRenderContext
): void {
  const { gl, time, width, height, audioFeatures, audioFrame, inputBuffer } = ctx;
  const effect = node.effect as any;

  const radius = evaluateParam(effect.radius, time, audioFeatures.duration, audioFeatures, audioFrame);

  const fragmentShader = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D inputTexture;
    uniform vec2 resolution;
    uniform float radius;

    void main() {
      vec4 color = vec4(0.0);
      float total = 0.0;

      // Gaussian blur
      for(float x = -4.0; x <= 4.0; x++) {
        for(float y = -4.0; y <= 4.0; y++) {
          vec2 offset = vec2(x, y) * radius / resolution;
          float weight = exp(-(x*x + y*y) / 8.0);
          color += texture2D(inputTexture, vUv + offset) * weight;
          total += weight;
        }
      }

      gl_FragColor = color / total;
    }
  `;

  const program = createShaderProgram(gl, VERTEX_SHADER, fragmentShader);
  gl.useProgram(program);

  gl.uniform1i(gl.getUniformLocation(program, 'inputTexture'), 0);
  gl.uniform2f(gl.getUniformLocation(program, 'resolution'), width, height);
  gl.uniform1f(gl.getUniformLocation(program, 'radius'), radius);

  // Bind input texture
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, inputBuffer);

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
 * Effect 2: Bloom (glow effect)
 */
export function renderBloom(
  node: EffectNode,
  ctx: NodeRenderContext
): void {
  const { gl, time, width, height, audioFeatures, audioFrame, inputBuffer } = ctx;
  const effect = node.effect as any;

  const threshold = evaluateParam(effect.threshold, time, audioFeatures.duration, audioFeatures, audioFrame);
  const intensity = evaluateParam(effect.intensity, time, audioFeatures.duration, audioFeatures, audioFrame);

  const fragmentShader = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D inputTexture;
    uniform vec2 resolution;
    uniform float threshold;
    uniform float intensity;

    void main() {
      vec4 original = texture2D(inputTexture, vUv);

      // Extract bright areas
      vec4 bright = max(original - threshold, 0.0);

      // Blur bright areas
      vec4 bloom = vec4(0.0);
      float total = 0.0;

      for(float x = -6.0; x <= 6.0; x++) {
        for(float y = -6.0; y <= 6.0; y++) {
          vec2 offset = vec2(x, y) * 2.0 / resolution;
          float weight = exp(-(x*x + y*y) / 16.0);
          vec4 texSample = texture2D(inputTexture, vUv + offset);
          vec4 brightSample = max(texSample - threshold, 0.0);
          bloom += brightSample * weight;
          total += weight;
        }
      }

      bloom /= total;

      // Combine original with bloom
      gl_FragColor = original + bloom * intensity;
    }
  `;

  const program = createShaderProgram(gl, VERTEX_SHADER, fragmentShader);
  gl.useProgram(program);

  gl.uniform1i(gl.getUniformLocation(program, 'inputTexture'), 0);
  gl.uniform2f(gl.getUniformLocation(program, 'resolution'), width, height);
  gl.uniform1f(gl.getUniformLocation(program, 'threshold'), threshold);
  gl.uniform1f(gl.getUniformLocation(program, 'intensity'), intensity);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, inputBuffer);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

/**
 * Effect 3: Kaleidoscope
 */
export function renderKaleidoscope(
  node: EffectNode,
  ctx: NodeRenderContext
): void {
  const { gl, time, width, height, audioFeatures, audioFrame, inputBuffer } = ctx;
  const effect = node.effect as any;

  const segments = Math.floor(evaluateParam(effect.segments, time, audioFeatures.duration, audioFeatures, audioFrame));
  const rotation = evaluateParam(effect.rotation, time, audioFeatures.duration, audioFeatures, audioFrame);

  const fragmentShader = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D inputTexture;
    uniform float segments;
    uniform float rotation;

    void main() {
      vec2 center = vUv - 0.5;
      float angle = atan(center.y, center.x) + rotation;
      float radius = length(center);

      // Mirror across segments
      float segmentAngle = 6.28318 / segments;
      angle = mod(angle, segmentAngle);
      if(mod(floor((atan(center.y, center.x) + rotation) / segmentAngle), 2.0) > 0.5) {
        angle = segmentAngle - angle;
      }

      vec2 uv = vec2(cos(angle), sin(angle)) * radius + 0.5;
      gl_FragColor = texture2D(inputTexture, uv);
    }
  `;

  const program = createShaderProgram(gl, VERTEX_SHADER, fragmentShader);
  gl.useProgram(program);

  gl.uniform1i(gl.getUniformLocation(program, 'inputTexture'), 0);
  gl.uniform1f(gl.getUniformLocation(program, 'segments'), segments);
  gl.uniform1f(gl.getUniformLocation(program, 'rotation'), rotation);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, inputBuffer);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

/**
 * Effect 4: Color Grade (HSB adjustment)
 */
export function renderColorGrade(
  node: EffectNode,
  ctx: NodeRenderContext
): void {
  const { gl, time, width, height, audioFeatures, audioFrame, inputBuffer } = ctx;
  const effect = node.effect as any;

  const hue = evaluateParam(effect.hue, time, audioFeatures.duration, audioFeatures, audioFrame);
  const saturation = evaluateParam(effect.saturation, time, audioFeatures.duration, audioFeatures, audioFrame);
  const brightness = evaluateParam(effect.brightness, time, audioFeatures.duration, audioFeatures, audioFrame);

  const fragmentShader = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D inputTexture;
    uniform float hue;
    uniform float saturation;
    uniform float brightness;

    vec3 rgb2hsv(vec3 c) {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }

    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
      vec4 color = texture2D(inputTexture, vUv);
      vec3 hsv = rgb2hsv(color.rgb);

      // Adjust HSV
      hsv.x = fract(hsv.x + hue);
      hsv.y = clamp(hsv.y * saturation, 0.0, 1.0);
      hsv.z = clamp(hsv.z * brightness, 0.0, 1.0);

      vec3 rgb = hsv2rgb(hsv);
      gl_FragColor = vec4(rgb, color.a);
    }
  `;

  const program = createShaderProgram(gl, VERTEX_SHADER, fragmentShader);
  gl.useProgram(program);

  gl.uniform1i(gl.getUniformLocation(program, 'inputTexture'), 0);
  gl.uniform1f(gl.getUniformLocation(program, 'hue'), hue);
  gl.uniform1f(gl.getUniformLocation(program, 'saturation'), saturation);
  gl.uniform1f(gl.getUniformLocation(program, 'brightness'), brightness);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, inputBuffer);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

/**
 * Effect 5: Feedback (video feedback loop effect)
 */
export function renderFeedback(
  node: EffectNode,
  ctx: NodeRenderContext
): void {
  const { gl, time, width, height, audioFeatures, audioFrame, inputBuffer } = ctx;
  const effect = node.effect as any;

  const amount = evaluateParam(effect.amount, time, audioFeatures.duration, audioFeatures, audioFrame);
  const decay = evaluateParam(effect.decay, time, audioFeatures.duration, audioFeatures, audioFrame);

  const fragmentShader = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D inputTexture;
    uniform float amount;
    uniform float decay;
    uniform float time;

    void main() {
      vec2 center = vUv - 0.5;

      // Zoom and rotate slightly for feedback effect
      float zoom = 1.0 + amount * 0.05;
      float angle = amount * 0.02;
      mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
      vec2 uv = rot * center * zoom + 0.5;

      vec4 color = texture2D(inputTexture, uv);

      // Decay to prevent feedback from accumulating infinitely
      color *= decay;

      gl_FragColor = color;
    }
  `;

  const program = createShaderProgram(gl, VERTEX_SHADER, fragmentShader);
  gl.useProgram(program);

  gl.uniform1i(gl.getUniformLocation(program, 'inputTexture'), 0);
  gl.uniform1f(gl.getUniformLocation(program, 'amount'), amount);
  gl.uniform1f(gl.getUniformLocation(program, 'decay'), decay);
  gl.uniform1f(gl.getUniformLocation(program, 'time'), time);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, inputBuffer);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

/**
 * Effect: Chromatic aberration (RGB channel offset)
 */
export function renderChromaticAberration(
  node: EffectNode,
  ctx: NodeRenderContext
): void {
  const { gl, time, width, height, audioFeatures, audioFrame } = ctx;
  const effect = node.effect as any;

  const amount = evaluateParam(effect.amount, time, audioFeatures.duration, audioFeatures, audioFrame);

  // This is a post-process effect - would need texture input
  // For now, apply a subtle color shift
  console.warn('Chromatic aberration effect requires texture pipeline');
}

/**
 * Effect: Film grain
 */
export function renderGrain(
  node: EffectNode,
  ctx: NodeRenderContext
): void {
  const { gl, time, width, height, audioFeatures, audioFrame } = ctx;
  const effect = node.effect as any;

  const amount = evaluateParam(effect.amount, time, audioFeatures.duration, audioFeatures, audioFrame);

  // Film grain effect
  console.warn('Grain effect requires texture pipeline');
}

/**
 * Render an effect node
 */
export function renderEffect(node: EffectNode, ctx: NodeRenderContext): void {
  const effectName = (node.effect as any).name;

  switch (effectName) {
    case 'blur':
      renderBlur(node, ctx);
      break;
    case 'bloom':
      renderBloom(node, ctx);
      break;
    case 'kaleidoscope':
      renderKaleidoscope(node, ctx);
      break;
    case 'color-grade':
      renderColorGrade(node, ctx);
      break;
    case 'feedback':
      renderFeedback(node, ctx);
      break;
    case 'chromatic-aberration':
      renderChromaticAberration(node, ctx);
      break;
    case 'grain':
      renderGrain(node, ctx);
      break;
    default:
      throw new Error(`Unknown effect: ${effectName}`);
  }
}
