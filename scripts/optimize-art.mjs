// Turns raw AI-generated art (art-source/, not in git) into small web assets (src/assets/, in git).
//   Models:   meshopt-compressed geometry, WebP textures at most 1024 px.
//   Textures: resized WebP.
// Usage: npm run art
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname } from 'node:path';
import sharp from 'sharp';

/** Only approved art is listed here. Source paths are relative to art-source/. */
const MODELS = [
  { from: 'home/cat.glb', to: 'models/home/cat.glb' },
  { from: 'home/cottage.glb', to: 'models/home/cottage.glb' },
];

const TEXTURES = [
  { from: 'home/concepts/desk-window-v1.png', to: 'textures/home/desk-window.webp', size: 512 },
];

const src = (p) => `art-source/${p}`;
const out = (p) => `src/assets/${p}`;
const kb = (p) => `${Math.round(statSync(p).size / 1024)} KB`;

// Run the CLI's own entry with Node: no shell, so paths work the same on Windows and Linux.
const cli = 'node_modules/@gltf-transform/cli/bin/cli.js';

for (const m of MODELS) {
  if (!existsSync(src(m.from))) {
    console.warn(`skip ${m.from}: not found`);
    continue;
  }
  mkdirSync(dirname(out(m.to)), { recursive: true });
  execFileSync(
    process.execPath,
    [
      cli,
      'optimize',
      src(m.from),
      out(m.to),
      '--compress',
      'meshopt',
      '--texture-compress',
      'webp',
      '--texture-size',
      '1024',
      '--simplify',
      'false',
    ],
    { stdio: 'inherit' },
  );
  console.log(`${m.from} (${kb(src(m.from))}) -> ${m.to} (${kb(out(m.to))})`);
}

for (const t of TEXTURES) {
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
