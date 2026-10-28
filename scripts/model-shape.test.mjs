// @vitest-environment node
// Every committed model must be solid, not a flat cutout. See model-shape.mjs.
import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { checkModelShape } from './model-shape.mjs';

const MODELS_DIR = 'src/assets/models';
const models = readdirSync(MODELS_DIR, { recursive: true })
  .map(String)
  .filter((f) => f.endsWith('.glb'))
  .map((f) => `${MODELS_DIR}/${f.replaceAll('\\', '/')}`);

describe('generated models', () => {
  it('exist', () => {
    expect(models.length).toBeGreaterThan(0);
  });

  it.each(models)('%s has real depth', async (path) => {
    expect(await checkModelShape(path)).toBeNull();
  });
});
