# Phase 1. Sky world

[Back to plan](../../PLAN.md) · Previous: [Phase 0](phase-0-setup.md) · Next: [Phase 2. Islands and navigation](phase-2-islands-navigation.md)

**Estimate:** 2 to 3 days
**Goal:** an empty but beautiful sky that already feels like the film: gradient sky, warm sun, layered clouds, toon lighting.

Read [Art direction](art-direction.md) before starting.

---

## Tasks

### 1. Canvas settings
- [ ] Move the Canvas into `src/scenes/WorldCanvas.tsx` with the settings from [Architecture](architecture.md#app-composition).
- [ ] Keep `flat` on. Painted colours stay exactly as picked, without tone mapping washing them out.
- [ ] Set the camera far plane to about 1200 so the sky dome and distant clouds are never clipped.

### 2. Sky dome
- [ ] Create `src/world/SkyDome.tsx`: a large inverted sphere with a vertical gradient shader.

```tsx
// src/world/SkyDome.tsx
import * as THREE from 'three';
import { useMemo } from 'react';

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uBottom;
  uniform float uExponent;
  varying vec3 vDir;
  void main() {
    float h = vDir.y;
    vec3 col = h > 0.0
      ? mix(uHorizon, uTop, pow(h, uExponent))
      : mix(uHorizon, uBottom, pow(-h, 0.6));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

export function SkyDome({ top = '#2E6FCF', horizon = '#BFE7F7', bottom = '#DCEFF7' }) {
  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color(top) },
      uHorizon: { value: new THREE.Color(horizon) },
      uBottom: { value: new THREE.Color(bottom) },
      uExponent: { value: 0.7 },
    }),
    [top, horizon, bottom],
  );
  return (
    <mesh scale={900} renderOrder={-1}>
      <sphereGeometry args={[1, 48, 24]} />
      <shaderMaterial
        args={[{ uniforms, vertexShader, fragmentShader }]}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}
```

- [ ] Make the dome follow the camera position each frame, so the horizon never shifts when the camera moves.

```tsx
const ref = useRef<THREE.Mesh>(null!);
useFrame(({ camera }) => ref.current.position.copy(camera.position));
```

### 3. Fog
- [ ] Add linear fog in the horizon colour, so distant islands melt into the sky.

```tsx
<fog attach="fog" args={['#BFE7F7', 60, 260]} />
```

- [ ] Tune near and far with leva once islands exist. Far islands should be softer but still readable.

### 4. Lighting
- [ ] Create `src/world/Lighting.tsx` with one hemisphere light and one warm directional sun, as described in [Art direction](art-direction.md#lighting).
- [ ] Keep shadows off for now.
- [ ] Add a sun disc: a small bright billboard far away in the sun's direction. Bloom will make it glow in Phase 6.

### 5. Toon material kit
- [ ] Create `src/materials/toon.ts` with the gradient map and palette materials from [Art direction](art-direction.md#toon-shading).
- [ ] Use the palette materials everywhere instead of creating new materials in components.

### 6. Cloud layers
- [ ] Create `src/world/CloudLayers.tsx` with drei `Clouds`. All cloud groups go inside one `Clouds` parent so they share one draw call.

```tsx
// src/world/CloudLayers.tsx (sketch)
import { Clouds, Cloud } from '@react-three/drei';
import * as THREE from 'three';

export function CloudLayers() {
  return (
    <Clouds material={THREE.MeshLambertMaterial} limit={300}>
      {/* 1. cloud floor far below the islands */}
      <Cloud seed={1} position={[0, -40, 0]} bounds={[160, 6, 160]} segments={60}
             volume={40} color="#FFFDF6" fade={200} speed={0.05} />
      {/* 2. mid clouds between islands */}
      <Cloud seed={2} position={[-40, 4, -30]} bounds={[20, 4, 8]} segments={18}
             volume={12} color="#FFFDF6" speed={0.1} />
      <Cloud seed={3} position={[45, 8, -40]} bounds={[24, 5, 10]} segments={20}
             volume={14} color="#FFFDF6" speed={0.1} />
      {/* 3. wisps on the fly-in path, added in Phase 3 */}
    </Clouds>
  );
}
```

- [ ] Use `MeshLambertMaterial` so the clouds react to the sun and get shaded bottoms.
- [ ] Tint undersides by giving the hemisphere light a bluish ground colour, or try the `cloud-shadow` colour on lower clouds.
- [ ] Make the clouds drift: animate the group position slowly in `useFrame`, and wrap around when they go too far.

### 7. Below the islands
- [ ] Decide what is far below. Recommended: the dense cloud floor from task 6. It hides the void, fits floating islands and is cheaper than water.
- [ ] Optional: a low-poly ocean, as in reference 1, visible through gaps in the cloud floor.

### 8. Debug controls
- [ ] Add leva controls for sky colours, fog distances, sun direction and intensity, hemisphere intensity and cloud opacity.
- [ ] When the look is right, copy the values into `toon.ts` and the components, and remove the controls you no longer need.

### 9. Temporary camera
- [ ] Keep OrbitControls for now so you can look around. CameraControls replaces it in Phase 2.

---

## Acceptance criteria

- [ ] The sky looks warm and painted from every angle, with no visible seams or clipping.
- [ ] Clouds drift slowly and look lit from the sun side.
- [ ] 60 FPS on your laptop with `?debug` open, and fewer than 30 draw calls.
- [ ] A screenshot of the empty sky already feels like the references.

## Pitfalls

- **Washed-out colours.** If colours look grey, check that `flat` is on and that the shader includes `colorspace_fragment`.
- **Cloud overdraw.** Each cloud segment is a transparent sprite. Too many large ones kill performance on phones. Watch the FPS while adding clouds.
- **Fog on the sky.** The sky dome must have `fog={false}`, otherwise it turns a flat colour.
- **Transparent sorting.** If clouds flicker in front of each other, keep them all inside one `Clouds` parent and avoid other transparent objects overlapping them.

## Resources

- drei Clouds: https://drei.docs.pmnd.rs/staging/clouds
- three.js toon material example: https://threejs.org/examples/#webgl_materials_toon
