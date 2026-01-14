import React, { useRef, useMemo } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
const fragmentShader = `
uniform float time;
uniform vec2 resolution;
uniform vec3 primaryColor;
uniform vec3 secondaryColor;
uniform vec3 accentColor;
uniform float intensity;
uniform float energy;
uniform float bass;
uniform float mid;
uniform float high;

// 3D Perlin noise implementation
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float noise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// Fractal Brownian Motion
float fbm(vec3 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    value += amplitude * noise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }

  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 p = (gl_FragCoord.xy - 0.5 * resolution) / min(resolution.x, resolution.y);

  float timeScale = time * (0.5 + energy * 1.5);
  float noiseScale = 2.0 + bass * 3.0;

  vec3 pos = vec3(p * noiseScale, timeScale);

  int octaves = 3 + int(intensity * 3.0);
  float n = fbm(pos, octaves);

  // Distort based on mid frequencies
  vec2 distortion = vec2(
    fbm(pos + vec3(5.2, 1.3, timeScale), 4),
    fbm(pos + vec3(8.4, 2.1, timeScale), 4)
  ) * mid * 0.3;

  p += distortion;
  pos = vec3(p * noiseScale, timeScale);
  n = fbm(pos, octaves);

  // Map noise to colors
  float t = n * 0.5 + 0.5;
  vec3 color = mix(primaryColor, secondaryColor, t);
  color = mix(color, accentColor, pow(t, 2.0 + high * 2.0));

  // Add high-frequency sparkle
  float sparkle = noise(pos * 10.0) * high;
  color += vec3(sparkle) * 0.2;

  gl_FragColor = vec4(color, 1.0);
}
`;
export const PerlinNoiseShader = ({ primaryColor, secondaryColor, accentColor, intensity, audioFeatures, }) => {
    const frame = useCurrentFrame();
    const { width, height, fps } = useVideoConfig();
    const canvasRef = useRef(null);
    const hexToRgb = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return [r, g, b];
    };
    const uniforms = useMemo(() => ({
        time: { value: frame / fps },
        resolution: { value: new THREE.Vector2(width, height) },
        primaryColor: { value: new THREE.Vector3(...hexToRgb(primaryColor)) },
        secondaryColor: { value: new THREE.Vector3(...hexToRgb(secondaryColor)) },
        accentColor: { value: new THREE.Vector3(...hexToRgb(accentColor)) },
        intensity: { value: intensity },
        energy: { value: audioFeatures.energy },
        bass: { value: audioFeatures.bass },
        mid: { value: audioFeatures.mid },
        high: { value: audioFeatures.high },
    }), [frame, fps, width, height, primaryColor, secondaryColor, accentColor, intensity, audioFeatures]);
    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const renderer = new THREE.WebGLRenderer({ canvas });
        renderer.setSize(width, height);
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const material = new THREE.ShaderMaterial({
            fragmentShader,
            uniforms,
        });
        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        renderer.render(scene, camera);
        return () => {
            renderer.dispose();
        };
    }, [uniforms, width, height]);
    return <canvas ref={canvasRef} width={width} height={height}/>;
};
//# sourceMappingURL=PerlinNoise.js.map