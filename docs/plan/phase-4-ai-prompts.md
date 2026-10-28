# Phase 4. AI model prompts

[Back to Phase 4](phase-4-island-art.md)

You generate the models, I integrate them. This file has everything you need for each island, starting with **Home**, the style test.

---

## Workflow

1. **Make a concept image first** (recommended). Use any image generator, such as ChatGPT, Midjourney or the image tool inside Meshy or Tripo. Paste the **style block** plus the object's **image prompt**. Regenerate until it looks right.
2. **Turn the image into 3D** with image-to-3D in Meshy or Tripo. Image-to-3D keeps the painted style far more consistent than text-to-3D.
   - No time for images? Use text-to-3D with the style block plus the object's **3D prompt** instead. Results vary more.
3. **Use these settings** where the tool offers them:
   - Texture: base colour only, no PBR, no metallic or roughness maps.
   - Polycount: the budget in each object's table row. Choose "low poly" or set a target count.
   - Texture size: 2048 if offered. I compress to 1024.
   - Format: **GLB**.
4. **Save each file** as `art-source/home/<file name>.glb`, using the names in the table. The folder is ignored by git, because raw files are large. I commit only the optimised versions.
5. **Send me a message** when a batch is in the folder. I place the models, set up the materials and lighting, and send screenshots back.

You don't have to match scale, rotation or position. I normalise all of that in code.

### Volume rule

Image-to-3D builds depth from what the concept image shows. A flat, front-on illustration with little shading becomes a paper-thin relief: it looks right from the front and breaks from every other angle. This happened to the first big tree (2 m wide, 3 cm deep) and the first flower bush (a flat disc). Foliage is the riskiest, because a painted leaf clump has no edges that hint at depth.

Every concept image must:

- Show the object from a **three-quarter view from slightly above**, never straight from the front or the side.
- Show **volume through shading**: lit tops, darker undersides, parts in front overlapping parts behind.
- Read as a **sculpted 3D model**, not a flat sticker or a cut-out with outlines.

For foliage (trees, bushes, hedges), add the **volume line** below after the object prompt.

```
Rendered as a solid sculpted 3D model seen from a three-quarter view from slightly above. The
foliage is a full rounded volume of chunky leaf clumps that wrap all the way around, with clumps
behind clumps, sunlit tops and darker shaded undersides. Not a flat illustration, not a sticker.
```

**Round foliage needs multi-view.** A three-quarter concept fixed the tree, because the trunk and branches give away the depth. A bush has no such edges: its third try, from a clearly round concept, still came out 1% deep. For bushes, hedges and other round blobs, make front, side and back views (image-to-image with multi-view on, from the approved concept) and build the model with multi-image-to-3D. The side view forces real depth. It costs 3 credits more than one image.

`npm run art` measures every model before compressing it and refuses one whose thinnest side is under 10% of its widest. A unit test runs the same check on every committed model, so a flat model can't reach the site even if it skips the script. If a model is refused, regenerate the concept with the rule above. Don't widen the threshold.

### Licence check

Free plans on some generators publish models under CC BY, which requires a credit line. Paid plans usually give you full ownership. Check your plan's terms and tell me which licence applies, so I can add the right line to `CREDITS.md`.

---

## Style block

Paste this at the start of every prompt, image and 3D. It keeps all models looking like one world.

```
Hand-painted stylized 3D game asset in the style of a cozy storybook anime background painting.
Soft gouache and watercolor brush strokes, warm sunny afternoon palette, gentle color gradients,
clean readable shapes with slightly exaggerated proportions, light even lighting with no strong
cast shadows, single object, centered, full object visible, plain light background.
```

Add this at the end of every prompt:

```
No text, no logos, no ground plane, no base or pedestal, no other objects.
```

Don't write "Studio Ghibli" or a film title. Generators may refuse it, and the site should be inspired by those films, not copy them.

### Palette to mention when colours drift

Warm terracotta roofs `#C9573E`, sunlit sandy rock `#D8B98C`, fresh grass green `#9BCB5A`, deep leaf green `#4E8B3A`, honey wood `#9C6B43`, warm gold accents `#F3C25B`, sky-blue shadows.

