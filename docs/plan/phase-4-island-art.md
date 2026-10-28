# Phase 4. Island art

[Back to plan](../../PLAN.md) · Previous: [Phase 3](phase-3-welcome-flyin.md) · Next: [Phase 5. Interactive objects](phase-5-interactive-objects.md)

**Estimate:** 1 to 3 weeks, depending on the asset strategy
**Goal:** replace every placeholder with a real island that has its own character, while staying inside the performance budget.

This is the biggest and riskiest phase. The code is easy. The look depends on the models.
Build one island completely first, judge it on a phone, then do the rest.

---

## 1. Choose an asset strategy

| Strategy                     | Quality         | Speed   | Cost       | Notes                                                                                                       |
| ---------------------------- | --------------- | ------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| Model everything in Blender  | Highest, unique | Slowest | Free       | Needs learning time if new to Blender                                                                       |
| Free stylised packs, edited  | Good            | Fast    | Free       | Kenney, Quaternius, Poly Pizza, Sketchfab. Recolour with the palette.                                       |
| AI 3D generation, cleaned up | Varies          | Fast    | Paid tiers | Meshy, Tripo and similar. Check the licence allows commercial use. Clean up and reduce polygons in Blender. |
| 2.5D painted planes          | Very Ghibli     | Medium  | Free       | Painted images on layered planes. Cheap, but objects are harder to animate.                                 |

**Recommended mix:** packs for rocks, trees, bushes, fences and crates. Blender or AI generation for each island's landmark and its interactive objects, because those must match the story exactly.

- [x] Pick the strategy and write it down in `PLAN.md` under Key decisions. **Decided: AI-generated models with painterly textures.** You generate them from the prompts in [AI model prompts](phase-4-ai-prompts.md); I integrate them. Only the island art is AI-made; layout, animation and interaction stay in code.
- [ ] Create `CREDITS.md` and add every asset with author, licence and link as soon as you download it.

---

## 2. Blender rules

Agree on these before making the first model. They save hours of fixing later.

| Rule                                                                            | Why                                                    |
| ------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 1 unit equals 1 metre. An island top is about 10 to 14 units wide.              | Consistent scale across islands and packs              |
| Origin at the centre of the island's top surface                                | The island sits correctly at its `world.ts` position   |
| Apply all transforms before export                                              | Avoids scaled or rotated surprises in three.js         |
| Animated parts are separate objects, with their pivot where they rotate         | A gear spins around its axle, a dish around its base   |
| Interactive parts are named `INT_<objectId>`, for example `INT_radio-dish`      | Code finds them by name and wires them to achievements |
| Materials are named after palette tokens, for example `toon_grass`, `toon_rock` | Code swaps them for the shared toon materials          |
| Emissive parts are named `EMIT_<name>`                                          | Code gives them glowing materials that bloom picks up  |
| One GLB per island, plus one shared kit GLB                                     | Islands load independently, the kit is downloaded once |

## 3. Budgets per island

| Item                       | Budget                       |
| -------------------------- | ---------------------------- |
| Triangles, whole island    | 8,000 to 20,000              |
| Triangles, one hero object | 3,000 or fewer               |
| Texture size               | 1024 pixels or smaller, WebP |
| GLB size after compression | 1 MB or less                 |
| Draw calls, whole island   | 40 or fewer                  |

## 4. Export and convert

- [ ] Export from Blender as glTF Binary (`.glb`), with "Apply Modifiers" on and only the selected collection.
- [ ] Convert to a typed React component and compress in one step with gltfjsx.

```
npx gltfjsx public/models/radio.glb --transform --types --shadows --output src/islands/radio/RadioModel.tsx
```

`--transform` writes `radio-transformed.glb` next to the source with Draco compressed geometry, WebP textures resized to 1024 pixels, and merged duplicates.
Keep the original `.glb` out of `public` after converting, or add it to `.gitignore`, so it is not deployed.

- [ ] Preview models quickly at https://gltf.pmnd.rs before writing any code.
- [ ] KTX2 textures save GPU memory but need extra tools. Consider them only if Phase 7 shows memory problems on phones.

## 5. Materials for painted textures

**Decided look: painterly textures.** AI models keep their painted base-colour texture. Code wraps it in a toon material (`MeshToonMaterial` with the texture as `map`), so the brush strokes stay and the light still falls in soft bands, matching the sky and clouds. The palette-material swap below applies only to untextured kit pieces built in code.

gltfjsx gives you JSX with `material={materials.toon_grass}`. Replace those with the shared palette materials.

```tsx
// in RadioModel.tsx, after generating
<mesh geometry={nodes.Rock.geometry} material={palette.rock} />
<mesh geometry={nodes.Grass.geometry} material={palette.grass} />
```

For models from packs that you do not convert to JSX, swap materials by name once after loading.

```ts
// src/materials/applyToon.ts
export function applyToon(root: THREE.Object3D) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const name = (mesh.material as THREE.Material).name.replace('toon_', '');
    if (name in palette) mesh.material = palette[name as keyof typeof palette];
  });
}
```

