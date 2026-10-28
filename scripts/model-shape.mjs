// Shape check for AI-generated models.
// Image-to-3D can turn a flat-looking concept (a front-on illustration with little shading)
// into a paper-thin relief: a "tree" 2 m wide and 3 cm deep. It looks fine from the front and
// breaks from every other angle. This catches it from the numbers alone.
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

/** Size of a .glb along x, y, z, and its thickness: thinnest side ÷ widest side. */
export async function measureModel(path) {
  const document = await (await reader()).read(path);
  const root = document.getRoot();
  const scene = root.getDefaultScene() ?? root.listScenes()[0];
  const { min, max } = getBounds(scene);
  const size = max.map((v, i) => v - min[i]);
  return { size, thickness: Math.min(...size) / Math.max(...size) };
}

/** A readable error message if the model is too thin, otherwise null. */
export async function checkModelShape(path) {
  const { size, thickness } = await measureModel(path);
  if (thickness >= MIN_THICKNESS) return null;
  const axis = 'xyz'[size.indexOf(Math.min(...size))];
  return (
    `${path} is flat: ${axis} is only ${Math.round(thickness * 100)}% of its widest side ` +
    `(${size.map((s) => s.toFixed(2)).join(' × ')}). Regenerate it from a three-quarter-view ` +
    `concept with visible volume (docs/plan/phase-4-ai-prompts.md, "Volume rule").`
  );
}
