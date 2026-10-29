# Lighthouse island

[Back to Phase 4](../phase-4-island-art.md) · [AI model prompts](../phase-4-ai-prompts.md) · Previous: [Workshop](workshop.md)

**Status:** built on 2026-10-29. All 3 models generated (the base redrawn once for a round top) and placed; the lighthouse is interactive. Lamp height measured on the model. First layout, to be tuned from screenshots.

---

## 1. What this island is for

Kafbat Kafka UI, open-source contributor since February 2024. The island is a small lighthouse on a rock at the edge of the archipelago: a beacon others steer by, like an open-source project.

| Achievement                  | Object on the island |
| ---------------------------- | -------------------- |
| Built the authorization page | The lighthouse lamp  |

The panel lists the achievement with its "Show me" button, the tech chips and the link to the GitHub repository (already there).

---

## 2. The feeling

A lonely, friendly lighthouse at the edge of the sky, like a coastal lighthouse in a Miyazaki seaside town, but the sea is clouds. Calm and a little windswept.

- **Time of day:** the same warm late afternoon; the lamp is lit anyway.
- **Mood words:** steady, welcoming, windswept, small.
- **Accent colour:** red `#D94B4B` (already set in world.ts), with white.
- **Sound** (later, AI-made): wind, a gull, a soft foghorn on click.

---

## 3. How it looks from far away (overview)

The Lighthouse sits low and off to one side (`[−16, −6, 13]`, scale 0.85), the smallest island. It was planned at scale 0.6 and `x = −19`, but the focus camera stands at the same distance from every island, so it looked tiny there, with the Workshop hanging right above it. From the overview it must read as "a lighthouse", by silhouette alone:

- a tall white tower with red stripes and a glass lamp room on top,
- a slow light beam turning from the lamp room, visible from far away,
- a little wooden dock sticking out from the rock, with a small sky boat moored to it.

The beam is the island's signature: it can be seen sweeping over the other islands from the overview.

---

## 4. Layout

A small island, so no two rows: the lighthouse just behind the middle, the dock running out towards the front left (the way the generated base has it), the boat past the dock's end.

```
                    [ LIGHTHOUSE ]
        [mailbox]
  [boat] ===== dock
        front (towards the camera)
```

| Object     | Across, towards       | Size       | Notes                                                       |
| ---------- | --------------------- | ---------- | ----------------------------------------------------------- |
| Lighthouse | 1.0, −1.2             | 6.5 tall   | Landmark and the interactive object                         |
| Dock       | part of base          |            | The base is shifted so its round grass top is in the middle |
| Mailbox    | −1.5, 3.0             | 1.0 tall   | Home's, on the grass by the dock; not interactive           |
| Sky boat   | past the dock         | 2.5 long   | Just past the dock's end in open sky, bobbing and swaying   |
| Rocks      | 2.5, 1.5 · −2.4, −1.8 | shared kit | Two, free                                                   |

---

## 5. Objects

Same pattern as the other islands: hover glows gold with a hint, click plays a short reaction and sound, and the panel scrolls to the achievement. Reactions use only motion, light and gold tags (see the Workshop's reaction rule).

### The lighthouse lamp · Built the authorization page

The whole lighthouse is the object; its lamp is the star.

- **Idle:** a soft light beam (code-made light cone, like the Arena floodlights) turns slowly round from the lamp room, and the lamp glows warm.
- **Click:** the beam swings round to shine straight at the camera, the lamp flares up bright for a moment, and a gold tag "merged · in the release notes" pops up. Then the beam goes back to turning.

The original plan had the tooltip offer a link to the pull request. The panel already shows the GitHub link, so the tooltip stays the same as on every other island.

### Not interactive

- **Sky boat:** a small wooden boat with a sail, waiting just past the dock's end, bobbing and swaying gently (code).
- **Mailbox:** Home's mailbox on the grass by the dock, a small link back to Home.
- **Seagull:** one gull gliding in slow circles round the lighthouse (code-made from a few simple shapes, wings flapping now and then). A small character is what AI 3D builds worst, so it is not generated.

---

## 6. Models and cost

| #   | File              | Object                                                                  | Budget      |
| --- | ----------------- | ----------------------------------------------------------------------- | ----------- |
| 1   | `island-base.glb` | Small rocky island, grass to the edge, wooden dock out from one side    | 12,000 tris |
| 2   | `lighthouse.glb`  | White tower with red stripes, glass lamp room, gallery railing, red cap | 8,000       |
| 3   | `sky-boat.glb`    | Small wooden boat with a mast and a patched sail                        | 3,000       |

The mailbox and rocks are reused; the beam and the gull are code.

| Step               | Items | Credits  |
| ------------------ | ----- | -------- |
| Concept images     | 3     | 9        |
| Textured 3D models | 3     | 90       |
| Spare for retries  |       | ~40      |
| **Total**          |       | **~140** |

Balance: about 1,390 credits, so about 1,250 would be left. Spent: 12 for concepts (one base redraw) and 90 for models, so about 1,288 are left.

Lessons applied: three-quarter views with volume for every concept (multi-view ready if one comes out flat); grass right up to the edge on the base; the dock is part of the base, because a loose plank deck on its own would fail the flat-model check; the lamp room's glass left plain, with the light made in code; concepts shown for review before any 3D.

---

## 7. Decisions (2026-10-29)

1. **Sky boat:** yes, moored to the dock (3 models, about 140 credits).
2. **Seagull:** yes, code-made, circling the lighthouse.
3. **Click tag text:** "merged · in the release notes".
