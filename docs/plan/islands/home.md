# Home island

[Back to Phase 4](../phase-4-island-art.md) · [AI model prompts](../phase-4-ai-prompts.md)

**Status:** built on 2026-10-28. All 12 models generated and placed, with simple idle animations. Click animations come later (see section 10).

---

## 1. What this island is for

Home is the first island every visitor sees and the one they return to. The other islands tell the career story. Home answers "who is this person and how do I reach them".

It holds:

| CV content                         | Where it shows up                            |
| ---------------------------------- | -------------------------------------------- |
| Name, role, summary                | Panel header and summary; the cat reveals it |
| Contacts (email, LinkedIn, GitHub) | Panel contacts; the mailbox reveals them     |
| Skills (5 groups)                  | Panel skills; the lantern reveals them       |
| Education (3 entries)              | Panel education; the bookshelf reveals it    |
| Languages (Russian, English)       | Panel languages; the globe reveals them      |

As everywhere, the panel always shows all of this. The objects are a second, playful way in.

---

## 2. The feeling

A small cosy home on a warm summer afternoon, like the lofi desk reference seen from outside. Quiet, safe, lived-in. Someone just stepped out and left the lamp on.

- **Time of day:** late afternoon, warm golden sun from the upper left, cool blue shadows.
- **Mood words:** cosy, calm, personal, a little whimsical.
- **Accent colour:** warm orange `#E08A3C`, used on the label, panel stamp and glowing window.
- **Sound** (when on): birds, rustling leaves, a soft crackle from the chimney, a purr when the cat is clicked.

---

## 3. How it looks from far away (overview)

Home floats front and centre, closer and a little larger than the career islands behind it. From the overview it must read in one glance as "a house under a tree", by silhouette alone:

- the big round tree canopy on the left, taller than the house,
- the steep terracotta roof and crooked chimney with a thin curl of smoke,
- the warm glowing round window,
- a lumpy sandy rock underneath with roots hanging down.

On a first visit a "You are here" speech bubble sits above it, as in reference image 1.

---

## 4. Layout (seen from above)

The island top is roughly a circle about 12 metres across. The visitor's camera looks at it from the front right (bottom right of the map), so everything interactive sits on the front half, facing that way.

```
                         back (away from the camera)
                 .-----------------------------------.
               /        ( ( BIG TREE ) )              \
              /       ( (  canopy over  ) )            \
             |          (  the roof   )   [chimney]     |
             |             trunk  ┌──────────────┐ [bench|
             |    [bookshelf]     │   COTTAGE    │ + CAT]|
     left    |                    │  round window│      |   right
             |                    └───door───────┘      |
             |  [stump + globe]          o  o  o  o     |
             |                                [MAILBOX] |
              \                     [lantern]           /
               \                                       /
                 '-----------------------------------'
                       front (towards the camera)
                                  ↘ camera
```

`o o o` are stepping stones leading from the door to the mailbox at the right edge.

**Layout rule (2026-10-28).** The focus camera looks from the front right, at roughly 54° from the +X axis. Objects are spread across that view rather than lined up along it, so none hides another. In the first layout the bench stood straight in front of the globe. Now the left side is a study corner (bookshelf and globe: education and languages), the door stays clear in the middle, and the right side has the mailbox at the end of the path with the cat's bench behind it, beside the house. The empty front-left grass is kept for the flower bushes.

| Object               | Position on the island                              | Faces                   |
| -------------------- | --------------------------------------------------- | ----------------------- |
| Cottage              | Centre, a little towards the back                   | Door towards the camera |
| Big tree             | Back left, canopy partly over the roof              |                         |
| Bookshelf            | Left of the door, against the wall, under the eaves | Camera                  |
| Bench with the cat   | Right of the door, in the sun                       | Camera                  |
| Stump with the globe | Front left, the study corner by the bookshelf       | Camera                  |
| Garden lantern       | Beside the stepping-stone path                      |                         |
| Mailbox              | Front right edge, where the path ends               | Camera                  |
| Flower bushes        | Around the rim, left and front                      |                         |

