# Radio Tower island

[Back to Phase 4](../phase-4-island-art.md) · [AI model prompts](../phase-4-ai-prompts.md) · Previous: [Home](home.md)

**Status:** design decided (2026-10-28, section 9). Next: concept images.

---

## 1. What this island is for

Radio Gigabit, Senior Full Stack Engineer, part-time, November 2022 to now. The company makes wireless test equipment; the work is an internal test platform with two products. It is the only ongoing job, so the island is "switched on": a lit beacon, a "Now" badge on the label (already built), and a faint signal always going out.

| Achievement                                                     | Object on the island         |
| --------------------------------------------------------------- | ---------------------------- |
| LLM test generator (chat UI and FastAPI service)                | Little helper robot          |
| Architected the test platform, 2 products                       | Bunker lab with a door       |
| Rebuilt the framework UI (component kit, light and dark themes) | Big outdoor screen           |
| Connected 5 services, live terminal                             | Satellite dish               |
| FastAPI, PostgreSQL, Docker, tests                              | Stack of shipping containers |

The panel lists all five achievements and the tech chips, as now. The objects are the playful second way in, exactly like Home.

---

## 2. The feeling

A small, friendly field station on a hilltop: a radio tower humming in the wind, a lab dug into the rock, equipment left outside on a nice day. Clever but cosy, not industrial or cold.

- **Time of day:** the same warm late afternoon as Home, so the world stays one moment in time.
- **Mood words:** curious, busy in a calm way, tinkering, "always on".
- **Accent colour:** signal yellow `#F3C25B`, used on the label, panel stamp, beacon and the bunker door.
- **Sound** (later, AI-made): soft radio static, a hum from the tower, a little beep from the robot.

---

## 3. How it looks from far away (overview)

Radio sits at the back of the world, high up (`[0, 4, -22]`). From the overview it must read in one glance as "a radio tower on a rock", by silhouette alone:

- a tall, slim antenna tower, the tallest thing on any island, with a yellow beacon on top that pulses slowly,
- faint signal rings rising from the beacon every few seconds,
- the round satellite dish to one side,
- a rugged grey-sand rock underneath, with a few patches of grass.

---

## 4. Layout (seen from above)

The island top is about 11 metres across. The focus camera looks from the front right (about 54° from +X) and about 19° down.

**Layout rule (revised 2026-10-28, after the first layout hid things).** Two rows across the camera's view, about 5 m apart:

- **Back row, the tall things:** tower on the left, bunker in the middle, dish on the right.
- **Front row:** screen on the left, robot in the middle, containers on the right.

Each front object has its own column. Because the camera looks down, an object 5 m closer appears about 1.8 m lower on screen, so the front row never hides the back row. The robot is small, so it can stand in front of the bunker without covering the door. Rocks sit at the side edges, where they cover nothing.

Seen from the camera:

```
        [ TOWER ]          [ BUNKER LAB ]          [ DISH ]
          beacon            yellow door
                                                              back row
   ──────────────────────── about 5 m ────────────────────────
  rocks   [ SCREEN ]           [robot]          [CONTAINERS]   rocks
                                                              front row
```

Positions are written in code as "across the view, towards the camera" and turned into island x and z by a small helper in `RadioIsland.tsx`.

| Object         | Across, towards   | Island x, z  | Size            |
| -------------- | ----------------- | ------------ | --------------- |
| Tower          | −2.5, −3          | −3.88, 0.23  | 9 tall          |
| Bunker lab     | 0, −3             | −2.40, −1.77 | 3.2 long        |
| Satellite dish | 2.5, −3           | −0.93, −3.77 | 2.2 tall        |
| Big screen     | −2.2, 2.3         | 0.54, 3.12   | 2.2 tall        |
| Helper robot   | 0, 2.3            | 1.84, 1.36   | 0.9 long        |
| Containers     | 2.2, 2.3          | 3.14, −0.40  | 2 tall (2 high) |
| Rocks          | ±4, 0 · −0.9, 3.8 | side edges   | 1.1 to 1.6 long |

---

## 5. Objects

All five follow the Home pattern: hover glows gold with a hint, click plays a short reaction and sound, and the panel scrolls to the achievement and flashes it. Each achievement in the panel gets a "Show me" button. The reactions are simple and cosy, made in code, about a second long.

### Helper robot · LLM test generator

A small round tin robot with one antenna and a friendly screen face, hovering a little above the ground.

- **Idle:** floats up and down slowly, its antenna tip blinks.
- **Click:** a happy hop, and a small paper scroll pops out of its chest and unrolls a little (code-made, like the mailbox letter).

