# Home island

[Back to Phase 4](../phase-4-island-art.md) · [AI model prompts](../phase-4-ai-prompts.md)

**Status:** draft for review. Nothing here is built yet. Comments and changes welcome before we generate models.

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
             |             trunk  ┌──────────────┐      |
             |    [bookshelf]     │   COTTAGE    │      |
     left    |                    │  round window│      |   right
             |    bush            └───door───────┘  [stump + globe]
             |                       stone step         |
             |                         o  [bench + CAT]  |
              \           [lantern]     o               /
               \   bush                   o  [MAILBOX] /
                 '-----------------------------------'
                       front (towards the camera)
                                  ↘ camera
```

`o o o` are stepping stones leading from the door to the mailbox at the front edge.

| Object               | Position on the island                              | Faces                   |
| -------------------- | --------------------------------------------------- | ----------------------- |
| Cottage              | Centre, a little towards the back                   | Door towards the camera |
| Big tree             | Back left, canopy partly over the roof              |                         |
| Bookshelf            | Left of the door, against the wall, under the eaves | Camera                  |
| Bench with the cat   | Right of the door, in the sun                       | Camera                  |
| Stump with the globe | Right side, next to the cottage corner              | Camera                  |
| Garden lantern       | Beside the stepping-stone path                      |                         |
| Mailbox              | Front right edge, where the path ends               | Camera                  |
| Flower bushes        | Around the rim, left and front                      |                         |

---

## 5. Objects

Sizes are in metres. Some are a little oversized on purpose, storybook style, so small things stay readable.

### Cottage (scenery)

A tiny countryside cottage: cream plaster walls, honey-coloured timber beams, a steep terracotta tile roof, a slightly crooked brick chimney, one large **round window** glowing warm from inside, a small green wooden door with a stone step, and a flower box under a side window. About 3.5 × 3 m footprint, 5 m to the top of the chimney.

- **Alive:** the round window glows warmly. Thin smoke curls from the chimney (made in code, not part of the model).
- **Click:** nothing. Clicking the island focuses it; the cottage is the backdrop.

### Big tree (scenery)

An old broad-leaf tree with a thick twisting trunk, visible roots and a wide rounded canopy of soft leaf clumps. About 7 m tall, so it is the tallest thing on the island and frames the house.

- **Alive:** the canopy sways gently; now and then a leaf drifts down.

### Cat → summary

A chubby orange tabby lying on the bench, eyes half closed. About 0.9 m long, oversized on purpose.

- **Idle:** the tail tip flicks, and every few seconds the cat breathes slowly.
- **Click:** the cat stretches, yawns, and a speech bubble opens with the summary's first line, while the panel highlights the summary.
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

| Made with AI (Meshy)                                                    | Made in code                                                                          |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Island base, cottage, big tree, cat, lantern, mailbox, bookshelf, globe | Placement, scale and lighting                                                         |
| Optional: bench, flower bushes, stepping stones                         | Chimney smoke, window glow, fireflies, falling leaves                                 |
|                                                                         | Stump, simple stones (if not generated)                                               |
|                                                                         | All animations, clicks, outlines, speech bubbles, the letter, book spines, globe pins |

Concept images made so far (in `art-source/home/concepts/`, not in git):

- `cat-v1.png`: approved look, chubby smiling tabby.
- `cottage-v1.png`: good, but has chimney smoke painted in. Smoke would turn into a solid blob in 3D, so it needs one more image without smoke.

---

## 8. Questions for you

1. **Where should the cat lie?** On the bench by the door (my suggestion, closest to the visitor), on the windowsill of the round window (most like the lofi reference, but small and high up), or on the roof next to the chimney (very storybook, visible from far away).
2. **A desk visible through the round window?** A painted picture behind the window glass: the lofi desk with a lamp, plant and laptop. Costs one more concept image, about 3 credits. It is a lovely detail when you zoom in, but optional.
3. **Is the globe on a stump fine,** or would you prefer it on the bench next to the cat, or inside the window?
4. **Anything personal to add?** For example a piano (your email says pianoparrot), a guitar, a bicycle, a specific plant or a second animal. Small personal details make Home feel like yours.
5. **Keep the "You are here" bubble** for first-time visitors?