---

## 5. Objects

Sizes are in metres. Some are a little oversized on purpose, storybook style, so small things stay readable.

### Cottage (scenery)

A tiny countryside cottage: cream plaster walls, honey-coloured timber beams, a steep terracotta tile roof, a slightly crooked brick chimney, one large **round window** glowing warm from inside, a small green wooden door with a stone step, and a flower box under a side window. About 3.5 × 3 m footprint, 5 m to the top of the chimney.

- **Alive:** the round window glows warmly. Thin smoke curls from the chimney (made in code, not part of the model). A painted lofi desk behind the glass was tried and removed (see decision 2).
- **Click:** nothing. Clicking the island focuses it; the cottage is the backdrop.

### Big tree (scenery)

An old broad-leaf tree with a thick twisting trunk, visible roots and a wide rounded canopy of soft leaf clumps. About 7 m tall, so it is the tallest thing on the island and frames the house.

- **Alive:** the canopy sways gently; now and then a leaf drifts down.

### Cat → summary

A chubby orange tabby lying on the bench, eyes half closed. About 0.9 m long, oversized on purpose.

- **Idle:** it breathes slowly.
- **Click (since 2026-10-29), a little flipbook of three models of the same cat:** it wakes into a big yawning stretch along the bench, then sits up with a curious head-tilt hop, then curls back to sleep. Each switch hides inside a little cartoon puff of cloud that covers the cat as the model changes, then drifts apart. The poses (`cat-stretch.glb`, `cat-sitting.glb`) were drawn from the sleeping cat's concept and are sized by head width, so they read as one cat (`CatPoses.tsx`). A cat rigged as a quadruped on meshy.ai was tried first and rejected.
- **Why the cat:** the summary is "who I am", and the cat is the soul of the home, as in the lofi reference.

### Garden lantern → skills

An old-fashioned glass lantern on a slim dark post, with a warm glow inside. About 1.6 m tall.

- **Idle:** the flame flickers softly. Two or three fireflies circle it.
- **Click:** it brightens, and skill tags rise from it like fireflies (React, TypeScript, Feature-Sliced Design…), then fade.
- **Why the lantern:** skills are the light you carry and work by.

### Mailbox → contacts

A rustic wooden mailbox on a short post, painted soft sky blue, with a small red flag. About 1.2 m tall.

- **Idle:** the flag is down; sometimes the mailbox gives a tiny wobble, as if something arrived.
- **Click:** the flag pops up, the lid opens, and a letter flies out showing the email with a Copy button, plus LinkedIn and GitHub.
- **Why the mailbox:** "write to me".

### Bookshelf → education

A small outdoor wooden bookshelf with a slanted roof, three shelves of colourful books and a potted plant on top. About 1.4 m tall.

- **Idle:** still. A book occasionally shifts.
- **Click:** three books slide out, one per education entry, with the title on the spine: Netology course, Specialist degree, Bachelor's degree.

### Globe → languages

An antique globe on a carved wooden stand, sitting on a tree stump next to the cottage. About 0.8 m on the stump.

- **Idle:** turns slowly.
- **Click:** spins quickly, slows down, and two pins pop up: Russian (native) and English (C1).

### Small scenery

- **Bench:** a short rustic wooden bench for the cat.
- **Stump:** an old tree stump as a little table for the globe. Can be simple shapes made in code.
- **Stepping stones:** three or four flat stones from the door to the mailbox.
- **Flower bushes:** two or three round bushes with small white and pink flowers.

### The island base

A chunk of warm sandy rock shaped like an upside-down cone, with a flat lush grassy top and a few wildflowers at the rim. Underneath: layered rock, small floating stones and tree roots dangling down.

- **Alive:** the whole island bobs slowly. Roots sway a little.

---

## 6. Visiting the island (focus view)

