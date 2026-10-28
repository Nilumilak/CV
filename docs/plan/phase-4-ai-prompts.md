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

Every visitor sees it first. It holds your summary, contacts, skills, education and languages. A cosy cottage under a big tree, with a cat on the windowsill, as in your lofi reference.

| #   | File name              | Object                                | Budget           | Interactive    |
| --- | ---------------------- | ------------------------------------- | ---------------- | -------------- |
| 1   | `island-base.glb`      | Floating rock island with grassy top  | 15,000 triangles | No             |
| 2   | `cottage.glb`          | Cottage with a round window           | 8,000            | No             |
| 3   | `big-tree.glb`         | Big broad tree                        | 8,000            | No             |
| 4   | `cat.glb`              | Orange tabby cat, lying down          | 3,000            | Yes: summary   |
| 5   | `lantern.glb`          | Garden lantern on a post              | 2,000            | Yes: skills    |
| 6   | `mailbox.glb`          | Wooden mailbox with a red flag        | 2,000            | Yes: contacts  |
| 7   | `bookshelf.glb`        | Small outdoor bookshelf               | 3,000            | Yes: education |
| 8   | `globe.glb`            | Antique globe on a stand              | 2,000            | Yes: languages |
| 9   | `props.glb` (optional) | Bench, flower bushes, stepping stones | 4,000            | No             |

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

### 9. Props (optional)

Generate these one at a time, or skip them. I can fill gaps with simple shapes in code.

```
A short rustic wooden garden bench with a curved backrest.
```

```
A round flowering bush with small white and pink flowers.
```

```
Three flat round stepping stones in a short row.
```

---

## Checklist for a good result

- [ ] The object stands alone, with no ground plane or pedestal under it.
- [ ] Colours look warm and sunny, not grey or dark.
- [ ] Shapes read clearly as small thumbnails. Fine detail doesn't matter.
- [ ] The texture looks painted, with no photo-like noise.
- [ ] The polycount is near the budget. Up to twice the budget is fine, because I can reduce it.

If one model comes out much better than the others, tell me. I'll tune the remaining prompts to match it.
