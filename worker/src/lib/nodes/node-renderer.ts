/**
 * Node Renderer - Multi-pass rendering pipeline
 *
 * Renders a visual timeline by:
 * 1. Rendering all active generators to separate buffers
 * 2. Applying effects in sequence
 * 3. Compositing layers together
 * 4. Outputting final frame
 */

import gl from 'gl';
import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { VisualTimeline, NodeRenderContext, calculateNodeOpacity, GeneratorNode, EffectNode } from './types.js';
import { renderGenerator } from './generators.js';
import { renderEffect } from './effects.js';
import { DeepAudioFeatures } from '../deep-audio-analyzer.js';

/**
 * Render timeline to video frames
 */
export async function renderTimelineToFrames(
  timeline: VisualTimeline,
  audioFeatures: DeepAudioFeatures,
  outputDir: string,
  options: {
    width?: number;
    height?: number;
    fps?: number;
    onProgress?: (frame: number, total: number) => void;
  } = {}
): Promise<void> {
  const width = options.width || 1920;
  const height = options.height || 1080;
  const fps = options.fps || 30;

  const totalFrames = Math.floor(timeline.duration * fps);

  console.log(`[Node Renderer] Rendering ${totalFrames} frames at ${fps}fps (${width}x${height})`);

  // Create output directory
  mkdirSync(outputDir, { recursive: true });

  // Create WebGL context
  const glContext: any = gl(width, height);

  // Create framebuffers for multi-pass rendering
  const mainBuffer = createFramebuffer(glContext, width, height);
  const tempBuffer = createFramebuffer(glContext, width, height);

  // Render each frame
  for (let frame = 0; frame < totalFrames; frame++) {
    const time = frame / fps;
    const audioFrame = frame; // Audio is also at 30fps

    // Build render context
    const ctx: NodeRenderContext = {
      time,
      deltaTime: 1 / fps,
      frame,
      audioFeatures,
      audioFrame,
      gl: glContext,
      inputBuffer: null,
      outputBuffer: mainBuffer.texture,
      width,
      height
    };

    // Clear main buffer
    glContext.bindFramebuffer(glContext.FRAMEBUFFER, mainBuffer.framebuffer);
    glContext.clearColor(0, 0, 0, 1);
    glContext.clear(glContext.COLOR_BUFFER_BIT);

    // 1. Render all active generators
    const activeGenerators = timeline.nodes
      .filter(node => node.type === 'generator')
      .filter(node => {
        const opacity = calculateNodeOpacity(node, time);
        return opacity > 0;
      }) as GeneratorNode[];

    for (const generator of activeGenerators) {
      const opacity = calculateNodeOpacity(generator, time);

      // Render generator to temp buffer
      glContext.bindFramebuffer(glContext.FRAMEBUFFER, tempBuffer.framebuffer);
      glContext.clearColor(0, 0, 0, 0);
      glContext.clear(glContext.COLOR_BUFFER_BIT);

      renderGenerator(generator, ctx);

      // Composite generator onto main buffer with opacity
      compositeTexture(glContext, tempBuffer.texture, mainBuffer.framebuffer, opacity, width, height);
    }

    // 2. Apply effects in sequence
    const activeEffects = timeline.nodes
      .filter(node => node.type === 'effect')
      .filter(node => {
        const opacity = calculateNodeOpacity(node, time);
        return opacity > 0;
      }) as EffectNode[];

    let currentBuffer = mainBuffer;
    let nextBuffer = tempBuffer;

    for (const effect of activeEffects) {
      const opacity = calculateNodeOpacity(effect, time);

      // Set input buffer for effect
      ctx.inputBuffer = currentBuffer.texture;

      // Render effect to next buffer
      glContext.bindFramebuffer(glContext.FRAMEBUFFER, nextBuffer.framebuffer);
      glContext.clearColor(0, 0, 0, 0);
      glContext.clear(glContext.COLOR_BUFFER_BIT);

      renderEffect(effect, ctx);

      // If opacity < 1, blend with original
      if (opacity < 1.0) {
        // Mix original and effect based on opacity
        blendTextures(glContext, currentBuffer.texture, nextBuffer.texture, opacity, width, height);
      }

      // Swap buffers
      [currentBuffer, nextBuffer] = [nextBuffer, currentBuffer];
    }

    // 3. Read final pixels from current buffer
    glContext.bindFramebuffer(glContext.FRAMEBUFFER, currentBuffer.framebuffer);
    const pixels = new Uint8Array(width * height * 4);
    glContext.readPixels(0, 0, width, height, glContext.RGBA, glContext.UNSIGNED_BYTE, pixels);

    // 4. Write frame to PNG
    const canvas = createCanvas(width, height);
    const canvasCtx = canvas.getContext('2d');
    const imageData = canvasCtx.createImageData(width, height);

    // Flip Y (WebGL is bottom-up, canvas is top-down)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = ((height - 1 - y) * width + x) * 4;
        const dstIdx = (y * width + x) * 4;
        imageData.data[dstIdx] = pixels[srcIdx];
        imageData.data[dstIdx + 1] = pixels[srcIdx + 1];
        imageData.data[dstIdx + 2] = pixels[srcIdx + 2];
        imageData.data[dstIdx + 3] = pixels[srcIdx + 3];
      }
    }

    canvasCtx.putImageData(imageData, 0, 0);

    // Save frame
    const framePath = join(outputDir, `frame_${String(frame).padStart(6, '0')}.png`);
    const buffer = canvas.toBuffer('image/png');
    writeFileSync(framePath, buffer);

    // Progress callback
    if (options.onProgress && frame % 30 === 0) {
      options.onProgress(frame, totalFrames);
    }
  }

  console.log(`[Node Renderer] Rendered ${totalFrames} frames`);
}

