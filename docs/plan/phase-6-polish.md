# Phase 6. Polish

[Back to plan](../../PLAN.md) · Previous: [Phase 5](phase-5-interactive-objects.md) · Next: [Phase 7. Performance, mobile, accessibility](phase-7-performance-mobile-a11y.md)

**Estimate:** 3 to 5 days
**Goal:** the difference between "a 3D site" and "a world". Light that glows, air that moves, sound that breathes, UI that feels hand-made.

Every item here must respect the `quality` setting from the store. Low quality turns off the expensive ones.

---

## Tasks

### 1. Post effects
- [ ] Create `src/world/Effects.tsx`.

```tsx
// src/world/Effects.tsx (sketch)
import { EffectComposer, Bloom, Vignette, HueSaturation, BrightnessContrast, DepthOfField }
  from '@react-three/postprocessing';

export function Effects() {
  const quality = useWorld((s) => s.quality);
  const focused = useWorld((s) => s.focused);
  if (quality === 'low') return null;

  return (
    <EffectComposer multisampling={4}>
      <Bloom mipmapBlur luminanceThreshold={0.85} intensity={0.6} />
      <HueSaturation saturation={0.08} />
      <BrightnessContrast contrast={0.06} />
      {focused ? <DepthOfField focusDistance={0.02} focalLength={0.05} bokehScale={2} /> : <></>}
      <Vignette offset={0.25} darkness={0.45} />
    </EffectComposer>
  );
}
```

- [ ] Bloom should only catch emissive things: beacon, windows, lamp, sun disc. Raise `luminanceThreshold` if grass starts glowing.
- [ ] Depth of field only in focus mode and only on high quality. It is the most expensive effect.
- [ ] Compare with and without each effect. Remove any effect you cannot clearly see.

### 2. Ambient life
- [ ] **Birds.** A few small flocks of instanced V-shaped birds that follow slow looping curves. Wings flap by scaling a vertex attribute or the mesh on Y.
- [ ] **Waterfalls.** On the Grove and maybe Home: a curved strip with a scrolling stylised water texture, ending in a puff of mist in the clouds below. Very Ghibli, cheap.
- [ ] **Smoke.** Chimney smoke on Home and Workshop: a handful of soft sprites rising, growing and fading.
- [ ] **Falling leaves and floating motes.** drei `Sparkles` in warm colours around trees. Instanced leaves on the Grove.
- [ ] **Wind.** Grass and tree tops sway with a vertex shader. Use `three-custom-shader-material` to add a time-based offset on top of the toon material.
- [ ] **Hanging roots and vines.** Gentle sway under every island.

### 3. Light details
- [ ] Sun disc with bloom, slightly warm.
- [ ] Optional god rays from the sun through clouds. Only on high quality.
- [ ] Soft contact shadow under objects on the focused island. drei `ContactShadows` baked once with `frames={1}` is cheap.
- [ ] Turn on the directional light's shadow only for the focused island, with a tight shadow camera around it.

### 4. UI polish
- [ ] Panel opens like a journal page: a quick slide plus a slight rotation that settles.
- [ ] Achievements fade in one after another with a small stagger.
- [ ] Labels pop in with a little bounce when the overview appears.
- [ ] A soft page-rustle sound when the panel opens.
- [ ] Paper texture and hand-drawn border on the panel.
- [ ] Optional custom cursor: a small paper plane that tilts in the movement direction. Keep the system cursor on touch devices.

### 5. Sound design
- [ ] Per-island ambience with drei `PositionalAudio`, or simple distance-based volume through howler: radio static, crowd, birds and water, machinery, tram bells.
- [ ] Lower the ambient music slightly when an island is focused, so the island's own sound comes through.
- [ ] Check the overall mix on laptop speakers and on headphones. Nothing should be startling.

### 6. First visit touches
- [ ] "You are here" bubble on Home for first-time visitors, as in reference 1.
- [ ] A subtle hint "Click an island" if nothing has been clicked after 8 seconds in the overview.

### 7. Optional golden hour
- [ ] A small toggle that blends sky, sun and fog colours to a sunset palette and switches on all window and lantern glows. Fun, and a good test of the palette system.

---

## Acceptance criteria

- [ ] Every island has at least two kinds of ambient motion.
- [ ] Bloom touches only emissive objects.
- [ ] Low quality mode still looks good, just simpler.
- [ ] The UI feels hand-made, not like a standard component library.
- [ ] Frame rate still meets the targets in [Phase 7](phase-7-performance-mobile-a11y.md#budgets).

## Pitfalls

- **Effects stack up cost quickly.** Measure FPS after adding each effect.
- **Bloom on the whole sky.** The bright horizon can bloom. Keep the threshold high or darken the sky slightly.
- **Motion overload.** If everything moves, nothing stands out. Interactive objects should move more noticeably than background details.
