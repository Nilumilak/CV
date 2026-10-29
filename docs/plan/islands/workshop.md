# Workshop island

[Back to Phase 4](../phase-4-island-art.md) · [AI model prompts](../phase-4-ai-prompts.md) · Previous: [Green Grove](grove.md)

**Status:** built on 2026-10-29. All 7 models generated and placed; all four achievement objects interactive. Screen, board, chimney and wall positions measured on the models; the lectern's sheet position is estimated. First layout, to be tuned from screenshots.

---

## 1. What this island is for

JSC NPP Salyut, Design Engineer (1st category, senior grade), Nizhny Novgorod, June 2015 to April 2020. Precision electronics: frequency synthesizers, power supplies, frequency stabilizers. The island is an old brick workshop that still hums: chimneys puffing, gears turning, instruments on the bench.

| Achievement                                | Object on the island           |
| ------------------------------------------ | ------------------------------ |
| Led 5+ government-funded projects (5 + 15) | Brass steam whistle            |
| 30+ precision electronics projects         | Workbench with an oscilloscope |
| Assemblies of 100+ high-precision elements | Big circuit board on an easel  |
| Python macros for documents                | Scroll on a lectern            |

The panel lists all four achievements and the tech chips, each with a "Show me" button.

---

## 2. The feeling

A cosy old engineering workshop on a hilltop: red brick, copper pipes, brass instruments, a warm glow from the windows. Industrious but gentle, more watchmaker's shop than heavy industry.

- **Time of day:** the same warm late afternoon.
- **Mood words:** crafted, precise, warm, humming.
- **Accent colour:** copper `#B8733A`.
- **Sound** (later, AI-made): gears ticking, a soft steam hiss, a whistle.

---

## 3. How it looks from far away (overview)

Workshop sits far left (`[−30, 3, −8]`). From the overview it must read as "a little factory", by silhouette alone:

- a red-brick workshop with two tall chimneys puffing smoke,
- big brass gears turning slowly on its side wall,
- a rock base patched with riveted metal plates and pipes.

---

## 4. Layout

The two-row rule: the factory at the back, the four objects in front and at the side, each in its own column.

```
            [ BRICK FACTORY, two chimneys ]  ⚙ ⚙ gears on its side
  [WORKBENCH + scope]                                 [STEAM WHISTLE]
              [CIRCUIT BOARD]        [LECTERN + scroll]
                     front (towards the camera)
```

| Object        | Across, towards | Size         | Notes                                         |
| ------------- | --------------- | ------------ | --------------------------------------------- |
| Factory       | 0, −3.0         | 4.5 tall     | Landmark; chimneys puff smoke (code)          |
| Gears ×3      | on the factory  | 0.8–1.4 wide | One model, three sizes, turning slowly (code) |
| Workbench     | −3.0, 0.4       | 1.2 tall     | Left side, oscilloscope facing the camera     |
| Circuit board | −1.2, 2.6       | 1.6 tall     | Front left, on an easel                       |
| Lectern       | 1.6, 2.6        | 1.3 tall     | Front right, scroll on top                    |
| Steam whistle | 3.6, 0.0        | 1.2 tall     | Right side                                    |
| Rocks         | edges           | shared kit   | A few, free                                   |

---

## 5. Objects

Same pattern as the other islands: hover glows gold with a hint, click plays a short reaction and sound, and the panel scrolls to the achievement.

### Brass steam whistle · Led 5+ government-funded projects

A brass factory steam whistle on a short pipe stand with a valve wheel.

- **Click:** the whistle shakes and blows a puff of steam, and a gold tag "5 developers · 15 workers" pops up above it.

This replaces the plan's "group of small worker figures": small characters are what AI 3D builds worst (flat or misshapen), and the tag tells the same story.

### Workbench with an oscilloscope · 30+ precision electronics projects

A sturdy wooden workbench with an old oscilloscope on it (plain dark-green screen), a soldering iron and a few parts.

- **Idle:** the screen and the desk lamp glow faintly.
- **Click:** the oscilloscope screen glows up green and the desk lamp warm, then both fade back (light only, like the Radio bunker door).

### Big circuit board on an easel · Assemblies of 100+ high-precision elements

A large green circuit board with copper traces, standing on a wooden easel.

- **Click:** a soft light sweeps across in front of the board from one corner to the other, catching its real chips and traces as it passes.

### Scroll on a lectern · Python macros for documents

A wooden lectern with a rolled paper scroll lying on top.

- **Click:** a few loose pages flutter up out of the scroll and drift back down, and a gold tag "faster, fewer errors" pops up.

### Not interactive

- **Factory:** red brick, arched windows with a warm glow, two tall chimneys; smoke puffs from both (code, like Home's chimney).
- **Gears:** three brass gears of different sizes on the factory's side wall, turning slowly against each other (code-driven; one gear model).

---

## 6. Models and cost

| #   | File                | Object                                                                      | Budget      |
| --- | ------------------- | --------------------------------------------------------------------------- | ----------- |
| 1   | `island-base.glb`   | Rock patched with metal plates and pipes; top grass and cobbles to the edge | 15,000 tris |
| 2   | `factory.glb`       | Red-brick workshop with two chimneys                                        | 8,000       |
| 3   | `gear.glb`          | One brass gear (placed ×3)                                                  | 1,500       |
| 4   | `whistle.glb`       | Brass steam whistle on a pipe stand                                         | 1,500       |
| 5   | `workbench.glb`     | Workbench with an oscilloscope                                              | 4,000       |
| 6   | `circuit-board.glb` | Big circuit board on an easel                                               | 2,500       |
| 7   | `lectern.glb`       | Wooden lectern with a rolled scroll                                         | 2,000       |

| Step               | Items | Credits  |
| ------------------ | ----- | -------- |
| Concept images     | 7     | 21       |
| Textured 3D models | 7     | 210      |
| Spare for retries  |       | ~33      |
| **Total**          |       | **~265** |

Balance: about 1,620 credits, so about 1,355 would be left.

Lessons applied: three-quarter views with volume for every concept (and multi-view ready if one comes out flat); grass and cobbles right up to the edge on the base; screen and board faces left plain for code-made pictures; one gear model reused; concepts shown for review before any 3D.

---

## 7. Decisions (2026-10-29)

All six proposals accepted as written: the steam whistle with 20 hard hats (5 developers, 15 workers), the oscilloscope's sine wave, the circuit board lighting up, the scroll with Python code and the stamp, three gears turning on the factory wall, and about 265 credits.

**Reaction rule (revised 2026-10-29).** Once built, the first reactions (hard hats, the sine wave, board lights, the unrolling sheet) were rejected: the models' faces are not flat, so pictures drawn over them float or cut through. Reactions now use only whole-object motion, light, small separate flying bits and gold tags, as section 5 describes. The gears and chimney smoke stay.
