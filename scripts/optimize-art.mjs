// Turns raw AI-generated art (art-source/, not in git) into small web assets (src/assets/, in git).
//   Models:   meshopt-compressed geometry, WebP textures (1024 px, or 512 for small props).
//   Textures: resized WebP.
// Flat models (paper-thin image-to-3D results) are refused; see model-shape.mjs.
// Models with a `grade` get their texture colour-corrected first, and island bases with
// `grassTop` get bare grey patches on their top repainted as grass; see art-grade.mjs.
// Usage:
//   npm run art                        all models and textures
//   npm run art -- arena/twin-towers   only entries whose source path contains a filter
//   npm run art -- arena radio/dish    several filters: anything matching any of them
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname } from 'node:path';
import sharp from 'sharp';
import { GRADES, gradeModel, grassTopModel, removeFacesModel } from './art-grade.mjs';
import { checkModelShape } from './model-shape.mjs';

/** Only approved art is listed here. Source paths are relative to art-source/. */
const MODELS = [
  // Home island
  { from: 'home/island-base.glb', to: 'models/home/island-base.glb', texture: 1024 },
  { from: 'home/cottage.glb', to: 'models/home/cottage.glb', texture: 1024 },
  { from: 'home/big-tree.glb', to: 'models/home/big-tree.glb', texture: 1024, grade: 'foliage' },
  { from: 'home/cat.glb', to: 'models/home/cat.glb', texture: 1024 },
  { from: 'home/lantern.glb', to: 'models/home/lantern.glb', texture: 512 },
  { from: 'home/mailbox.glb', to: 'models/home/mailbox.glb', texture: 512 },
  { from: 'home/bookshelf.glb', to: 'models/home/bookshelf.glb', texture: 1024 },
  { from: 'home/globe.glb', to: 'models/home/globe.glb', texture: 512 },
  { from: 'home/bench.glb', to: 'models/home/bench.glb', texture: 512 },
  { from: 'home/stump.glb', to: 'models/home/stump.glb', texture: 512 },
  { from: 'home/stepping-stone.glb', to: 'models/home/stepping-stone.glb', texture: 512 },
  // flower-bush: postponed, every try so far came out flat (docs/plan/islands/home.md).

  // Radio Tower island
  // grassTop: the generated top had bare grey strips along its rim.
  {
    from: 'radio/island-base.glb',
    to: 'models/radio/island-base.glb',
    texture: 1024,
    grassTop: true,
  },
  { from: 'radio/tower.glb', to: 'models/radio/tower.glb', texture: 1024 },
  { from: 'radio/bunker.glb', to: 'models/radio/bunker.glb', texture: 1024 },
  { from: 'radio/dish.glb', to: 'models/radio/dish.glb', texture: 512 },
  { from: 'radio/screen.glb', to: 'models/radio/screen.glb', texture: 512 },
  { from: 'radio/robot.glb', to: 'models/radio/robot.glb', texture: 512 },
  { from: 'radio/containers.glb', to: 'models/radio/containers.glb', texture: 512 },

  // Market Town island
  { from: 'market/island-base.glb', to: 'models/market/island-base.glb', texture: 1024 },
  { from: 'market/bank.glb', to: 'models/market/bank.glb', texture: 1024 },
  { from: 'market/houses.glb', to: 'models/market/houses.glb', texture: 1024 },
  { from: 'market/fountain.glb', to: 'models/market/fountain.glb', texture: 512 },
  { from: 'market/shack-glass.glb', to: 'models/market/shack-glass.glb', texture: 512 },
  { from: 'market/tram.glb', to: 'models/market/tram.glb', texture: 512 },
  { from: 'market/signpost.glb', to: 'models/market/signpost.glb', texture: 512 },
  { from: 'market/balloon.glb', to: 'models/market/balloon.glb', texture: 512 },
  { from: 'market/crane.glb', to: 'models/market/crane.glb', texture: 512 },

  // Arena island
  { from: 'arena/island-base.glb', to: 'models/arena/island-base.glb', texture: 1024 },
  { from: 'arena/stadium.glb', to: 'models/arena/stadium.glb', texture: 1024 },
  { from: 'arena/scoreboard.glb', to: 'models/arena/scoreboard.glb', texture: 512 },
  {
    from: 'arena/display-stands.glb',
    to: 'models/arena/display-stands.glb',
    texture: 512,
    // A white web stretched between the monitor and the gate: a few huge faces.
    removeFaces: [{ min: [0.194, 0.167, -0.167], max: [0.361, 0.444, -0.028], minArea: 100 }],
  },
  { from: 'arena/parcel.glb', to: 'models/arena/parcel.glb', texture: 512 },
  {
    from: 'arena/twin-towers.glb',
    to: 'models/arena/twin-towers.glb',
    texture: 1024,
    // A broken white connector halfway up, in the gap between the towers.
    removeFaces: [{ min: [-0.034, 0.343, 0.04], max: [0.034, 0.629, 0.1] }],
  },

  // Green Grove island
  { from: 'grove/island-base.glb', to: 'models/grove/island-base.glb', texture: 1024 },
  // Landmark: Home's big tree re-toned (the willow came out flat twice; no new credits).
  { from: 'home/big-tree.glb', to: 'models/grove/big-tree.glb', texture: 1024, grade: 'grove' },
  { from: 'grove/shrine.glb', to: 'models/grove/shrine.glb', texture: 512 },
  { from: 'grove/recycling-bins.glb', to: 'models/grove/recycling-bins.glb', texture: 512 },
  { from: 'grove/sapling.glb', to: 'models/grove/sapling.glb', texture: 512 },
  { from: 'grove/noticeboard.glb', to: 'models/grove/noticeboard.glb', texture: 512 },
  { from: 'grove/collection-box.glb', to: 'models/grove/collection-box.glb', texture: 512 },

  // Workshop island
  { from: 'workshop/island-base.glb', to: 'models/workshop/island-base.glb', texture: 1024 },
  { from: 'workshop/factory.glb', to: 'models/workshop/factory.glb', texture: 1024 },
  { from: 'workshop/gear.glb', to: 'models/workshop/gear.glb', texture: 512 },
  { from: 'workshop/whistle.glb', to: 'models/workshop/whistle.glb', texture: 512 },
  { from: 'workshop/workbench.glb', to: 'models/workshop/workbench.glb', texture: 512 },
  { from: 'workshop/circuit-board.glb', to: 'models/workshop/circuit-board.glb', texture: 512 },
  { from: 'workshop/lectern.glb', to: 'models/workshop/lectern.glb', texture: 512 },

  // Lighthouse island
  { from: 'lighthouse/island-base.glb', to: 'models/lighthouse/island-base.glb', texture: 1024 },
  { from: 'lighthouse/lighthouse.glb', to: 'models/lighthouse/lighthouse.glb', texture: 1024 },
  { from: 'lighthouse/sky-boat.glb', to: 'models/lighthouse/sky-boat.glb', texture: 512 },

  // Cable route between the career islands
  { from: 'route/anchor-post.glb', to: 'models/route/anchor-post.glb', texture: 512 },
  { from: 'route/gondola.glb', to: 'models/route/gondola.glb', texture: 512 },

  // Shared kit, reused across islands
  { from: 'shared/rock-cluster.glb', to: 'models/shared/rock-cluster.glb', texture: 512 },
];

