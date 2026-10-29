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

Every visitor sees it first. It holds your summary, contacts, skills, education and languages. A cosy cottage under a big tree, with a cat on the bench by the door and a warm glow in the round window.

| #   | File name            | Object                               | Budget           | Interactive    | Status                             |
| --- | -------------------- | ------------------------------------ | ---------------- | -------------- | ---------------------------------- |
| 1   | `island-base.glb`    | Floating rock island with grassy top | 15,000 triangles | No             | **Done**                           |
| 2   | `cottage.glb`        | Cottage with a round window          | 8,000            | No             | **Done** (concept v2)              |
| 3   | `big-tree.glb`       | Big broad tree                       | 8,000            | No             | **Done** (concept v3)              |
| 4   | `cat.glb`            | Orange tabby cat, lying down         | 3,000            | Yes: summary   | **Done** (concept v1)              |
| 5   | `lantern.glb`        | Garden lantern on a post             | 2,000            | Yes: skills    | **Done**                           |
| 6   | `mailbox.glb`        | Wooden mailbox with a red flag       | 2,000            | Yes: contacts  | **Done**                           |
| 7   | `bookshelf.glb`      | Small outdoor bookshelf              | 3,000            | Yes: education | **Done**                           |
| 8   | `globe.glb`          | Antique globe on a stand             | 2,000            | Yes: languages | **Done**                           |
| 9   | `bench.glb`          | Rustic garden bench for the cat      | 2,000            | No             | **Done**                           |
| 10  | `stump.glb`          | Tree stump, table for the globe      | 1,500            | No             | **Done**                           |
| 11  | `stepping-stone.glb` | One flat stepping stone, reused ×4   | 500              | No             | **Done**                           |
| 12  | `flower-bush.glb`    | Flowering bush, reused ×3            | 2,500            | No             | Later: needs multi-view            |
| —   | `desk-window.webp`   | Painted desk behind the round window | image only       | No             | Removed: plain window looks better |

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

## Radio Tower island

Full design description and decisions: [islands/radio.md](islands/radio.md).

A small friendly field station on a rock: a radio tower with a beacon, a bunker lab, a satellite dish, an outdoor screen, a little robot and two shipping containers. Workflow as for Home: concept image (style block + image prompt), review, then image-to-3D. Every prompt asks for a three-quarter view from slightly above, per the volume rule.

| #   | File name          | Object                          | Budget           | Interactive          | Status   |
| --- | ------------------ | ------------------------------- | ---------------- | -------------------- | -------- |
| 1   | `island-base.glb`  | Rocky island, grass patches     | 15,000 triangles | No                   | **Done** |
| 2   | `tower.glb`        | Radio tower (lattice mast)      | 6,000            | No (landmark)        | **Done** |
| 3   | `bunker.glb`       | Bunker in a rock mound          | 6,000            | Yes: test platform   | **Done** |
| 4   | `dish.glb`         | Satellite dish on a post        | 3,000            | Yes: 5 services      | **Done** |
| 5   | `screen.glb`       | Outdoor screen on two legs      | 3,000            | Yes: framework UI    | **Done** |
| 6   | `robot.glb`        | Little hovering tin robot       | 3,000            | Yes: LLM generator   | **Done** |
| 7   | `containers.glb`   | Two stacked shipping containers | 3,000            | Yes: backend & tests | **Done** |
| 8   | `rock-cluster.glb` | Three mossy rocks (shared kit)  | 2,000            | No                   | **Done** |

### 1. Island base

```
A small floating sky island seen from a three-quarter view from slightly above: a rugged chunk of
weathered grey-sand rock shaped like an upside-down cone, layered strata and a few sharp ledges,
small stones and a couple of hanging roots underneath. The top is mostly flat and open, covered in
short grass with a few patches of bare rock showing through, so buildings can stand on it. Wider
than it is tall.
```

**Lesson for the next islands:** the "patches of bare rock" above came out as grey strips all along the rim, which looked like gaps. `npm run art` now repaints them as grass (`grassTop: true` in `scripts/optimize-art.mjs`). For future bases, ask for "the whole top evenly covered in grass right up to the edge, no bare patches" instead, and add rocks as separate models where wanted.

