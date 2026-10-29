# Arena island

[Back to Phase 4](../phase-4-island-art.md) · [AI model prompts](../phase-4-ai-prompts.md) · Previous: [Market Town](market.md)

**Status:** built on 2026-10-29. All 6 models generated and placed; all four achievement objects interactive. Screen, scoreboard and window positions were measured on the models themselves. First layout, to be tuned from screenshots.

---

## 1. What this island is for

Olimpbet KZ, Frontend Software Engineer, May 2024 to September 2025. A betting product, built in a frontend team of six across three applications. The island is a little floating stadium on match day: lights on, flags up, a big scoreboard.

| Achievement                       | Object on the island                     |
| --------------------------------- | ---------------------------------------- |
| 3 apps, team of 6                 | Three display stands                     |
| Auth service rebuilt, bundle −40% | Winged running shoe                      |
| Virtual scrolling for big data    | Big scoreboard                           |
| Cross-team iframe integration     | Two team booths with a tin-can telephone |

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
       [TEAM BOOTHS]                          [DISPLAY STANDS]
                       ( STADIUM, pitch )
                        floodlights x 4
               [WINGED SHOE]
                     front (towards the camera)
```

| Object         | Across, towards | Size       | Notes                                          |
| -------------- | --------------- | ---------- | ---------------------------------------------- |
| Stadium        | island centre   | 5.5 wide   | Landmark, not interactive                      |
| Scoreboard     | 0, −4.0         | 3 tall     | Back, facing the camera, above the stands      |
| Team booths    | −4.0, −1.2      | 1.45 tall  | Left side; their windows face each other       |
| Display stands | 3.8, −1.0       | 2 tall     | Right side, three screens turned to the camera |
| Winged shoe    | −2.5, 3.3       | 0.75 tall  | Front left, side-on, dashes off to the left    |
| Rocks          | at the edges    | shared kit | A few, to fill gaps (free, already generated)  |

---

## 5. Objects

Same pattern as the other islands: hover glows gold with a hint, click plays a short code-made reaction and sound, and the panel scrolls to the achievement.

### Three display stands · 3 apps, team of 6

One model: three outdoor display stands side by side, a tall narrow one (the mobile app), a wide one (the desktop web app) and one shaped like a gate with a padlock (the authorization service). The screen faces are plain; the pictures are drawn in code (as on Radio's screen, one surface each, so nothing flickers).

- **Idle:** the screens show simple app drawings, dimmed.
- **Click:** the three screens light up one by one, and six small team flags pop up on little poles beside them, one after another.

### Winged shoe · Auth service rebuilt, bundle −40%

Replaced the parcel box on 2026-10-29: the point of the rebuild is that it got faster, not only smaller. A chunky sky-blue running shoe with a golden stripe and two little white wings on its heel (`winged-shoe.glb`): lighter and faster in one picture. Side-on to the camera, toe to the left.

- **Click:** it shakes off a few grey weights (the old heavy code) that tumble to the grass, dashes off to the left with speed lines from its heel, skids round in a puff of dust, dashes back and skids round again; a gold tag "−40% · faster" pops up.

### Big scoreboard · Virtual scrolling for big data

A tall old-fashioned stadium scoreboard on two legs, with a plain face; the rows on it are drawn in code.

- **Idle:** a few rows of scores, still.
- **Click:** thousands of rows whizz past smoothly, then slow down and stop, like a virtual list scrolling.

### Team booths · Cross-team iframe integration

Replaced the twin towers on 2026-10-29 (`team-booths.glb`, the third concept; a stray web between the blue booth and the deck is removed in the art pipeline). One model: two little round booths on a wooden deck, a blue team's and a red team's, with striped domes and pennants, their windows facing each other across a gap. Two teams' apps talking through a frame.

- **Idle:** two tin cans sit in the facing windows, joined by a gently sagging string (code-made).
- **Click:** an envelope rides the string over to the red booth (the string dips under it), that can gives a little jump, and a reply rides back to the blue one; a gold tag "postMessage" pops up.

### Not interactive

- **Stadium:** the landmark, with four floodlight towers (part of the model; the code-made lamp glow was removed on 2026-10-29).
- **Flags:** a few pennants on the stadium rim fluttering (code-made, like Market's bunting).

---

## 6. Models and cost

| #   | File                 | Object                                      | Budget      |
| --- | -------------------- | ------------------------------------------- | ----------- |
| 1   | `island-base.glb`    | Wide flat island, grass to the edge         | 15,000 tris |
| 2   | `stadium.glb`        | Small oval stadium with 4 floodlights       | 8,000       |
| 3   | `scoreboard.glb`     | Tall scoreboard on two legs                 | 3,000       |
| 4   | `display-stands.glb` | Three display stands (phone, desktop, gate) | 4,000       |
| 5   | `winged-shoe.glb`    | Winged running shoe (was the parcel box)    | 4,000       |
| 6   | `team-booths.glb`    | Two team booths on a deck (was twin towers) | 6,000       |

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
