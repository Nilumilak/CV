# Arena island

[Back to Phase 4](../phase-4-island-art.md) · [AI model prompts](../phase-4-ai-prompts.md) · Previous: [Market Town](market.md)

**Status:** built on 2026-10-29. All 6 models generated and placed; all four achievement objects interactive. Screen, scoreboard, window and floodlight positions were measured on the models themselves. First layout, to be tuned from screenshots.

---

## 1. What this island is for

Olimpbet KZ, Frontend Software Engineer, May 2024 to September 2025. A betting product, built in a frontend team of six across three applications. The island is a little floating stadium on match day: lights on, flags up, a big scoreboard.

| Achievement                       | Object on the island         |
| --------------------------------- | ---------------------------- |
| 3 apps, team of 6                 | Three display stands         |
| Auth service rebuilt, bundle −40% | Parcel box                   |
| Virtual scrolling for big data    | Big scoreboard               |
| Cross-team iframe integration     | Two towers facing each other |

The panel lists all four achievements and the tech chips, each with a "Show me" button, like Radio and Market.

---

## 2. The feeling

A small, friendly stadium on a summer evening just before kick-off: floodlights glowing softly, flags flapping, a scoreboard full of numbers. Exciting but cosy, more village football ground than giant arena.

- **Time of day:** the same warm late afternoon as the other islands; the floodlights are already on, softly.
- **Mood words:** lively, sporty, buzzing, friendly.
- **Accent colour:** stadium blue `#3C7DD9`.
- **Sound** (later, AI-made): a distant crowd, a whistle, flags flapping.

---

## 3. How it looks from far away (overview)

Arena sits low on the right (`[18, −1, −16]`). From the overview it must read as "a little stadium", by silhouette alone:

- an oval ring of stands with a green pitch inside, in the middle of the island,
- four slim floodlight towers at its corners, their lamps glowing,
- a tall scoreboard behind it.

---

## 4. Layout

Like Market Town, a ring: the stadium is the centre, and the four objects stand around it, spaced so no footprints touch. The stadium's stands are low, so the scoreboard behind it stays visible.

```
                         [ SCOREBOARD ]
       [TWIN TOWERS]                          [DISPLAY STANDS]
                       ( STADIUM, pitch )
                        floodlights x 4
               [PARCEL BOX]
                     front (towards the camera)
```

| Object         | Across, towards | Size       | Notes                                          |
| -------------- | --------------- | ---------- | ---------------------------------------------- |
| Stadium        | island centre   | 5.5 wide   | Landmark, not interactive; floodlights glow    |
| Scoreboard     | 0, −4.0         | 3 tall     | Back, facing the camera, above the stands      |
| Twin towers    | −3.8, −1.2      | 3.5 tall   | Left side; their windows face each other       |
| Display stands | 3.8, −1.0       | 2 tall     | Right side, three screens turned to the camera |
| Parcel box     | −1.8, 3.6       | 1 tall     | Front left, low, in front of the stadium       |
| Rocks          | at the edges    | shared kit | A few, to fill gaps (free, already generated)  |

---

## 5. Objects

Same pattern as the other islands: hover glows gold with a hint, click plays a short code-made reaction and sound, and the panel scrolls to the achievement.

### Three display stands · 3 apps, team of 6

One model: three outdoor display stands side by side, a tall narrow one (the mobile app), a wide one (the desktop web app) and one shaped like a gate with a padlock (the authorization service). The screen faces are plain; the pictures are drawn in code (as on Radio's screen, one surface each, so nothing flickers).

- **Idle:** the screens show simple app drawings, dimmed.
- **Click:** the three screens light up one by one, and six small team flags pop up on little poles beside them, one after another.

### Parcel box · Auth service rebuilt, bundle −40%

A chunky cardboard parcel box, taped, a bit too big.

- **Click:** it squishes down to 60% of its height and bounces back, and a small "−40%" tag pops up above it and fades.

### Big scoreboard · Virtual scrolling for big data

A tall old-fashioned stadium scoreboard on two legs, with a plain face; the rows on it are drawn in code.

- **Idle:** a few rows of scores, still.
- **Click:** thousands of rows whizz past smoothly, then slow down and stop, like a virtual list scrolling.

### Twin towers · Cross-team iframe integration

One model: two slim towers side by side with windows facing each other, like two neighbouring buildings.

- **Idle:** windows lit.
- **Click:** a little glowing ball (a message) flies from one tower's window to the other's and back.

### Not interactive

- **Stadium:** the landmark, with four floodlight towers. The floodlights glow softly all the time (code-made light at each lamp).
- **Flags:** a few pennants on the stadium rim fluttering (code-made, like Market's bunting).

---

## 6. Models and cost

| #   | File                 | Object                                      | Budget      |
| --- | -------------------- | ------------------------------------------- | ----------- |
| 1   | `island-base.glb`    | Wide flat island, grass to the edge         | 15,000 tris |
| 2   | `stadium.glb`        | Small oval stadium with 4 floodlights       | 8,000       |
| 3   | `scoreboard.glb`     | Tall scoreboard on two legs                 | 3,000       |
| 4   | `display-stands.glb` | Three display stands (phone, desktop, gate) | 4,000       |
| 5   | `parcel.glb`         | Big taped cardboard parcel box              | 1,500       |
| 6   | `twin-towers.glb`    | Two slim towers facing each other           | 4,000       |

| Step               | Items | Credits  |
| ------------------ | ----- | -------- |
| Concept images     | 6     | 18       |
| Textured 3D models | 6     | 180      |
| Spare for retries  |       | ~33      |
| **Total**          |       | **~230** |

Balance now: 2,062 credits, so about 1,830 would be left.

Lessons applied: three-quarter views (volume rule), grass right up to the edge on the base, screen and scoreboard faces left plain and drawn in code as one surface each (no z-fighting), a ring layout around the landmark with spacing checked before placing.

---

## 7. Decisions (2026-10-29)

All five proposals accepted as written: the stadium in the middle with a ring of objects, three display stands with six team flags, the parcel box squishing with a "−40%" tag, the twin towers with a glowing ball, and about 230 credits.