### 2. Radio tower

```
A tall classic radio transmission tower seen from a three-quarter view from slightly above: a
slender tapering steel lattice mast with clear X cross-bracing, painted in red and white bands,
on a small square concrete footing. Two small dish antennas and a few short rod antennas near the
top, a little railed platform about two thirds of the way up, a round yellow beacon lamp on the very
tip. Stylized with beams a bit thicker than real ones so the shape is bold and readable, but it is
clearly a real radio mast, not a toy.
```

### 3. Bunker lab

```
A small rounded concrete bunker lab half dug into a grassy rock mound, seen from a three-quarter
view from slightly above. Smooth weathered concrete front with soft rounded edges, a yellow
round-topped metal door in the middle, a small caged lamp above the door, a couple of air vents
and a few cables running along the wall into the ground. Grass and small stones on top of the
mound. Cosy and friendly, like a hobbit hole for engineers.
```

### 4. Satellite dish

```
A white satellite dish on a short sturdy round metal post, seen from a three-quarter view from
slightly above. The dish is a deep bowl tilted up towards the sky, with a small feed horn held in
front of it on three thin struts, a little control box on the post. Slightly weathered paint, a few
bolts, chunky readable shapes.
```

### 5. Outdoor screen

```
A large flat outdoor display screen standing on two sturdy wooden legs with cross braces, like a
small outdoor cinema billboard, seen from a three-quarter view from slightly above. A thick
dark-grey frame with rounded corners around a plain, evenly lit, empty light-grey screen face,
a small sloped roof over the top edge, a cable running down one leg to the ground.
```

The screen face must stay plain and empty: the UI picture is drawn on it in code.

### 6. Helper robot

```
A small cute round tin robot hovering above the ground, seen from a three-quarter view from
slightly above. A rounded body like a little barrel, painted cream and signal yellow with a few
rivets, a small screen face showing two friendly dot eyes, one thin antenna with a round tip on
top, two short stubby arms, no legs, a faint jet glow under the body. Friendly and curious.
```

### 7. Shipping containers

```
Two small corrugated shipping containers stacked on top of each other, seen from a three-quarter
view from slightly above. The bottom one is signal yellow, the top one is sky blue, slightly offset
from each other. Ridged metal walls, door handles and locking bars on the end doors, a soft painted
wave shape on the side of the blue one. Slightly weathered paint, chunky readable shapes.
```

### 8. Rock cluster (shared kit)

```
A small cluster of three rounded mossy rocks of different sizes sitting together, seen from a
three-quarter view from slightly above. Warm grey-sand stone with soft painted strata, patches of
green moss on the tops, a couple of tiny pebbles around them.
```

---

## Market Town island

Full design description and decisions: [islands/market.md](islands/market.md).

A sunny hilltop market square: a domed bank with stacked houses behind it, a coin fountain, a little tram, a signpost, a hot-air balloon, a toy crane and an old shack beside a glass building. Every prompt asks for a three-quarter view (volume rule), and the base asks for grass right up to the edge (lesson from Radio).

| #   | File name         | Object                            | Budget           | Interactive           | Status   |
| --- | ----------------- | --------------------------------- | ---------------- | --------------------- | -------- |
| 1   | `island-base.glb` | Island with a cobbled square      | 15,000 triangles | No                    | **Done** |
| 2   | `bank.glb`        | Domed bank                        | 6,000            | No (landmark)         | **Done** |
| 3   | `houses.glb`      | Cluster of stacked town houses    | 6,000            | No                    | **Done** |
| 4   | `fountain.glb`    | Round coin fountain               | 3,000            | Yes: PDL app          | **Done** |
| 5   | `shack-glass.glb` | Old shack beside a glass building | 4,000            | Yes: Next.js move     | **Done** |
| 6   | `tram.glb`        | One small tram car                | 3,000            | Yes: BNPL flows       | **Done** |
| 7   | `signpost.glb`    | Signpost with 6 arms              | 2,000            | Yes: account areas    | **Done** |
| 8   | `balloon.glb`     | Hot-air balloon with basket       | 3,000            | Yes: FSD and releases | **Done** |
| 9   | `crane.glb`       | Small toy-like tower crane        | 3,000            | Yes: shared packages  | **Done** |

