import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { colors } from '@/materials/toon';
import { SUN_DIRECTION } from './sky';

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uBottom;
  uniform vec3 uSunColor;
  uniform vec3 uSunDir;
  uniform float uExponent;
  uniform float uSunSize;
  varying vec3 vDir;

  void main() {
    vec3 dir = normalize(vDir);
    float h = dir.y;

    // Painted gradient: deep blue overhead, pale at the horizon, light haze below.
    // 1 - (1 - x)^k has a finite slope at the horizon, so there is no visible seam.
    vec3 col = h > 0.0
      ? mix(uHorizon, uTop, 1.0 - pow(1.0 - h, uExponent))
      : mix(uHorizon, uBottom, 1.0 - pow(1.0 + h, 3.0));

    // Sun: a crisp disc plus a wide warm glow.
    float d = max(dot(dir, uSunDir), 0.0);
    // Glow is added as light, so it warms the blue instead of turning it grey.
    float disc = smoothstep(uSunSize, uSunSize + 0.00012, d);
    float glow = pow(d, 8.0) * 0.18 + pow(d, 90.0) * 0.45 + pow(d, 900.0) * 0.6;
    col += uSunColor * glow;
    col = mix(col, vec3(1.0, 0.99, 0.95), disc);

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>

    // Dither by less than one colour step to hide banding in the smooth gradient.
    float noise = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    gl_FragColor.rgb += (noise - 0.5) / 255.0;
  }
`;

interface SkyDomeProps {
  top?: string;
  horizon?: string;
  bottom?: string;
  /** How quickly the sky turns deep blue above the horizon. Higher is faster. */
  exponent?: number;
}

/** Huge inverted sphere with a gradient sky and a sun. It follows the camera, so it never clips. */
export function SkyDome({
  top = colors.skyTop,
  horizon = colors.skyHorizon,
  bottom = colors.skyBottom,
  exponent = 3.2,
}: SkyDomeProps) {
  const ref = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color(colors.skyTop) },
      uHorizon: { value: new THREE.Color(colors.skyHorizon) },
      uBottom: { value: new THREE.Color(colors.skyBottom) },
      uSunColor: { value: new THREE.Color(colors.sun) },
      uSunDir: { value: SUN_DIRECTION.clone() },
      uExponent: { value: 3.2 },
      // cos of the sun's angular radius
      uSunSize: { value: Math.cos(THREE.MathUtils.degToRad(1.4)) },
    }),
    [],
  );

  useEffect(() => {
    const u = materialRef.current.uniforms;
    u.uTop.value.set(top);
    u.uHorizon.value.set(horizon);
    u.uBottom.value.set(bottom);
    u.uExponent.value = exponent;
  }, [top, horizon, bottom, exponent]);

  useFrame(({ camera }) => {
    ref.current.position.copy(camera.position);
  });

  return (
    <mesh ref={ref} scale={900} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[1, 48, 24]} />
      <shaderMaterial
        ref={materialRef}
        args={[{ uniforms, vertexShader, fragmentShader }]}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}
