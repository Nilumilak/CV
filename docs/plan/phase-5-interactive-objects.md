# Phase 5. Interactive objects

[Back to plan](../../PLAN.md) · Previous: [Phase 4](phase-4-island-art.md) · Next: [Phase 6. Polish](phase-6-polish.md)

**Estimate:** 1 to 2 weeks
**Goal:** every achievement has an animated object on its island. Clicking the object plays a short scene and highlights the achievement. Hovering an achievement in the panel makes its object glow.

---

## Interaction rules

1. **Idle.** Every interactive object moves a little on its own, so visitors notice it is alive.
2. **Hover.** Gold outline, scale up to about 1.07, pointer cursor, small tooltip with the achievement's short title.
3. **Click.** A reaction animation of 0.6 to 1.5 seconds, a soft sound, and the panel scrolls to and highlights the achievement.
4. **Two-way link.** Hovering an achievement in the panel makes its object glow.
5. **Only when focused.** Objects react only on the focused island. In the overview, clicking any object just focuses its island.
6. **Discovery.** The panel shows "2 of 4 discovered". Found objects get a small gold sparkle afterwards.
7. **Keyboard parity.** Each achievement in the panel has a small "Show me" button that triggers the same animation.

---

## Tasks

### 1. Object registry
- [ ] Add `objectId` to every achievement in `cv.ts`, using the [catalogue](#object-catalogue) below.
- [ ] Extend the data test: every `objectId` must be unique and must appear in a registry of object components.

### 2. Interactable wrapper
- [ ] Create `src/objects/Interactable.tsx`. It handles hover, click, scale, the outline flag and the tooltip, and passes state to its children through context.

```tsx
// src/objects/Interactable.tsx (sketch)
const InteractContext = createContext({ hovered: false, glowing: false });
export const useInteract = () => useContext(InteractContext);

export function Interactable({ id, island, title, onActivate, children }: Props) {
  const ref = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);
  const enabled = useWorld((s) => s.focused === island);
  const hinted = useWorld((s) => s.hintObject === id);
  const activate = useWorld((s) => s.activateObject);

  useCursor(hovered && enabled);
  useFrame((_, delta) => {
    easing.damp3(ref.current.scale, hovered && enabled ? 1.07 : 1, 0.15, delta);
  });

  return (
    <group
      ref={ref}
      onPointerOver={(e) => { if (!enabled) return; e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        if (!enabled) return;            // let the click reach the island and focus it
        e.stopPropagation();
        activate(id);
        onActivate();
      }}
    >
      <InteractContext.Provider value={{ hovered: hovered && enabled, glowing: hinted || (hovered && enabled) }}>
        {children}
      </InteractContext.Provider>
      {hovered && enabled && <Tooltip text={title} />}
    </group>
  );
}
```

- [ ] Inside object meshes, read `glowing` from context and toggle `<Outlines visible={glowing} color="#F3C25B" />`.
- [ ] Use one small `Html` tooltip at a time, not one per object.

### 3. Animation toolbox
Use the simplest technique that works.

| Technique | Use for | How |
|---|---|---|
| Procedural `useFrame` | Spinning, bobbing, blinking, pointing | Mutate refs with `maath` easing |
| Small state machine | Multi-step reactions | A ref holding `'idle' | 'playing'` and a timer |
| Blender animation clips | Complex motion, characters | drei `useAnimations`, play a clip on click |
| Particles | Coins, leaves, sparkles | drei `Sparkles`, or a small instanced burst |
| Shader tricks | Screens, scrolling text, waves | A `ShaderMaterial` or a canvas texture with a time uniform |

```tsx
// pattern for a one-shot click reaction
const play = useRef(0);   // seconds left
useFrame((_, dt) => {
  if (play.current > 0) {
    play.current = Math.max(play.current - dt, 0);
    const t = 1 - play.current / 1.2;          // 0 to 1
    dish.current.rotation.y = idleAngle + Math.sin(t * Math.PI) * 1.4;
  } else {
    dish.current.rotation.y += dt * 0.2;       // idle scan
  }
});
const onActivate = () => (play.current = 1.2);
```

### 4. Panel link
- [ ] When `activeObject` changes, the panel scrolls the matching achievement into view and plays a short gold highlight.
- [ ] Hovering or focusing an achievement calls `setHint(objectId)`, and leaving calls `setHint(null)`.
- [ ] Add the "Show me" button next to each achievement.

### 5. Discovery counter and reward
- [ ] Show "x of y discovered" in the panel header. `found` is persisted, so it survives reloads.
- [ ] When every object on every island is found, a paper plane flies from the last island to Home and the mailbox opens with a friendly "Let's talk" and the contact options.

### 6. Sounds
- [ ] One short sound per object type: a click, a whoosh, a chime, coins, a bell. Keep them soft and under 1 second.
- [ ] Respect the global mute.

---

## Object catalogue

One object per achievement. Achievement ids are suggestions for `cv.ts`.

### Home · About

| Object | Idle | On click | Reveals |
|---|---|---|---|
| Cat on the windowsill | Tail swings, ears twitch | Stretches, yawns, a speech bubble shows the summary | Summary |
| Desk lamp | Soft glow | Clicks brighter, skill chips float up like fireflies | Skills |
| Mailbox | Flag down | Flag pops up, a letter opens with contact options and Copy email | Contacts |
| Bookshelf | Still | Books slide out with degree titles on their spines | Education |
| Globe | Slow spin | Spins to two pins, shows Russian native and English C1 | Languages |

### Workshop · JSC NPP Salyut

| Object | Idle | On click | Reveals |
|---|---|---|---|
| Little workers | Hammer and carry | Gather and wave, a sign shows "5 developers, 15 workers" | Led 5+ government-funded projects |
| Oscilloscope | Flat line | A clean sine wave draws across the screen | 30+ projects: frequency synthesizers, power supplies, stabilisers |
| Circuit board | Faint traces | Over 100 tiny parts light up in a wave | Assemblies of 100+ precision elements |
| Scroll on lectern | Rolled | Unrolls, showing Python code, a stamp says "faster, fewer errors" | Python macros for documents |
| Gear wall (ambient) | Turns slowly | Spins faster with a satisfying clunk | Island ambience, no achievement |

### Green Grove · Eco Activists

| Object | Idle | On click | Reveals |
|---|---|---|---|
| Recycling bins | Litter lying nearby | Litter flies into the right bins, a sign with trash-free.ru appears | Led the team that built the public site |
| Saplings | Sway | Grow into small trees one by one | Built React frontend and DRF APIs, mentored juniors |

### Radio Tower · Radio Gigabit

| Object | Idle | On click | Reveals |
|---|---|---|---|
| Helper robot | Hovers, blinks | Prints a scroll of generated test code from a prompt bubble | LLM test generator |
| Bunker lab door | Closed, light above | Opens, showing two rooms: Framework and Board database | Architected the test platform, 2 products |
| Big wall screen | Shows the UI | Switches between light and dark theme, and the island lighting follows briefly | Rebuilt the framework UI with themes |
| Satellite dish and terminal | Dish scans | Dish turns, five service icons light up with signal arcs, the terminal types | Connected 5 services and a live terminal |
| Shipping containers | Stacked | Doors open, showing FastAPI, PostgreSQL and test badges, a green check stamps | FastAPI, PostgreSQL, Docker, tests |

### Arena · Olimpbet KZ

| Object | Idle | On click | Reveals |
|---|---|---|---|
| Three screens | Dim | Light up one by one: mobile, desktop, auth gate. Six flags rise. | 3 applications in a team of 6 |
| Parcel box | Bulky | Squishes to 60 percent size, a "-40%" sticker slaps on | Auth service rebuilt in Preact, bundle cut 40% |
| Scoreboard | Static rows | Thousands of rows scroll smoothly at speed | Virtual scrolling on data-heavy pages |
| Two towers | Windows lit | A glowing ball passes between the windows and back | Iframe communication between services |

### Market Town · Monetech

| Object | Idle | On click | Reveals |
|---|---|---|---|
| Domed bank and coin fountain | Water flows | Coins burst from the fountain, four lanterns light: payments, split payments, agreements, cookie consent | Owned the live PDL app, 4 production flows |
| Old shack and glass building | Shack stands | Shack poofs into a cloud, the modern building rises in its place | Migrated the landing from WordPress to Next.js |
| Tram with 7 carriages | Waits at a stop | Rings its bell and does a loop, each carriage labelled with a flow | BNPL app and 7 user flows |
| Signpost with 6 arms | Sways | Arms spin, labels flip from English to Spanish | 6 account areas and Spanish localisation |
| Hot-air balloon | Tethered | Launches and floats up, a "released" banner unrolls | Feature-Sliced Design standard and CI/CD releases |
| Building crane | Still | Stacks blocks labelled tokens, icons, components onto a "core" block | Shared packages frontend-ui and frontend-core |

### Lighthouse · Kafka UI

| Object | Idle | On click | Reveals |
|---|---|---|---|
| Lighthouse lamp | Beam rotates | Beam sweeps to the camera, a tooltip offers to open the pull request on GitHub | Authorization page for Kafka UI |

Links to external sites open in a new tab and only after a second, explicit click on the tooltip button.

---

## Acceptance criteria

- [ ] Every achievement has an object, and every object has idle, hover and click behaviour.
- [ ] Clicking an object highlights the achievement, and hovering an achievement makes the object glow.
- [ ] Objects do nothing in the overview except focusing their island.
- [ ] "Show me" buttons give keyboard users the same animations.
- [ ] The counter and the final reward work and survive a reload.
- [ ] FPS stays within budget on the busiest island.

## Pitfalls

- **Too many tooltips.** `Html` is a DOM node per instance. Render one shared tooltip.
- **Animations fight each other.** Clicking twice quickly should restart or ignore, not stack. Keep one timer per object.
- **Panel and object disagree.** Use `objectId` from data as the only link, never hard-coded strings in components.
- **Outlines everywhere.** Only interactive objects get the gold outline on hover, so they stay recognisable.