### 1. Island base

```
A small floating sky island seen from a three-quarter view from slightly above: a chunk of warm
sandy rock shaped like an upside-down cone, layered strata, a few hanging roots underneath. The top
is flat and open: a round cobbled town square in the middle, surrounded by short green grass that
covers the rest of the top evenly, right up to the edge, with no bare rock patches. Wider than it
is tall.
```

### 2. Domed bank

```
A small domed bank building in a sunny southern town style, seen from a three-quarter view from
slightly above: cream stone walls, four white columns and a few steps at the front, tall arched
windows, terracotta trim, a round gold dome on top with a tiny flag. Charming storybook proportions.
```

### 3. Stacked houses

```
A tight cluster of five narrow town houses built together on different levels, like a tiny hillside
village, seen from a three-quarter view from slightly above: plaster walls in cream, ochre, peach
and pale blue, terracotta tile roofs, small balconies with flower pots, wooden shutters. One compact
solid group.
```

### 4. Coin fountain

```
A round stone fountain for a town square, seen from a three-quarter view from slightly above: a wide
low basin of warm sandy stone, a short central pillar with a small bowl on top pouring water, clear
blue water with gold coins glinting at the bottom.
```

### 5. Old shack and glass building

```
An old leaning wooden shack with a patched tin roof standing right against a small modern two-storey
building of glass and white frames, the two touching as one small group, old and new side by side.
Seen from a three-quarter view from slightly above. Storybook proportions.
```

### 6. Tram

```
A single small old-fashioned tram car, cream and terracotta red with gold trim, a rounded roof, big
front windows, a little bell and a pantograph on the roof, standing on its own small wheels with no
rails. Seen from a three-quarter view from slightly above. Cute, chunky, toy-like.
```

### 7. Signpost

```
A wooden signpost on a sturdy post with six arrow-shaped arms pointing in different directions at
different heights, painted terracotta, cream, sky blue and gold, blank arms with no writing. Seen
from a three-quarter view from slightly above.
```

### 8. Hot-air balloon

```
A hot-air balloon with a round striped envelope in terracotta, cream and gold, a small wicker basket
hanging below on ropes, floating. Seen from a three-quarter view from slightly above.
```

### 9. Crane

```
A small toy-like yellow tower crane, seen from a three-quarter view from slightly above: a chunky
lattice mast on a square base, a horizontal jib with a counterweight block, a tiny operator cab, a
hook hanging on a cable. Thick beams, bold readable shapes.
```

---

## Arena island

Full design description and decisions: [islands/arena.md](islands/arena.md).

A little floating stadium on match day: the stadium in the middle, a scoreboard, three display stands, a parcel box and two towers facing each other. Screen and scoreboard faces stay plain; their pictures are drawn in code.

| #   | File name            | Object                                      | Budget           | Interactive          | Status   |
| --- | -------------------- | ------------------------------------------- | ---------------- | -------------------- | -------- |
| 1   | `island-base.glb`    | Wide flat island, grass to the edge         | 15,000 triangles | No                   | **Done** |
| 2   | `stadium.glb`        | Small oval stadium with 4 floodlights       | 8,000            | No (landmark)        | **Done** |
| 3   | `scoreboard.glb`     | Tall scoreboard on two legs                 | 3,000            | Yes: virtual scroll  | **Done** |
| 4   | `display-stands.glb` | Three display stands (phone, desktop, gate) | 4,000            | Yes: 3 apps, team    | **Done** |
| 5   | `parcel.glb`         | Big taped cardboard parcel box              | 1,500            | Yes: bundle −40%     | **Done** |
| 6   | `twin-towers.glb`    | Two slim towers facing each other           | 4,000            | Yes: iframe messages | **Done** |

### 1. Island base

```
A small floating sky island seen from a three-quarter view from slightly above: a wide flat disc of
land on a chunk of warm sandy rock shaped like a shallow upside-down cone, layered strata, a few
hanging roots underneath. The flat top is evenly covered in short fresh green grass right up to
the edge, with no bare patches. Much wider than it is tall.
```

### 2. Stadium