---

## Home island

Full design description, layout and open questions: [islands/home.md](islands/home.md).

Every visitor sees it first. It holds your summary, contacts, skills, education and languages. A cosy cottage under a big tree, with a cat on the bench by the door and a lofi desk behind the round window.

| #   | File name            | Object                               | Budget           | Interactive    | Status                  |
| --- | -------------------- | ------------------------------------ | ---------------- | -------------- | ----------------------- |
| 1   | `island-base.glb`    | Floating rock island with grassy top | 15,000 triangles | No             | **Done**                |
| 2   | `cottage.glb`        | Cottage with a round window          | 8,000            | No             | **Done** (concept v2)   |
| 3   | `big-tree.glb`       | Big broad tree                       | 8,000            | No             | **Done** (concept v3)   |
| 4   | `cat.glb`            | Orange tabby cat, lying down         | 3,000            | Yes: summary   | **Done** (concept v1)   |
| 5   | `lantern.glb`        | Garden lantern on a post             | 2,000            | Yes: skills    | **Done**                |
| 6   | `mailbox.glb`        | Wooden mailbox with a red flag       | 2,000            | Yes: contacts  | **Done**                |
| 7   | `bookshelf.glb`      | Small outdoor bookshelf              | 3,000            | Yes: education | **Done**                |
| 8   | `globe.glb`          | Antique globe on a stand             | 2,000            | Yes: languages | **Done**                |
| 9   | `bench.glb`          | Rustic garden bench for the cat      | 2,000            | No             | **Done**                |
| 10  | `stump.glb`          | Tree stump, table for the globe      | 1,500            | No             | **Done**                |
| 11  | `stepping-stone.glb` | One flat stepping stone, reused ×4   | 500              | No             | **Done**                |
| 12  | `flower-bush.glb`    | Flowering bush, reused ×3            | 2,500            | No             | Later: needs multi-view |
| —   | `desk-window.webp`   | Painted desk behind the round window | image only       | No             | **Done**                |

Everything a visitor sees up close is generated, so painted textures never sit next to flat code shapes. Repeated pieces (stones, bushes) are one model placed several times, so they cost one generation each.

Interactive objects must be separate files, so I can animate them on their own.

### 1. Island base

**Image prompt**

```
A small floating sky island seen from a three-quarter view above: a chunk of warm sandy rock shaped
like an upside-down cone, with a flat lush grassy top and a few wild flowers at the edges. Layered
rock strata, small stones and hanging tree roots dangling from the underside. The grassy top is
mostly open and flat so buildings can stand on it. Wider than it is tall.
```

**3D prompt**

```
Floating sky island, upside-down cone of warm sandy layered rock, flat lush grassy top with a few
wildflowers on the rim, hanging roots and small stones under the rock, top surface mostly flat and
empty.
```

### 2. Cottage

**Image prompt**

```
A tiny cozy countryside cottage with cream plaster walls and exposed honey-colored timber beams, a
steep terracotta tile roof with a slightly crooked brick chimney, one large round window with a
wooden frame and a warm glow inside, a small green wooden door with a step, and a flower box under
a side window. Charming, slightly lopsided, storybook proportions.
```

**3D prompt**

```
Tiny cozy cottage, cream plaster walls with honey timber beams, steep terracotta tile roof, crooked
brick chimney, large round wooden-framed window, small green wooden door with a stone step, flower
box under a side window, storybook proportions.
```

### 3. Big tree

**Image prompt**

```
One big old broad-leaf tree with a thick twisting trunk and a few visible roots, a wide rounded
canopy made of large soft clumps of leaves in several shades of fresh green with sunlit yellow-green
tops. Calm and majestic, like a guardian tree beside a cottage.
```

**3D prompt**

```
Big old broad-leaf tree, thick twisting trunk with visible roots, wide rounded canopy of large soft
leaf clumps in fresh greens with sunlit tops, majestic and calm.
```