const TEXTURES = [
  // desk-window: removed 2026-10-28, the plain glowing window reads better (home.md).
];

const src = (p) => `art-source/${p}`;
const out = (p) => `src/assets/${p}`;
const kb = (p) => `${Math.round(statSync(p).size / 1024)} KB`;

// Run the CLI's own entry with Node: no shell, so paths work the same on Windows and Linux.
const cli = 'node_modules/@gltf-transform/cli/bin/cli.js';

// Optional filters from the command line; with none, everything is processed.
const filters = process.argv.slice(2);
const wanted = (entry) => !filters.length || filters.some((f) => entry.from.includes(f));
const models = MODELS.filter(wanted);
const textures = TEXTURES.filter(wanted);
if (filters.length && !models.length && !textures.length) {
  console.error(
    `Nothing matches ${filters.join(', ')}. Source paths look like "arena/twin-towers.glb".`,
  );
  process.exit(1);
}

for (const m of models) {
  if (!existsSync(src(m.from))) {
    console.warn(`skip ${m.from}: not found`);
    continue;
  }
  const flat = await checkModelShape(src(m.from));
  if (flat) {
    console.error(`refused: ${flat}`);
    process.exitCode = 1;
    continue;
  }
  // Fixed copies go next to the raw art (also ignored by git), never over it. Each step
  // reads the previous step's output.
  let input = src(m.from);
  if (m.removeFaces || m.grassTop || m.grade) {
    // Keyed by output, so two re-toned copies of one source never overwrite each other.
    const fixed = src(`.graded/${m.to}`);
    mkdirSync(dirname(fixed), { recursive: true });
    if (m.removeFaces) {
      const removed = await removeFacesModel(input, fixed, m.removeFaces);
      console.log(`${m.from}: removed ${removed} stray faces`);
      input = fixed;
    }
    if (m.grassTop) {
      await grassTopModel(input, fixed);
      input = fixed;
    }
    if (m.grade) {
      await gradeModel(input, fixed, GRADES[m.grade]);
      input = fixed;
    }
  }
  mkdirSync(dirname(out(m.to)), { recursive: true });
  execFileSync(
    process.execPath,
    [
      cli,
      'optimize',
      input,
      out(m.to),
      '--compress',
      'meshopt',
      '--texture-compress',
      'webp',
      '--texture-size',
      String(m.texture),
      '--simplify',
      'false',
    ],
    { stdio: 'inherit' },
  );
  console.log(`${m.from} (${kb(src(m.from))}) -> ${m.to} (${kb(out(m.to))})`);
}

for (const t of textures) {
  if (!existsSync(src(t.from))) {
    console.warn(`skip ${t.from}: not found`);
    continue;
  }
  mkdirSync(dirname(out(t.to)), { recursive: true });
  await sharp(src(t.from))
    .resize(t.size, t.size, { fit: 'inside' })
    .webp({ quality: 85 })
    .toFile(out(t.to));
  console.log(`${t.from} (${kb(src(t.from))}) -> ${t.to} (${kb(out(t.to))})`);
}