```
A small cute oval open-air football stadium seen from a three-quarter view from slightly above: low
curved stands painted stadium blue and white with rows of little seats all around, a green pitch
with white lines inside, four slim floodlight towers at the corners with lamp panels on top, a few
pennant poles on the rim. Toy-like storybook proportions, compact.
```

### 3. Scoreboard

```
A tall old-fashioned stadium scoreboard standing on two sturdy legs, seen from a three-quarter view
from slightly above: a big flat board face, plain dark blue and completely empty, framed in white
with rounded corners, a small roof on top with a little round clock.
```

### 4. Display stands

```
Three outdoor display stands side by side on one low shared platform, seen from a three-quarter view
from slightly above: a tall narrow one shaped like a giant phone, a wide one like a desktop monitor
on a stand, and a small arched gate with a big golden padlock hanging on it. Screen faces plain,
empty and dark blue. Stadium blue and white frames.
```

### 5. Parcel box

```
A big chunky cardboard parcel box, slightly bulging, wrapped with tan packing tape, a blank shipping
label, soft rounded edges, seen from a three-quarter view from slightly above.
```

### 6. Twin towers

```
Two slim modern towers standing side by side with a small gap between them, joined at the base, seen
from a three-quarter view from slightly above: white walls with stadium blue accents, a column of
warm lit windows on each tower on the sides facing each other, flat roofs with small antennas.
```

---

## Green Grove island

Full design description and decisions: [islands/grove.md](islands/grove.md).

A calm mossy grove: a huge old tree with a small shrine at its foot, recycling bins, saplings, a collection box and a noticeboard. The two trees use the foliage volume line (see the volume rule). The noticeboard's face stays plain; its notes are code-made.

| #   | File name            | Object                                     | Budget           | Interactive          | Status   |
| --- | -------------------- | ------------------------------------------ | ---------------- | -------------------- | -------- |
| 1   | `island-base.glb`    | Mossy rock island, grass and moss to edge  | 15,000 triangles | No                   | **Done** |
| 2   | `big-tree.glb`       | Home's big tree, re-toned (willow failed)  | 8,000            | No (landmark)        | **Done** |
| 3   | `shrine.glb`         | Small mossy stone shrine                   | 2,000            | No                   | **Done** |
| 4   | `recycling-bins.glb` | Three recycling bins in a row              | 3,000            | Yes: led the team    | **Done** |
| 5   | `sapling.glb`        | One staked sapling (placed ×4)             | 1,500            | Yes: built, mentored | **Done** |
| 6   | `noticeboard.glb`    | Wooden noticeboard on legs, plain face     | 2,000            | Yes: admin content   | **Done** |
| 7   | `collection-box.glb` | Wooden collection box on a post, coin slot | 1,500            | Yes: ЮKassa payments | **Done** |

### 1. Island base

```
A small floating sky island seen from a three-quarter view from slightly above: a chunk of dark
mossy rock shaped like an upside-down cone, layered strata with moss and small ferns in the cracks,
a few hanging roots and vines underneath. The flat top is evenly covered in lush short green grass
and soft moss right up to the edge, with no bare patches. Wider than it is tall.
```

### 2. Big old tree

```
One huge old broad-leaf tree with a thick twisting mossy trunk and big roots gripping the ground,
and a wide domed crown of lush deep green leaf clumps. Rendered as a solid sculpted 3D model seen
from a three-quarter view from slightly above. The foliage is a full rounded volume of chunky leaf
clumps that wrap all the way around, with clumps behind clumps, sunlit tops and darker shaded
undersides. Not a flat illustration, not a sticker.
```

### 3. Shrine

```
A small mossy stone wayside shrine, seen from a three-quarter view from slightly above: a simple
little stone box on a short stone base, a small pitched stone roof covered in moss, a tiny
offering shelf in front. Old, weathered, calm.
```

### 4. Recycling bins

```
Three small rounded recycling bins standing side by side, seen from a three-quarter view from
slightly above: one green, one blue, one yellow, each with a rounded hinged lid and a soft white
stripe, no symbols or writing. Chunky, friendly shapes.
```

### 5. Sapling

