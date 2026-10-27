# Phase 1. Sky world

[Back to plan](../../PLAN.md) · Previous: [Phase 0](phase-0-setup.md) · Next: [Phase 2. Islands and navigation](phase-2-islands-navigation.md)

**Estimate:** 2 to 3 days
**Goal:** an empty but beautiful sky that already feels like the film: gradient sky, warm sun, layered clouds, toon lighting.

Read [Art direction](art-direction.md) before starting.

---

## Tasks

### 1. Canvas settings

- [x] Move the Canvas into `src/scenes/WorldCanvas.tsx` with the settings from [Architecture](architecture.md#app-composition).
- [x] Keep `flat` on. Painted colours stay exactly as picked, without tone mapping washing them out.
- [x] Set the camera far plane to about 1200 so the sky dome and distant clouds are never clipped.

### 2. Sky dome

- [x] Create `src/world/SkyDome.tsx`: a large inverted sphere with a vertical gradient shader.

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

- [x] Make the dome follow the camera position each frame, so the horizon never shifts when the camera moves.

```tsx
const ref = useRef<THREE.Mesh>(null!);
useFrame(({ camera }) => ref.current.position.copy(camera.position));
```

### 3. Fog

- [x] Add linear fog in the horizon colour, so distant islands melt into the sky.

```tsx
<fog attach="fog" args={['#BFE7F7', 60, 260]} />
```

- [ ] Tune near and far with leva once islands exist (Phase 2). Far islands should be softer but still readable.

### 4. Lighting

- [x] Create `src/world/Lighting.tsx` with one hemisphere light and one warm directional sun, as described in [Art direction](art-direction.md#lighting).
- [x] Keep shadows off for now.
- [x] ~~Add a sun disc billboard~~ The sun disc and its glow are drawn by the sky shader instead, so there is no extra object. Bloom can still pick it up in Phase 6.

### 5. Toon material kit

- [x] Create `src/materials/toon.ts` with the gradient map and palette materials from [Art direction](art-direction.md#toon-shading).
- [x] Use the palette materials everywhere instead of creating new materials in components.

### 6. Cloud layers

- [x] Create `src/world/CloudLayers.tsx` with drei `Clouds`. All cloud groups go inside one `Clouds` parent so they share one draw call.

```tsx
// src/world/CloudLayers.tsx (sketch)
import { Clouds, Cloud } from '@react-three/drei';
import * as THREE from 'three';

export function CloudLayers() {
  return (
    <Clouds material={THREE.MeshLambertMaterial} limit={300}>
      {/* 1. cloud floor far below the islands */}
      <Cloud
        seed={1}
        position={[0, -40, 0]}
        bounds={[160, 6, 160]}
        segments={60}
        volume={40}
        color="#FFFDF6"
        fade={200}
        speed={0.05}
      />
      {/* 2. mid clouds between islands */}
      <Cloud
        seed={2}
        position={[-40, 4, -30]}
        bounds={[20, 4, 8]}
        segments={18}
        volume={12}
        color="#FFFDF6"
        speed={0.1}
      />
      <Cloud
        seed={3}
        position={[45, 8, -40]}
        bounds={[24, 5, 10]}
        segments={20}
        volume={14}
        color="#FFFDF6"
        speed={0.1}
      />
      {/* 3. wisps on the fly-in path, added in Phase 3 */}
    </Clouds>
  );
}
```

- [x] ~~Use `MeshLambertMaterial`~~ Puffs always face the camera, so lighting cannot shade them top to bottom. Clouds use `MeshBasicMaterial` with explicit colours instead.
- [x] Tint undersides by giving the hemisphere light a bluish ground colour, or try the `cloud-shadow` colour on lower clouds.
- [x] Make the clouds drift: animate the group position slowly in `useFrame`, and wrap around when they go too far.

### 7. Below the islands

- [x] Decide what is far below. Recommended: the dense cloud floor from task 6. It hides the void, fits floating islands and is cheaper than water.
- [ ] Optional: a low-poly ocean, as in reference 1, visible through gaps in the cloud floor. Skipped for now.

### 8. Debug controls

- [x] Add leva controls for sky colours, fog distances, and sun and hemisphere intensity. Sun direction and cloud controls were left out: the sun direction must match the sky shader, and cloud props rebuild every puff when they change.
- [ ] When the look is right, copy the values into `toon.ts` and the components. Do this once islands exist in Phase 2.

### 9. Temporary camera

- [x] Keep OrbitControls for now so you can look around. CameraControls replaces it in Phase 2.

---

## Acceptance criteria

- [x] The sky looks warm and painted from every angle, with no visible seams or clipping.
- [x] Clouds drift slowly. They have bright tops and cool-blue bases instead of real lighting.
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

---

## Progress notes

- **Sky.** The gradient uses `1 - (1 - h)^k`, which has a finite slope at the horizon. A plain `pow(h, k)` left a visible seam there. A tiny per-pixel dither hides banding.
- **Sun.** The disc and glow live in the sky shader, with the glow added as light. Mixing it in turned the blue grey.
- **Clouds.** drei's default puff texture comes from a third-party CDN, so `cloudTexture.ts` draws one on a canvas at startup. Each cumulus is a bright top over a cool, narrower base set slightly behind it. drei's `bounds` are half-sizes.
- **Overdraw.** About 200 puffs in one instanced draw call. An earlier version with about 375 large puffs froze the CPU-rendered test browser, which is a warning for phones. Keep the total under about 220.
- **Fog.** Pushed to 80 to 380 units, and the lower sky was tinted to match it. Far floor puffs otherwise showed as darker ghost disks.
- **Debug camera.** `?cam=x,y,z&look=x,y,z` sets the start camera, which is handy for screenshots.
- **Tests.** Playwright now serves the build in-process. A separate server process took over six minutes to stop on Windows. Browser tests run in about 20 seconds.
- **Measured.** 3 draw calls and about 2,600 triangles. FPS still needs checking on a real GPU. The test browser renders on the CPU at about 11 FPS.
