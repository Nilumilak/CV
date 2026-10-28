# Market Town island

[Back to Phase 4](../phase-4-island-art.md) · [AI model prompts](../phase-4-ai-prompts.md) · Previous: [Radio Tower](radio.md)

**Status:** built on 2026-10-29. All 9 models generated (the signpost concept was redrawn once, for depth) and placed; all six achievement objects interactive. First layout, to be tuned from screenshots.

---

## 1. What this island is for

Monetech, Senior Frontend Developer, remote, September 2025 to October 2026. A lending fintech with two products: PDL (payday loans) and BNPL (buy now, pay later). A busy little market town: money, deliveries, people coming and going.

| Achievement                                 | Object on the island            |
| ------------------------------------------- | ------------------------------- |
| Owned the live PDL app (4 production flows) | Coin fountain in the square     |
| WordPress to Next.js migration              | Old shack and glass building    |
| BNPL app and 7 user flows                   | Little tram on a loop           |
| 6 account areas, Spanish i18n               | Signpost with 6 arms            |
| FSD standard and CI/CD releases             | Hot-air balloon on a launch pad |
| Shared UI kit and API core (2 packages)     | Small building crane            |

The panel lists all six achievements and the tech chips. Each achievement gets a "Show me" button, like Radio.

---

## 2. The feeling

A sunny hilltop market square in a small southern town: terracotta roofs, bunting across the square, a fountain, a tram bell. Warm, lively, a bit of fiesta (the work was for a Spanish-speaking market).

- **Time of day:** the same warm late afternoon as the other islands.
- **Mood words:** lively, warm, bustling in a gentle way, festive.
- **Accent colour:** terracotta `#C9573E` with gold.
- **Sound** (later, AI-made): a tram bell, coins, distant chatter, a flag flapping.

---

## 3. How it looks from far away (overview)

Market sits on the right of the world (`[30, 5, -8]`). From the overview it must read as "a little town", by silhouette alone:

- a cluster of stacked houses with terracotta roofs at the back,
- a domed bank in the middle, its dome the highest round shape,
- a hot-air balloon floating just above the island,
- bunting strung across the square.

---

## 4. Layout

**A ring around the town square (revised 2026-10-29).** The first layout used Radio's two rows, but it put the fountain off the base's cobbled square and the houses straight behind the bank, where their footprints overlapped. Market's base has a natural centre, so the layout is a ring instead:

- **Middle:** the fountain with the tram loop, in the centre of the cobbled square (island centre).
- **Around the edge, about 4 m out,** spaced so no footprints touch: houses and bank side by side at the back, crane and balloon at the sides, signpost and shack at the front.

```
                 [HOUSES]  ~bunting~  [BANK]   ~bunting~  |pole|
       [CRANE]                                          [BALLOON]
                          ( FOUNTAIN )
                         tram loop around
          [SIGNPOST]                         [SHACK + GLASS]
                     front (towards the camera)
```

| Object                 | Across, towards | Size     | Notes                                                          |
| ---------------------- | --------------- | -------- | -------------------------------------------------------------- |
| Fountain and tram loop | island centre   | 1.6 wide | Tram loop 1.4 m from the fountain's centre                     |
| Stacked houses         | −1.9, −3.3      | 4.2 tall | Back left                                                      |
| Domed bank             | 1.6, −3.3       | 3.6 tall | Back right of the houses; landmark                             |
| Crane                  | −4.8, 0.5       | 4 tall   | Left edge, clear of the houses; blocks stack 1.5 m to its side |
| Balloon                | 3.8, −1.0       | 3.2 tall | Right side, floating a little above its pad                    |
| Signpost               | −2.6, 2.8       | 2 tall   | Front left                                                     |
| Shack and glass        | 2.6, 2.8        | 2.2 long | Front right                                                    |

---

## 5. Objects

Same pattern as Home and Radio: hover glows gold with a hint, click plays a short code-made reaction and sound, and the panel scrolls to the achievement.

### Coin fountain · Owned the live PDL app

A round stone fountain with a little figure or spout in the middle, gold coins at the bottom.

- **Idle:** a few water sparkles.
- **Click:** a small burst of gold coins jumps out and falls back in.

### Old shack and glass building · WordPress to Next.js

An old wooden shack leaning against a small modern glass building, as one model (question 2).

- **Click:** a puff of dust clouds around the shack, and the glass building lights up from inside.

### Little tram · BNPL app and 7 user flows

One small old-fashioned tram car, on a thin code-made track that loops around the fountain.

- **Idle:** waits at its stop.
- **Click:** rings its bell and rides once around the loop, back to the stop.

### Signpost with 6 arms · 6 account areas, Spanish i18n

A wooden signpost with six arrow arms pointing in different directions.

- **Idle:** still.
- **Click:** spins once on its post.

### Hot-air balloon · FSD standard and CI/CD releases

A striped balloon with a basket, tethered just above a round wooden launch pad.

- **Idle:** bobs gently on its rope.
- **Click:** "released": floats up a few metres, then drifts slowly back down to its pad.

### Building crane · Shared UI kit and API core

A small yellow tower crane, like a toy.

- **Click:** three coloured blocks (tokens, icons, components) pop up and stack onto a "core" block beside it, then fade (code-made).

### Not interactive

- **Domed bank:** the landmark, with columns and a gold dome.
- **Stacked houses:** a backdrop cluster of narrow houses with terracotta roofs.
- **Bunting:** strings of small triangle flags across the square (code-made), fluttering.

---

## 6. Models and cost

| #   | File              | Object                            | Budget      |
| --- | ----------------- | --------------------------------- | ----------- |
| 1   | `island-base.glb` | Island with a cobbled square      | 15,000 tris |
| 2   | `bank.glb`        | Domed bank                        | 6,000       |
| 3   | `houses.glb`      | Cluster of stacked town houses    | 6,000       |
| 4   | `fountain.glb`    | Round coin fountain               | 3,000       |
| 5   | `shack-glass.glb` | Old shack beside a glass building | 4,000       |
| 6   | `tram.glb`        | One small tram car                | 3,000       |
| 7   | `signpost.glb`    | Signpost with 6 arms              | 2,000       |
| 8   | `balloon.glb`     | Hot-air balloon with basket       | 3,000       |
| 9   | `crane.glb`       | Small toy-like tower crane        | 3,000       |

| Step                | Items | Credits  |
| ------------------- | ----- | -------- |
| Concept images      | 9     | 27       |
| Textured 3D models  | 9     | 270      |
| Spare for one retry |       | ~33      |
| **Total**           |       | **~330** |

Balance now: 362 credits, so about 32 would be left. Dropping the stacked houses saves 33 (question 1).

Lessons applied: every concept is a three-quarter view (volume rule); the base prompt asks for grass and cobbles right up to the edge, no bare patches; the balloon is a separate model so it can float up; the crane's blocks and the bunting are code.

---

## 7. Decisions (2026-10-28)

1. **Keep the stacked houses** as a separate backdrop model behind the bank.
2. **Shack and glass building are one model**, with the simple reaction (dust puff, glass lights up).
3. **One tram car** riding a loop around the fountain stands for the 7 BNPL flows.
4. **Credits approved:** about 330 of the 362.