```
A single young sapling tied to a thin wooden stake, seen from a three-quarter view from slightly
above: a slim trunk and a small round crown of fresh green leaves, a little mound of soil at its
foot. Rendered as a solid sculpted 3D model; the small crown is a full rounded volume of leaf
clumps with sunlit tops and shaded undersides.
```

### 6. Noticeboard

```
A wooden noticeboard standing on two legs with a small pitched wooden roof on top, seen from a
three-quarter view from slightly above: a plain empty cork board face in a wooden frame, no notes,
no paper, no writing.
```

### 7. Collection box

```
A small wooden collection box on a sturdy wooden post, seen from a three-quarter view from slightly
above: a box with a coin slot on top, brass corners and a little pitched wooden roof, like a
donation box at a nature reserve. No writing.
```

---

## Workshop island

Full design description and decisions: [islands/workshop.md](islands/workshop.md).

A cosy old engineering workshop: a red-brick factory with two chimneys, brass gears, a steam whistle, a workbench with an oscilloscope, a circuit board on an easel and a scroll on a lectern. Screen and board faces stay plain; their pictures are code-made.

| #   | File name           | Object                                      | Budget           | Interactive           | Status   |
| --- | ------------------- | ------------------------------------------- | ---------------- | --------------------- | -------- |
| 1   | `island-base.glb`   | Rock with metal plates and pipes, grass top | 15,000 triangles | No                    | **Done** |
| 2   | `factory.glb`       | Red-brick workshop with two chimneys        | 8,000            | No (landmark)         | **Done** |
| 3   | `gear.glb`          | One brass gear (placed ×3)                  | 1,500            | No (turns)            | **Done** |
| 4   | `whistle.glb`       | Brass steam whistle on a pipe stand         | 1,500            | Yes: led the projects | **Done** |
| 5   | `workbench.glb`     | Workbench with an oscilloscope              | 4,000            | Yes: 30+ projects     | **Done** |
| 6   | `circuit-board.glb` | Big circuit board on an easel               | 2,500            | Yes: 100+ elements    | **Done** |
| 7   | `lectern.glb`       | Wooden lectern with a rolled scroll         | 2,000            | Yes: Python macros    | **Done** |

### 1. Island base

```
A small floating sky island seen from a three-quarter view from slightly above: a chunk of warm
sandy rock shaped like an upside-down cone, patched here and there with riveted copper and iron
plates, a few short copper pipes sticking out of its sides, a couple of hanging roots underneath.
The flat top is evenly covered in short green grass right up to the edge, with no bare patches.
Wider than it is tall.
```

### 2. Factory

```
A small cosy red-brick workshop building seen from a three-quarter view from slightly above: two
tall brick chimneys, arched windows with a warm glow inside, a big wooden double door, copper
gutters and a few pipes along the walls, a slate roof. One side wall is plain brick, with room for
gears. Charming storybook proportions, more watchmaker's shop than heavy industry.
```

### 3. Gear

```
A single chunky brass gear wheel lying flat, seen from a three-quarter view from slightly above:
thick rounded teeth, a hub in the middle with a few bolts, slightly worn polished brass. One solid
object with real thickness.
```

### 4. Steam whistle

```
A brass factory steam whistle on a short iron pipe stand, seen from a three-quarter view from
slightly above: a tall polished brass bell-shaped whistle, a red valve wheel on the pipe, a small
pressure gauge, bolts and a round iron foot.
```

### 5. Workbench with an oscilloscope

```
A sturdy wooden workbench seen from a three-quarter view from slightly above, with an old boxy
oscilloscope on top whose round-cornered screen is plain dark green and empty, a soldering iron in
a stand, a few small electronic parts and a little lamp. Warm wood, brass knobs.
```

### 6. Circuit board on an easel

```
A large green printed circuit board standing on a wooden easel, seen from a three-quarter view from
slightly above: copper traces, rows of tiny electronic parts, a few chips and capacitors, a thick
board with a frame. Chunky, readable shapes.
```

### 7. Lectern with a scroll

```
A wooden lectern with a slanted top, seen from a three-quarter view from slightly above, with a
rolled paper scroll tied with a ribbon lying on the slanted top. Carved warm wood, simple and solid.
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