1. The visitor clicks Home or its label. The camera flies in from the front right, and the island settles on the left of the screen, with the panel on the right.
2. The panel opens with the name, role, summary, contacts, skills, education and languages.
3. The five interactive objects get a soft gold outline on hover. The counter in the panel reads "0 of 5 discovered".
4. Each click plays its little scene and highlights the matching part of the panel. Hovering a section in the panel makes its object glow.
5. Finding all five on every island sends a paper plane to Home, and the mailbox opens with "Let's talk".

---

## 7. What is AI-generated and what is code

| Made with AI (Meshy)                                                      | Made in code                                                                          |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Island base, cottage, big tree, cat, lantern, mailbox, bookshelf, globe   | Placement, scale and lighting                                                         |
| Bench, stump, one stepping stone (placed ×4), one flower bush (placed ×3) | Chimney smoke, window glow, fireflies, falling leaves                                 |
| ~~The painted desk behind the round window~~ (removed)                    | All animations, clicks, outlines, speech bubbles, the letter, book spines, globe pins |

Everything a visitor sees up close is generated. The style test showed that a flat code-made bench looks out of place next to the painted cat.

Concept images so far (in `art-source/home/concepts/`, not in git):

- `cat-v1.png`: used for the cat model.
- `cottage-v1.png`: rejected, chimney smoke painted in.
- `cottage-v2.png`: used for the cottage model.
- `desk-window-v1.png`: was shown behind the round window, removed 2026-10-28 (see decision 2).

---

## 8. Decisions

Agreed on 2026-10-28.

1. **The cat lies on the bench by the door,** closest to the visitor.
2. **Small details are welcome.** More small touches can come later. A painted lofi desk behind the round window was built and then removed (2026-10-28): the flat picture looked worse than the plain glowing window of the cottage model.
3. **The globe sits on a tree stump** next to the cottage corner.
4. **No extra personal objects for now.** We can add some later.
5. **The "You are here" bubble stays** for first-time visitors.

---

## 9. Build plan for the remaining objects

### Placement

Positions are in island units: the island's own frame before its 1.2 scale, with the grass surface at height 0. **+Z faces the overview camera, +X is the visitor's right.** "Turn" is the rotation around the vertical axis in degrees; positive turns the front towards the visitor's right, where the focus camera sits.

| Object          | Position (x, z)                            | Size                      | Turn   | Notes                                                       |
| --------------- | ------------------------------------------ | ------------------------- | ------ | ----------------------------------------------------------- |
| Cottage         | 0.2, −1.0                                  | 5 tall (done)             | 17°    | Round window glows warmly                                   |
| Big tree        | −3.0, −1.0                                 | 5.6 tall                  | 90°    | Left of the house, clear of the roof                        |
| Bookshelf       | −1.4, 1.0                                  | 1.4 tall                  | 35°    | Left of the door, turned towards the camera                 |
| Bench + cat     | 2.6, −1.0                                  | bench 1.6 long (cat done) | −30°   | Sunny side, beside the house right of the door              |
| Stump + globe   | −1.6, 2.6                                  | stump 0.6 tall, globe 0.8 | 30°    | Study corner, in front of the bookshelf                     |
| Garden lantern  | 1.0, 2.8                                   | 2.1 tall                  | 0°     | Front, left of the path                                     |
| Mailbox         | 3.0, 2.1                                   | 1.2 tall                  | −120°  | Where the path ends; red flag faces the camera              |
| Stepping stones | 0.8, 0.7 → 1.2, 1.4 → 1.8, 1.85 → 2.0, 2.6 | 0.6 to 0.8 wide           | random | From the door towards the front, the mailbox on the right   |
| Flower bushes   | −3.7, 1.0 · −2.2, 3.4 · 3.9, −0.4          | 1.0 to 1.3 wide           | random | Around the rim, framing the front. **Postponed**, see below |