### 4. Cat

**Image prompt**

```
A chubby orange tabby cat lying down and relaxing, front paws tucked in, eyes half closed and
content, tail curled around its body, darker orange stripes, cream belly and paws. Simple cute
shapes, no accessories.
```

**3D prompt**

```
Chubby orange tabby cat lying down, paws tucked in, eyes half closed, tail curled around body,
darker orange stripes, cream belly, cute simple shapes.
```

### 5. Garden lantern

**Image prompt**

```
An old-fashioned garden lantern on a slim dark wooden post, a small glass lantern box with a brass
frame and a little pointed roof, a warm golden glow inside.
```

**3D prompt**

```
Old-fashioned garden lantern on a slim dark wooden post, glass lantern box with brass frame and
small pointed roof, warm golden glow inside.
```

### 6. Mailbox

**Image prompt**

```
A rustic wooden mailbox on a short wooden post, rounded top, painted soft sky blue with weathered
edges, a small red metal flag on the side in the down position, a brass latch.
```

**3D prompt**

```
Rustic wooden mailbox on short wooden post, rounded top, soft sky-blue paint with weathered edges,
small red metal flag on the side, brass latch.
```

### 7. Bookshelf

**Image prompt**

```
A small outdoor wooden bookshelf with three shelves and a little slanted roof to keep rain off,
filled with colorful old books leaning at different angles, a small potted plant on top.
```

**3D prompt**

```
Small outdoor wooden bookshelf, three shelves, little slanted wooden roof, colorful old books leaning
at different angles, small potted plant on top.
```

### 8. Globe

**Image prompt**

```
An antique world globe on a carved honey-wood stand with a brass meridian ring, the globe painted in
faded sea blue and parchment-colored continents.
```

**3D prompt**

```
Antique world globe on carved honey-wood stand, brass meridian ring, faded sea-blue oceans and
parchment-colored continents.
```

### 9. Bench

**Image prompt**

```
A short rustic wooden garden bench for one or two people, thick honey-colored planks, a gently
curved backrest, sturdy slightly wonky legs, worn soft edges.
```

**3D prompt**

```
Short rustic wooden garden bench, thick honey-colored planks, gently curved backrest, sturdy slightly
wonky legs, worn soft edges.
```

### 10. Tree stump

**Image prompt**

```
An old wide tree stump cut flat on top, with visible tree rings, thick bark, a few roots spreading
out at the bottom and a little patch of moss on one side. Short and sturdy, wider than it is tall.
```

**3D prompt**

```
Old wide tree stump cut flat on top, visible tree rings, thick bark, spreading roots, small patch of
moss, short and sturdy.
```

### 11. Stepping stone

One stone, placed four times with different turns and sizes.

**Image prompt**

```
A single flat round garden stepping stone, warm sandy grey, softly rounded edges, a little moss in
the cracks. Seen from a three-quarter view above.
```

**3D prompt**

```
Single flat round garden stepping stone, warm sandy grey, softly rounded edges, a little moss in the
cracks.
```

### 12. Flower bush

One bush, placed three times with different turns and sizes.

**Image prompt**

```
A round leafy garden bush made of soft clumps of fresh green leaves, dotted with small white and
pink flowers. Cheerful and compact, about as wide as it is tall.
```

**3D prompt**

```
Round leafy garden bush, soft clumps of fresh green leaves, small white and pink flowers, compact.
```

---

## Checklist for a good result

- [ ] The concept shows the object from a three-quarter view, with shading that shows its volume (see the volume rule).
- [ ] `npm run art` accepts the model. It refuses flat ones.
- [ ] The object stands alone, with no ground plane or pedestal under it.
- [ ] Colours look warm and sunny, not grey or dark.
- [ ] Shapes read clearly as small thumbnails. Fine detail doesn't matter.
- [ ] The texture looks painted, with no photo-like noise.
- [ ] The polycount is near the budget. Up to twice the budget is fine, because I can reduce it.

If one model comes out much better than the others, tell me. I'll tune the remaining prompts to match it.
