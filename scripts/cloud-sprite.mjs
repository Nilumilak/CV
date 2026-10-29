// Turns a painted cloud with a cut-out background (from Meshy's text-to-image) into a
// sprite texture: trimmed to the cloud, with a soft edge instead of a sticker-like cutout,
// and optionally with greyish shadows pulled towards the sky's blue-grey.
import sharp from 'sharp';

/** The shared cloud shadow colour (colors.cloudShadow in src/materials/toon.ts). */
const SHADOW = [0xaf, 0xc3, 0xe6];

/**
 * @param {string} input  PNG with transparency
 * @param {string} output WebP path
 * @param {{ size: number, coolShadows?: number }} options
 *   size: longest side in pixels; coolShadows: 0..1, how far dark parts move to blue-grey
 */
export async function cloudSprite(input, output, { size, coolShadows = 0 }) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .trim({ threshold: 1 })
    .resize(size, size, { fit: 'inside' })
    // Room for the softened edge.
    .extend({ top: 8, bottom: 8, left: 8, right: 8, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const pixels = width * height;

  // Soft edge: blur the alpha, then pull it in, so the outermost ring of the cutout (where
  // a dark fringe of the old background lingers) fades out instead of drawing a rim.
  const alpha = Buffer.alloc(pixels);
  for (let i = 0; i < pixels; i++) alpha[i] = data[i * 4 + 3];
  const radius = Math.max(1, size / 340);
  const blurred = await sharp(alpha, { raw: { width, height, channels: 1 } })
    .blur(radius)
    // One channel out, as in: sharp would otherwise hand back three.
    .extractChannel(0)
    .raw()
    .toBuffer();

  for (let i = 0; i < pixels; i++) {
    const a = Math.min(1, Math.max(0, (blurred[i] / 255 - 0.3) / 0.7));
    data[i * 4 + 3] = Math.round(a * a * (3 - 2 * a) * 255);
    if (coolShadows > 0) {
      const o = i * 4;
      const lum = (0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2]) / 255;
      // Only the shaded parts move; the sunlit tops keep their warm cream.
      const shade = Math.min(1, Math.max(0, (0.86 - lum) / 0.3)) * coolShadows;
      for (let c = 0; c < 3; c++) {
        // Keep the painted brightness: tint by the shadow colour's hue, not its value.
        const tinted = data[o + c] * (SHADOW[c] / 200);
        data[o + c] = Math.round(Math.min(255, data[o + c] + (tinted - data[o + c]) * shade));
      }
    }
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .webp({ quality: 88, alphaQuality: 90 })
    .toFile(output);
}
