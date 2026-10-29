// Shape check for AI-generated models.
// Image-to-3D can turn a flat-looking concept (a front-on illustration with little shading)
// into a paper-thin relief: a "tree" 2 m wide and 3 cm deep. It looks fine from the front and
// breaks from every other angle. This catches it from the numbers alone.
//
// Two checks:
// - the whole model: its thinnest side against its widest side;
// - each horizontal slice: a model can be solid overall but have one flat part, such as a
//   sapling whose leafy crown is a flat card on a round mound of soil.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';

/**
 * The thinnest side of a model must be at least this share of its widest side.
 * Real props sit far above it (stepping stone ~0.2, everything else 0.3+);
 * the broken tree and bush were ~0.02.
 */
export const MIN_THICKNESS = 0.1;

/** How many horizontal slices the slice check cuts a model into. */
const SLICES = 6;
/** Slices narrower than this share of the model's largest side are posts or trunks; skipped. */
const WIDE_SLICE = 0.3;
/**
 * A wide slice must be at least this deep, as a share of its own width. Real thin parts
 * sit above it (a bench seat, a screen, a crane's arm, a platform: 9 to 12%); flat cards
 * fall below (the first sapling's crown 5%, the first willow 0%).
 */
export const MIN_SLICE_THICKNESS = 0.07;

let io;
async function reader() {
  if (!io) {
    await MeshoptDecoder.ready;
    io = new NodeIO()
      .registerExtensions(ALL_EXTENSIONS)
      .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  }
  return io;
}

/** Every vertex of a document, in scene space. */
function scenePoints(document) {
  const points = [];
  const v = [];
  for (const node of document.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    const m = node.getWorldMatrix();
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute('POSITION');
      for (let i = 0; i < pos.getCount(); i++) {
        pos.getElement(i, v);
        points.push([
          m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12],
          m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13],
          m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14],
        ]);
      }
    }
  }
  return points;
}

/** The thinnest wide horizontal slice: its depth ÷ width, and which slice (0 = bottom). */
function thinnestSlice(points, size, minY) {
  const largest = Math.max(...size);
  let thinnest = 1;
  let at = -1;
  for (let s = 0; s < SLICES; s++) {
    const lo = minY + (size[1] * s) / SLICES;
    const hi = minY + (size[1] * (s + 1)) / SLICES;
    let x0 = Infinity,
      x1 = -Infinity,
      z0 = Infinity,
      z1 = -Infinity,
      n = 0;
    for (const p of points) {
      if (p[1] < lo || p[1] > hi) continue;
      n++;
      x0 = Math.min(x0, p[0]);
      x1 = Math.max(x1, p[0]);
      z0 = Math.min(z0, p[2]);
      z1 = Math.max(z1, p[2]);
    }
    if (n < 30) continue;
    const wide = Math.max(x1 - x0, z1 - z0);
    if (wide < largest * WIDE_SLICE) continue;
    const t = Math.min(x1 - x0, z1 - z0) / wide;
    if (t < thinnest) {
      thinnest = t;
      at = s;
    }
  }
  return { thinnest, at };
}

/**
 * Size of a .glb along x, y, z; its thickness (thinnest side ÷ widest side); and its
 * thinnest wide horizontal slice.
 */
export async function measureModel(path) {
  const document = await (await reader()).read(path);
  const root = document.getRoot();
  const scene = root.getDefaultScene() ?? root.listScenes()[0];
  const { min, max } = getBounds(scene);
  const size = max.map((v, i) => v - min[i]);
  const slice = thinnestSlice(scenePoints(document), size, min[1]);
  return { size, thickness: Math.min(...size) / Math.max(...size), slice };
}

const REGENERATE =
  'Regenerate it from a three-quarter-view concept with visible volume, or with multi-view ' +
  'for round foliage (docs/plan/phase-4-ai-prompts.md, "Volume rule").';

/** A readable error message if the model or one of its parts is too thin, otherwise null. */
export async function checkModelShape(path) {
  const { size, thickness, slice } = await measureModel(path);
  if (thickness < MIN_THICKNESS) {
    const axis = 'xyz'[size.indexOf(Math.min(...size))];
    return (
      `${path} is flat: ${axis} is only ${Math.round(thickness * 100)}% of its widest side ` +
      `(${size.map((s) => s.toFixed(2)).join(' × ')}). ${REGENERATE}`
    );
  }
  if (slice.thinnest < MIN_SLICE_THICKNESS) {
    const where = ['bottom', 'lower', 'lower middle', 'upper middle', 'upper', 'top'][slice.at];
    return (
      `${path} has a flat part: its ${where} slice is only ` +
      `${Math.round(slice.thinnest * 100)}% as deep as it is wide. ${REGENERATE}`
    );
  }
  return null;
}
