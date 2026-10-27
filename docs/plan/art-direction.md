# Art direction

[Back to plan](../../PLAN.md)

The target feeling: a warm summer afternoon in a hand-painted anime film.
Bright saturated sky, huge soft clouds, lush greens, sunlit stone, little signs of life everywhere.
Inspired by Hayao Miyazaki films, never copied from them.

## Reference board

| Reference                                   | What to take from it                                                                                                                          |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Floating islands map with "You are here" | Island scale and spacing, the tag-style labels with icon, name and value, the speech bubble, dark silhouettes for locked or unvisited islands |
| 2. Anime street with convenience store      | Light: strong sun, blue shadows, crisp cumulus clouds, detail in small props                                                                  |
| 3. Pedestrian bridge and city               | Sky gradient from deep blue to near white at the horizon, clean outlines on man-made objects                                                  |
| 4. Cliff city with a train                  | The Market Town shape: houses stacked up a tall rock, a rail line running through                                                             |
| 5. Howl's castle model                      | The Workshop mood: patched metal, pipes, chimneys, mixed materials bolted together                                                            |
| 6. Colourful palace town and vintage cars   | Bunting flags, rich reds and greens, little vehicles that bring the town alive                                                                |
| 7. Lofi girl at her desk                    | The Home island interior seen through the window: lamp, plant, cat, warm light                                                                |

---

## Palette

Start with these values, tune them with leva in Phase 1, then freeze them in `materials/toon.ts` and CSS variables.

| Token          | Hex       | Used for                                |
| -------------- | --------- | --------------------------------------- |
| `sky-top`      | `#2E6FCF` | Sky at the zenith                       |
| `sky-horizon`  | `#BFE7F7` | Sky at the horizon, fog colour          |
| `cloud-light`  | `#FFFDF6` | Sunlit cloud tops                       |
| `cloud-shadow` | `#AFC3E6` | Cloud undersides, a cool lavender blue  |
| `grass-light`  | `#9BCB5A` | Lit grass                               |
| `grass-dark`   | `#4E8B3A` | Grass in shadow, bushes                 |
| `rock-light`   | `#D8B98C` | Sunlit rock                             |
| `rock-dark`    | `#8A6A52` | Rock undersides                         |
| `wood`         | `#9C6B43` | Fences, bridges, crates                 |
| `roof-red`     | `#C9573E` | Roofs, flags, the tram                  |
| `accent-gold`  | `#F3C25B` | Lights, beacons, highlights, hover glow |
| `outline`      | `#3A2E2A` | Outlines, never pure black              |
| `ink`          | `#2B2422` | UI text                                 |
| `paper`        | `#F7F0E1` | UI panels                               |

Rule of thumb: shadows are cool and bluish, light is warm and yellowish. Never use pure black or pure grey.

---

## Lighting

- **Sun.** One directional light, warm white `#FFF1D6`, from high front-left, so islands show a lit side and a shadow side from the overview camera.
- **Sky fill.** One hemisphere light: sky colour `#BFE7F7`, ground colour `#8A6A52`, low intensity. It tints shadows blue from above and warm from below.
- **Shadows.** Off in the overview. On only for the focused island, with a small shadow camera around it.
- **Local lights.** Window glow and beacons are emissive materials picked up by bloom, not real lights.

## Toon shading

Use `MeshToonMaterial` with a stepped gradient map. Three steps give the flat painted look.

```ts
// src/materials/toon.ts
import * as THREE from 'three';

export function createGradientMap(steps: number[] = [110, 190, 255]) {
  const tex = new THREE.DataTexture(new Uint8Array(steps), steps.length, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

export const gradientMap = createGradientMap();

const toon = (color: string) => new THREE.MeshToonMaterial({ color, gradientMap });

export const palette = {
  grass: toon('#9BCB5A'),
  grassDark: toon('#4E8B3A'),
  rock: toon('#D8B98C'),
  rockDark: toon('#8A6A52'),
  wood: toon('#9C6B43'),
  roof: toon('#C9573E'),
} as const;
```

Raise the first step for softer shadows, lower it for more dramatic ones.

## Outlines

- Use drei `<Outlines>` on buildings, props and interactive objects.
- Colour `#3A2E2A`, thin. Thicker outlines on hero objects make them read as clickable.
- Rocks, grass and trees get no outline, so nature stays soft and buildings stay crisp.

## Textures or vertex colours

- **Vertex colours** are the cheapest route and look very toon. Paint them in Blender, use `vertexColors` on the material.
- **Painted textures** add brush strokes. Keep them at 1024 pixels or less and share one atlas per island.
- Mix both: vertex colours for rocks and grass, small painted textures for signs, windows and the cottage interior.

---

## Clouds

- Clouds are the main character of the sky. Make them big, with bright flat-ish tops and cool shadowed bottoms.
- Three layers:
  1. **Cloud floor** far below the islands, dense and slow. It hides the "nothing" under the islands.
  2. **Mid clouds** between and behind islands, drifting slowly sideways.
  3. **Wisps** near the camera path, used mostly in the fly-in.
- Give cloud undersides the `cloud-shadow` colour and tops the `cloud-light` colour.

## Typography

| Use                     | Font               | Why                                           |
| ----------------------- | ------------------ | --------------------------------------------- |
| Titles, labels, buttons | Fredoka or Baloo 2 | Rounded and friendly, readable at small sizes |
| Body text in panels     | Nunito             | Soft, highly readable                         |

Self-host the fonts with `@fontsource` packages to avoid a flash of the wrong font.

## UI style

- **Labels** follow reference 1: a light square with an icon, then a dark rounded bar with the company name and years.
- **Panels** look like journal pages: `paper` background, a faint paper texture, a hand-drawn border, a small stamp with the island icon.
- **Buttons** are rounded pills with a slight shadow and a 2px press-down on click.
- **Top bar** is minimal and semi-transparent so the sky stays the hero.

## Motion language

| Motion                | Duration           | Easing                             |
| --------------------- | ------------------ | ---------------------------------- |
| Camera to island      | 1.2 to 1.6 s       | Smooth damping from CameraControls |
| Panel slide in        | 0.35 s             | Ease out                           |
| Hover scale           | 0.15 s             | Damped, scale 1.06 to 1.08         |
| Island bob            | 4 to 6 s per cycle | Sine, very small amplitude         |
| Object click reaction | 0.6 to 1.5 s       | Springy, a little overshoot        |

Everything that moves should look slightly springy and soft, never mechanical. The Workshop gears are the only exception.

## Sound

- **Ambient:** wind, distant birds, a soft piano or strings loop. Calm, never loud.
- **Per island:** radio static near Radio Tower, a distant crowd at the Arena, birds and water at the Grove, gentle machinery at the Workshop, tram bells at Market Town.
- **UI:** soft wooden clicks, a page rustle when the panel opens, a whoosh for the fly-in.
- **Sources:** Freesound (check each licence), Pixabay Music, or commissioned. Only CC0 or CC-BY with credit.
- Record every asset's licence in `CREDITS.md`.

## Do and don't

| Do                                                | Don't                                                                       |
| ------------------------------------------------- | --------------------------------------------------------------------------- |
| Original characters and props in a similar spirit | Totoro, kodama, soot sprites, Calcifer or any recognisable Ghibli character |
| Your own or licensed music in a similar mood      | Joe Hisaishi tracks or covers of them                                       |
| Warm, saturated colours with blue shadows         | Black shadows, grey fog, desaturated realism                                |
| Few, large, readable shapes                       | Lots of tiny detail that turns to noise at overview distance                |
