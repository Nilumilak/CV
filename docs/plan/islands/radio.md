# Radio Tower island

[Back to Phase 4](../phase-4-island-art.md) · [AI model prompts](../phase-4-ai-prompts.md) · Previous: [Home](home.md)

**Status:** design draft for review (2026-10-28). Nothing generated yet.

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

The island top is about 11 metres across. The camera looks from the front right, like on Home. Following the Home layout rule, objects are spread across that view, not lined up along it.

```
                         back (away from the camera)
                 .-----------------------------------.
               /   [ TOWER ]                           \
              /     beacon                              \
             |   [BUNKER LAB]                [  DISH  ]  |
             |    yellow door                            |
     left    |                                           |   right
             |                 open yard                 |
             |  [SCREEN]                                 |
              \      [robot]              [CONTAINERS]  /
               \                                       /
                 '-----------------------------------'
                       front (towards the camera)
                                  ↘ camera
```

| Object          | Position (x, z) | Size            | Notes                                                    |
| --------------- | --------------- | --------------- | -------------------------------------------------------- |
| Tower           | −3.0, −1.8      | 9 tall          | Back left; tall enough to show behind everything         |
| Bunker lab      | −2.4, −0.2      | 2.2 tall        | Built into a rock mound, door facing the camera          |
| Satellite dish  | 2.4, −1.6       | 2.2 tall        | Back right, pointing at the sky                          |
| Big screen      | −2.2, 2.2       | 2.4 wide        | Front left, on two legs, turned to the camera            |
| Helper robot    | −0.6, 2.6       | 0.9 tall        | Next to the screen, as if it is working on it            |
| Containers      | 3.2, 1.4        | 2 tall (2 high) | Front right                                              |
| Rocks and grass | around the rim  | mixed           | Fill the gaps; reused later by other islands (section 8) |

Positions are a first guess. As on Home, they are tuned after the first screenshot.

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
- **Click:** the door swings open, warm light spills out, and it closes again. The door is a separate model so it can turn on its hinge (see question 2).

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

| AI-generated (Meshy)                                                           | Code                                                                    |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Island base, tower, bunker, bunker door, dish, screen frame, robot, containers | Beacon glow and light, signal rings, screen picture, scroll, check mark |
| Shared kit: a rock cluster (reused by later islands)                           | All motion, hover, sounds, panel link                                   |

Every concept follows the volume rule: a three-quarter view with shading that shows depth. `npm run art` refuses flat models.

---

## 8. Models and cost

| #   | File               | Object                          | Budget      | Notes                                           |
| --- | ------------------ | ------------------------------- | ----------- | ----------------------------------------------- |
| 1   | `island-base.glb`  | Rocky island, grass patches     | 15,000 tris | Greyer, rougher rock than Home                  |
| 2   | `tower.glb`        | Antenna tower                   | 6,000       | Riskiest model, see question 1                  |
| 3   | `bunker.glb`       | Bunker in a rock mound, no door | 6,000       | Doorway left as a dark opening                  |
| 4   | `bunker-door.glb`  | Yellow round-topped door        | 1,000       | Separate, so it can swing (question 2)          |
| 5   | `dish.glb`         | Satellite dish on a post        | 3,000       |                                                 |
| 6   | `screen.glb`       | Outdoor screen on two legs      | 3,000       | Screen face plain; the picture is code          |
| 7   | `robot.glb`        | Little hovering tin robot       | 3,000       |                                                 |
| 8   | `containers.glb`   | Two stacked shipping containers | 3,000       |                                                 |
| 9   | `rock-cluster.glb` | Three mossy rocks (shared kit)  | 2,000       | Reused on later islands, so it is paid for once |

| Step                           | Items | Credits  |
| ------------------------------ | ----- | -------- |
| Concept images (nano-banana)   | 9     | 27       |
| Review the concepts with you   |       | 0        |
| Textured 3D models (Meshy 7.1) | 9     | 270      |
| Spare for one or two retries   |       | ~33      |
| **Total**                      |       | **~330** |

Balance now: 626 credits, so about 296 would be left. Without the separate door (question 2), it is 30 less.

---

## 9. Questions for you

1. **The tower.** A thin lattice tower is the hardest shape for AI 3D: thin beams tend to come out blobby, melted or flat. Options:
   - **a.** A chunkier, storybook tower: thick painted beams, a little wooden platform halfway up, the beacon on top. Easier for the AI, still reads as a radio tower. (My recommendation.)
   - **b.** A clean lattice tower built in code from simple beams. Reliable and cheap, but it would look smoother than the painted models around it.
   - **c.** Try the real thin lattice and see. Might cost a retry or two.
2. **The bunker door.** Should the door really swing open (a separate door model, +30 credits), or should the click just make the door lamp and the doorway glow (one model)?
3. **Greenery.** Ferns or bushes would make it cosier, but round foliage needs multi-view (about 33 credits each). Rocks and grass only for now, or one fern model too?
4. **The robot.** Small round tin robot with one antenna and a screen face. Does that fit, or would you like a different helper (for example a little owl with headphones)?
5. **The screen picture.** A simple drawing of the real test platform UI (sidebar, test list, cards) in light and dark. OK, or something else on it?
