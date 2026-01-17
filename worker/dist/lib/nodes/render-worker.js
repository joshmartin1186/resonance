/**
 * Render Worker - Child process for parallel frame rendering
 *
 * This worker receives a chunk of frames to render and processes them independently
 */
import gl from 'gl';
import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { calculateNodeOpacity } from './types.js';
import { renderGenerator } from './generators.js';
import { renderEffect } from './effects.js';
// Listen for work from parent
process.on('message', async (msg) => {
    if (msg.type === 'render') {
        try {
            await renderChunk(msg.chunk, msg.timeline, msg.audioFeatures, msg.outputDir, msg.width, msg.height, msg.fps);
            // Send completion message
            if (process.send) {
                process.send({ type: 'complete' });
            }
        }
        catch (error) {
            // Send error message
            if (process.send) {
                process.send({ type: 'error', error: error.message });
            }
            process.exit(1);
        }
    }
});
/**
 * Render a chunk of frames
 */
async function renderChunk(chunk, timeline, audioFeatures, outputDir, width, height, fps) {
    const { start, end, workerId } = chunk;
    // Create WebGL context
    const glContext = gl(width, height);
    // Create framebuffers
    const mainBuffer = createFramebuffer(glContext, width, height);
    const tempBuffer = createFramebuffer(glContext, width, height);
    // Render each frame in this chunk
    let framesDone = 0;
    for (let frame = start; frame < end; frame++) {
        const time = frame / fps;
        const audioFrame = frame;
        // Build render context
        const ctx = {
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
        // 1. Render generators
        const activeGenerators = timeline.nodes
            .filter(node => node.type === 'generator')
            .filter(node => calculateNodeOpacity(node, time) > 0);
        for (const generator of activeGenerators) {
            const opacity = calculateNodeOpacity(generator, time);
            // Render generator to temp buffer
            glContext.bindFramebuffer(glContext.FRAMEBUFFER, tempBuffer.framebuffer);
            glContext.clearColor(0, 0, 0, 0);
            glContext.clear(glContext.COLOR_BUFFER_BIT);
            renderGenerator(generator, ctx);
            // Composite onto main buffer
            compositeTexture(glContext, tempBuffer.texture, mainBuffer.framebuffer, opacity, width, height);
        }
        // 2. Apply effects
        const activeEffects = timeline.nodes
            .filter(node => node.type === 'effect')
            .filter(node => calculateNodeOpacity(node, time) > 0);
        let currentBuffer = mainBuffer;
        let nextBuffer = tempBuffer;
        for (const effect of activeEffects) {
            const opacity = calculateNodeOpacity(effect, time);
            ctx.inputBuffer = currentBuffer.texture;
            glContext.bindFramebuffer(glContext.FRAMEBUFFER, nextBuffer.framebuffer);
            glContext.clearColor(0, 0, 0, 0);
            glContext.clear(glContext.COLOR_BUFFER_BIT);
            renderEffect(effect, ctx);
            if (opacity < 1.0) {
                blendTextures(glContext, currentBuffer.texture, nextBuffer.texture, opacity, width, height);
            }
            [currentBuffer, nextBuffer] = [nextBuffer, currentBuffer];
        }
        // 3. Read pixels
        glContext.bindFramebuffer(glContext.FRAMEBUFFER, currentBuffer.framebuffer);
        const pixels = new Uint8Array(width * height * 4);
        glContext.readPixels(0, 0, width, height, glContext.RGBA, glContext.UNSIGNED_BYTE, pixels);
        // 4. Write frame
        const canvas = createCanvas(width, height);
        const canvasCtx = canvas.getContext('2d');
        const imageData = canvasCtx.createImageData(width, height);
        // Y-flip
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
        const framePath = join(outputDir, `frame_${String(frame).padStart(6, '0')}.png`);
        const buffer = canvas.toBuffer('image/png');
        writeFileSync(framePath, buffer);
        framesDone++;
        // Report progress every 10 frames
        if (framesDone % 10 === 0 && process.send) {
            process.send({ type: 'progress', framesDone });
        }
    }
    // Final progress update
    if (process.send) {
        process.send({ type: 'progress', framesDone });
    }
}
function createFramebuffer(gl, width, height) {
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
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { framebuffer, texture };
}
function compositeTexture(gl, srcTexture, dstFramebuffer, opacity, width, height) {
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
    gl.bindFramebuffer(gl.FRAMEBUFFER, dstFramebuffer);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1i(gl.getUniformLocation(program, 'srcTexture'), 0);
    gl.uniform1f(gl.getUniformLocation(program, 'opacity'), opacity);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, srcTexture);
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disable(gl.BLEND);
}
function blendTextures(gl, texture1, texture2, blend, width, height) {
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
//# sourceMappingURL=render-worker.js.map