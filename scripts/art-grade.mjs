// Colour grading for AI-generated textures, applied to raw pixels before compression.
// Generators sometimes drift from the palette (the second big tree came out olive and
// khaki). A grade nudges one hue range toward the palette and leaves the rest alone,
// so a tree's leaves can turn fresh green while its trunk stays brown.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import sharp from 'sharp';

/**
 * Named grades, referenced from the MODELS list in optimize-art.mjs.
 * Hues are in degrees. Pixels inside [from, to] get the full effect; it fades out over
 * `feather` degrees on either side, so leaf-to-bark transitions don't show a seam.
 */
export const GRADES = {
  /** Olive and khaki leaves → the palette's fresh grass and deep leaf greens. */
  foliage: {
    from: 45,
    to: 140,
    feather: 20,
    hueShift: 20, // toward green; shadows shift a little more, toward the deep leaf green
    shadowHueShift: 12,
    saturation: 1.08,
    lift: 0.14, // raises dark values a little, so shadows read as green, not mud
  },
};

/** Writes a copy of a .glb with every texture graded. Meshy models (no PBR) only have colour maps. */
export async function gradeModel(input, output, grade) {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const document = await io.read(input);
  for (const texture of document.getRoot().listTextures()) {
    texture.setImage(await gradeImage(texture.getImage(), grade)).setMimeType('image/png');
  }
  await io.write(output, document);
}

/** Grades an encoded image (PNG, JPEG, WebP) and returns it as PNG. */
export async function gradeImage(input, grade) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    const w = weight(h, grade) * Math.min(1, s * 4); // greys stay grey
    if (w === 0) continue;
    const shift = grade.hueShift + grade.shadowHueShift * (1 - l);
    const nh = h + shift * w;
    const ns = Math.min(1, s * (1 + (grade.saturation - 1) * w));
    const nl = l + (1 - l) * grade.lift * w * (1 - l);
    const [r, g, b] = hslToRgb(nh, ns, nl);
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

function weight(h, { from, to, feather }) {
  if (h >= from && h <= to) return 1;
  const d = h < from ? from - h : h - to;
  return d >= feather ? 0 : 1 - d / feather;
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return [r, g, b].map((v) => Math.round((v + m) * 255));
}