/**
 * Create a framebuffer with texture
 */
function createFramebuffer(gl: any, width: number, height: number): { framebuffer: any; texture: any } {
  const framebuffer = gl.createFramebuffer();
  const texture = gl.createTexture();

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error(`Framebuffer incomplete: ${status}`);
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return { framebuffer, texture };
}

/**
 * Composite a texture onto a framebuffer with opacity
 */
function compositeTexture(
  gl: any,
  srcTexture: any,
  dstFramebuffer: any,
  opacity: number,
  width: number,
  height: number
): void {
  const vertexShader = `
    attribute vec2 position;
    varying vec2 vUv;
    void main() {
      vUv = position * 0.5 + 0.5;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fragmentShader = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D srcTexture;
    uniform float opacity;
    void main() {
      vec4 src = texture2D(srcTexture, vUv);
      gl_FragColor = src * opacity;
    }
  `;

  // Create shader program
  const vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, vertexShader);
  gl.compileShader(vs);

  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, fragmentShader);
  gl.compileShader(fs);

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  gl.useProgram(program);

  // Bind destination framebuffer
  gl.bindFramebuffer(gl.FRAMEBUFFER, dstFramebuffer);

  // Enable blending
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // Set uniforms
  gl.uniform1i(gl.getUniformLocation(program, 'srcTexture'), 0);
  gl.uniform1f(gl.getUniformLocation(program, 'opacity'), opacity);

  // Bind texture
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, srcTexture);

  // Draw quad
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  gl.disable(gl.BLEND);
}

/**
 * Blend two textures together
 */
function blendTextures(
  gl: any,
  texture1: any,
  texture2: any,
  blend: number,
  width: number,
  height: number
): void {
  const vertexShader = `
    attribute vec2 position;
    varying vec2 vUv;
    void main() {
      vUv = position * 0.5 + 0.5;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fragmentShader = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D texture1;
    uniform sampler2D texture2;
    uniform float blend;
    void main() {
      vec4 color1 = texture2D(texture1, vUv);
      vec4 color2 = texture2D(texture2, vUv);
      gl_FragColor = mix(color1, color2, blend);
    }
  `;

  const vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, vertexShader);
  gl.compileShader(vs);

  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, fragmentShader);
  gl.compileShader(fs);

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  gl.useProgram(program);

  gl.uniform1i(gl.getUniformLocation(program, 'texture1'), 0);
  gl.uniform1i(gl.getUniformLocation(program, 'texture2'), 1);
  gl.uniform1f(gl.getUniformLocation(program, 'blend'), blend);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture1);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture2);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
