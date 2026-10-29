# Green Grove island

[Back to Phase 4](../phase-4-island-art.md) · [AI model prompts](../phase-4-ai-prompts.md) · Previous: [Arena](arena.md)

**Status:** design draft for review (2026-10-29). Nothing generated yet.

---

## 1. What this island is for

Eco Activists, Full Stack Engineer, December 2020 to December 2022. An environmental platform, trash-free.ru: a public website for environmental initiatives. The island is a calm green grove: an old tree, clean water, young trees being planted.

| Achievement                                | Object on the island             |
| ------------------------------------------ | -------------------------------- |
| Led the frontend team (the public website) | Three recycling bins             |
| Built frontend and APIs, mentored juniors  | A row of young saplings          |
| ЮKassa payments integration                | A wooden collection box          |
| Admin-editable website content             | The noticeboard (planning board) |

The panel lists all four achievements, the tech chips and the trash-free.ru link, each achievement with a "Show me" button.

(Updated 2026-10-29: the CV now lists the role as full stack and adds the ЮKassa and admin-content achievements, so the island has four objects instead of two.)

---

## 2. The feeling

A quiet green grove after rain: moss, ferns, a big old tree, a waterfall pouring off the edge into the clouds. The calmest island in the world, a place to breathe.

- **Time of day:** the same warm late afternoon; light comes through the leaves.
- **Mood words:** calm, fresh, green, hopeful, growing.
- **Accent colour:** forest green `#4E8B3A`.
- **Sound** (later, AI-made): birds, water, leaves.

Inspired by forest films, not copied: no forest spirits or creatures that resemble film characters. Life comes from leaves, water and light.

---

## 3. How it looks from far away (overview)

Grove sits on the left of the world (`[−18, −2, −16]`). From the overview it must read as "a forest island with a waterfall", by silhouette alone:

- one huge round tree crown, the biggest tree on any island,
- a thin white waterfall pouring off the right edge and fading into the clouds below,
- mossy green rock underneath.

---

## 4. Layout

The two-row rule from Radio: the tall tree at the back, the four objects in front of and beside it, each in its own column. The waterfall pours off the right edge, so the focus camera (front right) sees it side-on.

```
                 [ BIG OLD TREE ]
                  small shrine under it
  [NOTICEBOARD]                      [COLLECTION BOX]     waterfall ⟶ off the edge
       [RECYCLING BINS]            [ SAPLINGS x4 ]
                    front (towards the camera)
```

| Object         | Across, towards | Size       | Notes                                        |
| -------------- | --------------- | ---------- | -------------------------------------------- |
| Big old tree   | −0.5, −3.0      | 7 tall     | Landmark; its crown spreads above the island |
| Shrine         | 0.6, −2.0       | 1.2 tall   | Small, at the tree's foot, facing the camera |
| Noticeboard    | −3.6, −0.2      | 1.6 tall   | Left side                                    |
| Collection box | 2.9, −1.4       | 1.2 tall   | Right side, back from the waterfall's rim    |
| Recycling bins | −2.2, 2.4       | 1.1 tall   | Front left, litter on the grass around them  |
| Saplings ×4    | 0.8 to 3.2, 2.2 | 0.7 tall   | Front right, a short row                     |
| Waterfall      | right edge      | code       | Pours from the rim down into the clouds      |
| Rocks          | edges           | shared kit | A few, free                                  |

---

## 5. Objects

Same pattern as the other islands: hover glows gold with a hint, click plays a short reaction and sound, and the panel scrolls to the achievement.

### Recycling bins · Led the frontend team

Three small recycling bins side by side, green, blue and yellow, with rounded lids. A few bits of litter (code-made: a can, a bottle, paper) lie on the grass around them.

- **Click:** the litter hops up and flies into the right bins one by one, and a small "trash-free.ru" tag pops up above them and fades.

### Saplings · Built frontend and APIs, mentored juniors

Four young saplings in a row, each a thin trunk with a small round crown, staked with a little wooden stick. One model, placed four times, each turned and sized a little differently.

- **Idle:** they sway gently, out of step.
- **Click:** they grow into small trees one by one (each grows to about twice its size), hold a moment, then settle back, like juniors growing with mentoring.

### Collection box · ЮKassa payments integration

A small wooden collection box on a post, with a coin slot on top and a little roof, like a donation box at a nature reserve.

- **Click:** a few gold coins drop into the slot one after another, and a small green check pops up above it (the payment went through).

### Noticeboard · Admin-editable website content

A wooden noticeboard on two legs with a little roof. The paper notes on it are code-made, placed on the board's face (measured on the model), so they can change.

- **Idle:** a few colourful notes pinned up.
- **Click:** the notes shuffle to new places and change colours, as if an administrator just rearranged the site's content.

### Not interactive

- **Big old tree:** the landmark, with a thick twisting trunk and a huge crown; it sways very slightly.
- **Shrine:** a small mossy stone shrine with a little roof at the tree's foot (see question 4).
- **Waterfall (code):** a soft white stream pouring from the rim, mist at the top, fading out into the clouds below.
- **Falling leaves (code):** a few leaves drifting down slowly from the big tree.

---

## 6. Models and cost

| #   | File                 | Object                                     | Budget      |
| --- | -------------------- | ------------------------------------------ | ----------- |
| 1   | `island-base.glb`    | Mossy rock island, grass and moss to edge  | 15,000 tris |
| 2   | `big-tree.glb`       | Huge old tree                              | 8,000       |
| 3   | `shrine.glb`         | Small mossy stone shrine                   | 2,000       |
| 4   | `recycling-bins.glb` | Three recycling bins in a row              | 3,000       |
| 5   | `sapling.glb`        | One staked sapling (placed ×4)             | 1,500       |
| 6   | `noticeboard.glb`    | Wooden noticeboard on legs, plain face     | 2,000       |
| 7   | `collection-box.glb` | Wooden collection box on a post, coin slot | 1,500       |

| Step               | Items | Credits  |
| ------------------ | ----- | -------- |
| Concept images     | 7     | 21       |
| Textured 3D models | 7     | 210      |
| Spare for retries  |       | ~33      |
| **Total**          |       | **~265** |

Balance: about 1,860 credits, so about 1,600 would be left.

Lessons applied: three-quarter views with volume for every concept, extra care for the two trees (foliage); grass and moss right up to the edge on the base; one sapling model reused; the noticeboard's face left plain so code-made notes sit on it; positions of code-made parts measured on the models.

---

## 7. Questions for you

1. **Waterfall** pouring off the right edge, made in code (animated water and mist). OK?
2. **Recycling bins:** litter flies into the right bins and a "trash-free.ru" tag pops up. OK?
3. **Saplings:** four saplings grow into small trees one by one. OK?
4. **The shrine** under the big tree. Keep it (a small mossy stone shrine), or something else there, such as a wooden bench or a stone lantern?
5. **Collection box** for ЮKassa: coins drop in and a green check pops up. OK?
6. **Noticeboard** for the admin-editable content: notes shuffle and change colour. OK?
7. **Credits:** about 265. OK?
