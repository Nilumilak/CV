/**
 * Soft light made without shapes, shared by islands with lamps: a glare texture for
 * sprites and an additive beam material for open cones. Nothing has a hard edge.
 */
import * as THREE from 'three';

/** Warm white glare: bright core, quick falloff, long faint tail. */
export function glareTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const g = canvas.getContext('2d')!;
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255, 252, 240, 1)');
  r.addColorStop(0.12, 'rgba(255, 244, 214, 0.75)');
  r.addColorStop(0.35, 'rgba(255, 232, 190, 0.22)');
  r.addColorStop(1, 'rgba(255, 228, 180, 0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Additive light-beam material: strongest at the lamp end (top of the cylinder), fading
 * towards the pitch, and fading where the cone's surface turns side-on to the viewer, so
 * its outline never shows.
 */
export function beamShader() {
  return new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color('#fff2d6') }, strength: { value: 0.22 } },
    vertexShader: /* glsl */ `
      varying float vAlong;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vAlong = uv.y; // 1 at the lamp end, 0 at the far end
        vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-viewPos.xyz);
        gl_Position = projectionMatrix * viewPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 color;
      uniform float strength;
      varying float vAlong;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float facing = abs(dot(normalize(vNormal), normalize(vView)));
        float a = strength * pow(vAlong, 1.8) * pow(facing, 1.5);
        gl_FragColor = vec4(color * a, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
}