### Bunker lab · Architected the test platform

A rounded concrete bunker half dug into a grassy rock mound, with a yellow round-topped door and a small lamp above it.

- **Idle:** the lamp above the door glows softly.
- **Click:** a warm light in front of the door swells, as if the lab inside just switched on, then fades back (decision 2). Light only, no glowing shape.

### Big screen · Rebuilt the framework UI

An outdoor screen on two wooden legs, like a small cinema billboard.

- **Idle:** shows a simple drawing of the test platform UI: a sidebar, a list of tests, a few cards. Drawn in code, so it stays sharp and can change.
- **Click:** the UI switches between its light and dark theme, with a soft fade.

### Satellite dish · Connected 5 services

A white dish on a short round post, tilted to the sky.

- **Idle:** turns very slowly, scanning.
- **Click:** sweeps round once, and five small signal arcs ripple out from it (code-made rings).

The whole dish turns, post included. The post is round, so its turning is invisible, and one model is enough.

### Shipping containers · FastAPI, PostgreSQL, Docker, tests

Two small shipping containers stacked, one yellow and one blue, with a whale-like curve painted on the side as a nod to Docker (not the real logo).

- **Idle:** still.
- **Click:** a short wobble, and a green check mark pops up above them and fades (code-made).

---

## 6. Ambient life (idle, no click needed)

| What         | Motion                                                              |
| ------------ | ------------------------------------------------------------------- |
| Whole island | Bobs slowly (shared by all islands)                                 |
| Beacon       | Pulses slowly: a soft glow and a small light, never a harsh blink   |
| Signal rings | A thin ring rises from the beacon every 4 seconds, grows and fades  |
| Robot        | Floats, antenna blinks                                              |
| Dish         | Turns very slowly                                                   |
| Fireflies    | None here; maybe a few dust motes in the light from the bunker door |

---

## 7. What is AI-generated and what is code

| AI-generated (Meshy)                                                              | Code                                                                                  |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Island base, tower, bunker (door included), dish, screen frame, robot, containers | Beacon glow and light, signal rings, doorway glow, screen picture, scroll, check mark |
| Shared kit: a rock cluster (reused by later islands)                              | All motion, hover, sounds, panel link                                                 |

Every concept follows the volume rule: a three-quarter view with shading that shows depth. `npm run art` refuses flat models.

---

## 8. Models and cost

| #   | File               | Object                          | Budget      | Notes                                           |
| --- | ------------------ | ------------------------------- | ----------- | ----------------------------------------------- |
| 1   | `island-base.glb`  | Rocky island, grass patches     | 15,000 tris | Greyer, rougher rock than Home                  |
| 2   | `tower.glb`        | Radio tower (lattice mast)      | 6,000       | Riskiest model, see decision 1                  |
| 3   | `bunker.glb`       | Bunker in a rock mound          | 6,000       | Yellow door included, closed                    |
| 4   | `dish.glb`         | Satellite dish on a post        | 3,000       |                                                 |
| 5   | `screen.glb`       | Outdoor screen on two legs      | 3,000       | Screen face plain; the picture is code          |
| 6   | `robot.glb`        | Little hovering tin robot       | 3,000       |                                                 |
| 7   | `containers.glb`   | Two stacked shipping containers | 3,000       |                                                 |
| 8   | `rock-cluster.glb` | Three mossy rocks (shared kit)  | 2,000       | Reused on later islands, so it is paid for once |

| Step                           | Items | Credits  |
| ------------------------------ | ----- | -------- |
| Concept images (nano-banana)   | 8     | 24       |
| Review the concepts with you   |       | 0        |
| Textured 3D models (Meshy 7.1) | 8     | 240      |
| Spare for one or two retries   |       | ~36      |
| **Total**                      |       | **~300** |

Balance now: 626 credits, so about 326 would be left.

---

## 9. Decisions (2026-10-28)

1. **The tower must still look like a radio tower.** A classic tapering lattice mast with X cross-bracing, red and white bands, antennas near the top and the beacon on the tip. The beams are drawn thicker than real ones so the AI can build them, but the silhouette stays a real radio mast. If the first try comes out melted, the fallback is a lattice built in code.
2. **The bunker door glows, it doesn't open.** One model with the door included. The click makes the doorway and the lamp above it glow warmly, then fade.
3. **Rocks and grass only.** No ferns or bushes for now.
4. **The robot is a small round tin robot** with one antenna and a screen face.
5. **The screen picture:** a simplified drawing of the test platform UI, light and dark. The user may send a screenshot (with anything confidential removed) or a short description of the layout and colours. It is drawn in code, so it doesn't block the models.