**Flower bushes are postponed (decided 2026-10-28).** Both generated bushes came out paper-thin: Meshy turns a round, edgeless blob of leaves into a flat painted card, even from a concept with clear volume. The next attempt should use multi-view: front, side and back views of the bush, then multi-image-to-3D, about 33 credits. The first big tree was flat too; it was regenerated from a three-quarter-view concept and is solid. Its leaves came out olive, so `npm run art` grades them toward the palette greens (the `foliage` grade in `scripts/art-grade.mjs`); the trunk keeps its brown. See the volume rule in [phase-4-ai-prompts.md](../phase-4-ai-prompts.md).

Interactive objects all stand on the front half and face the front right, so they are visible in the focus view with the panel open.

### The island base

The generated base replaces the procedural rock. Two risks and how code handles them:

- **The top is not perfectly flat.** Code drops every object onto the actual grass surface (a downward ray test when the island loads), so nothing floats or sinks.
- **The size and shape differ from the placeholder.** Code scales the base so its top is about 11 units across, and the positions above are adjusted after one screenshot.

### Order and cost

| Step                                         | Items | Credits |
| -------------------------------------------- | ----- | ------- |
| Concept images, standard model (nano-banana) | 10    | 30      |
| Review the concepts with you                 |       | 0       |
| Textured 3D models (Meshy 7.1)               | 10    | 300     |
| **Total**                                    |       | **330** |

Balance before this batch: 1028 credits. Images first, then I show them to you, then 3D only for the approved ones. A rejected concept costs 3 credits to redo, not 30.

Order of 3D generation: island base and big tree first (they decide the composition), then the interactive objects, then bench, stump, stone and bush.

---

## 10. Animation scope (decided 2026-10-28)

Keep it simple and cosy for now. Elaborate click scenes (the cat stretching, books sliding out, the globe spinning to pins, the letter flying out of the mailbox) wait until much later, if we still want them.

What is built now:

| Object        | Idle motion                                                                  |
| ------------- | ---------------------------------------------------------------------------- |
| Whole island  | Bobs slowly (shared by all islands)                                          |
| Big tree      | Sways very gently                                                            |
| Flower bushes | Sway gently, each slightly out of step (when the bushes come back)           |
| Cat           | Breathes slowly                                                              |
| Cottage       | Smoke puffs curl from the chimney; the round window glows warmly             |
| Lantern       | Flickers softly, a dim warm light on the grass, a few fireflies drift nearby |

Each generated model is one solid piece, so parts like the globe ball or the mailbox flag cannot move on their own. Any later click animation moves the whole object, or adds effects made in code.

### Click reactions (built 2026-10-28)

Built before the next island, so we learn which parts future models need as separate files. Each reaction moves the whole object or adds a code-made effect, and lasts about a second.

| Object    | Opens     | Reaction                                                   | Sound                |
| --------- | --------- | ---------------------------------------------------------- | -------------------- |
| Cat       | Summary   | Squash-and-stretch hop                                     | Rolled "mrrp" chirp  |
| Mailbox   | Contacts  | Shakes, a paper letter with a red seal pops out and flips  | Two paper rustles    |
| Lantern   | Skills    | The light brightens, then eases back smoothly              | Two bell tones       |
| Bookshelf | Education | Wobbles, as if a book was just pulled out                  | Two soft wood knocks |
| Globe     | Languages | Spins twice on the stump (the whole globe, stand included) | Air whirring         |

For all five:

- **Hover:** the object glows gold and lifts slightly, the cursor becomes a pointer, and a small hint names the section. Only on the focused island; in the overview a click focuses the island.
- **Click:** plays the reaction and sound, scrolls the panel to the section and flashes it gold.
- **Panel link:** each Home section has a "Show me" button that plays the same reaction (the keyboard path), and hovering or focusing a section makes its object glow.
- **Reduced motion:** reactions don't play; sounds, the scroll and the flash still do.

Code: `src/data/homeObjects.ts` links objects to sections; `src/objects/` holds the shared `Interactable` wrapper, the `Hop`, `Wobble` and `Spin` reactions and the hover hint. The Radio Tower and later islands reuse them.