For vertex-coloured models, use one shared `MeshToonMaterial` with `vertexColors: true`.

## 6. Shared kit

- [ ] Build or collect one shared kit: 3 rock shapes, 3 tree shapes, 2 bushes, grass tufts, a fence piece, a crate, a lantern, hanging roots and vines.
- [ ] Place repeated kit items with drei `Instances` or `Merged`, so 50 grass tufts cost one draw call.
- [ ] Add hanging roots and small rocks under every island. They sell the "floating" look more than anything on top.

## 7. Replace the route

- [ ] Replace the dashed line from Phase 2 with rope bridges for nearby islands or a flying tram cable for distant ones.
- [ ] Optional: a small airship or tram slowly travels the route, which adds life to the overview.

---

## 8. Island build sheets

Order of work: **Home first as the style test** (decided), then Radio Tower, then Market Town, Arena, Green Grove, Workshop, Lighthouse.

The interactive objects listed here are only modelled in this phase. They get their behaviour in [Phase 5](phase-5-interactive-objects.md#object-catalogue).

### Radio Tower · Radio Gigabit

Full design description: [islands/radio.md](islands/radio.md) (draft for review).

- **Base:** rocky island with grass patches and ferns, like reference 1.
- **Landmark:** tall lattice antenna tower with a blinking yellow beacon on top.
- **Objects to model:** satellite dish on a turntable, bunker lab with a yellow door, outdoor test rack with LED rows, terminal screen on a post, small helper robot, stack of shipping containers.
- **Ambient:** beacon blinks, faint radio rings pulse from the tower.
- **Accent:** `#F3C25B` signal yellow.

### Home · About

Full design description: [islands/home.md](islands/home.md).

- **Base:** round grassy island with a big tree, roots hanging from below.
- **Landmark:** small cottage with a round window. Through it you see a desk, lamp, plant and books, as in reference 7.
- **Objects to model:** cat on the windowsill, desk lamp, mailbox with a flag, bookshelf, globe.
- **Ambient:** chimney smoke, tree sway, warm window glow.
- **Accent:** `#E08A3C` warm orange.

### Market Town · Monetech

- **Base:** a tall narrow cliff with houses stacked up its sides, as in reference 4. The tallest island on the map.
- **Landmark:** a domed bank on top, bunting flags across streets, as in reference 6.
- **Objects to model:** tram loop with 7 carriages, coin fountain in a square, an old wooden shack next to a modern glass building, signpost with 6 arms, building crane with stackable blocks, hot-air balloon on a launch pad.
- **Ambient:** tram moves, flags flutter, birds circle.
- **Accent:** `#C9573E` terracotta with gold.

### Arena · Olimpbet KZ

- **Base:** wide flat disc island.
- **Landmark:** small open-air stadium with four floodlight towers.
- **Objects to model:** big scoreboard, three screens (phone, desktop, gate with a lock), a parcel box, two towers with facing windows.
- **Ambient:** flags wave, floodlights glow softly.
- **Accent:** `#3C7DD9` stadium blue.

### Green Grove · Eco Activists

- **Base:** mossy rock with a waterfall pouring off one edge into the clouds.
- **Landmark:** a huge old tree with a little shrine under it.
- **Objects to model:** three recycling bins in different colours with litter nearby, a row of saplings, a wooden planning board, small original forest spirits.
- **Ambient:** falling leaves, waterfall, birds.
- **Accent:** `#4E8B3A` forest green.

### Workshop · JSC NPP Salyut

- **Base:** rock patched with riveted metal plates and pipes sticking out, in the mood of reference 5.
- **Landmark:** brick factory with two chimneys and giant gears on its side.
- **Objects to model:** gear wall, workbench with an oscilloscope, circuit board on an easel, group of small worker figures, rolled scroll on a lectern.
- **Ambient:** steam puffs, gears turn slowly.
- **Accent:** `#B8733A` copper.

### Lighthouse · Kafka UI

- **Base:** tiny rock with a small wooden dock.
- **Landmark:** white and red lighthouse.
- **Objects to model:** the lamp room, a mailbox on the dock.
- **Ambient:** rotating beam, a seagull.
- **Accent:** red and white.

---

## Acceptance criteria

For each island:

- [ ] It is recognisable from the overview by silhouette alone.
- [ ] It stays inside the triangle, texture and file size budgets.
- [ ] Every interactive object exists as a separate, correctly named node.
- [ ] Every asset is listed in `CREDITS.md`.
- [ ] It looks good on a phone at the overview distance and in focus.

## Pitfalls

- **Too much detail.** Small detail turns into noise from the overview. Exaggerate the big shapes instead.
- **Mixed styles.** Assets from different packs clash. Recolour everything with the palette and use the same outline settings.
- **Huge files.** One unoptimised model can be 30 MB. Always run `--transform` and check the size.
- **Wrong pivot.** A gear that wobbles instead of spinning has its origin in the wrong place. Fix it in Blender, not in code.
