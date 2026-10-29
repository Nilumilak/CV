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
  /**
   * Home's tree re-toned for the Green Grove: a deeper, cooler forest green that matches
   * the Grove's dark mossy rock, so the shared model doesn't read as a copy.
   */
  grove: {
    from: 45,
    to: 140,
    feather: 20,
    hueShift: 34,
    shadowHueShift: 16,
    saturation: 1.0,
    lift: 0.02,
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

/**
 * Removes stray faces: image-to-3D sometimes stretches a "web" of surface across the gap
 * between two separate parts (behind Arena's gate) or adds a piece that shouldn't be
 * there (a connector between the twin towers).
 *
 * Each region is a box in model-relative units: the model's height is 1, y runs from its
 * bottom (0) to its top (1), and x/z are measured from the centre of its bounds. A face
 * is removed when its centre is inside the box and, if `minArea` is given, it is at least
 * that many times the model's median face area (webs are a few huge faces; real parts in
 * the same box are many normal-sized ones).
 */
export async function removeFacesModel(input, output, regions) {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const document = await io.read(input);
  let removed = 0;
  for (const mesh of document.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute('POSITION');
      const idx = prim.getIndices();
      const min = pos.getMin([]);
      const max = pos.getMax([]);
      const h = max[1] - min[1];
      const cx = (min[0] + max[0]) / 2;
      const cz = (min[2] + max[2]) / 2;
      const rel = (v) => [(v[0] - cx) / h, (v[1] - min[1]) / h, (v[2] - cz) / h];

      const faces = [];
      const a = [],
        b = [],
        c = [];
      for (let i = 0; i < idx.getCount(); i += 3) {
        const ids = [idx.getScalar(i), idx.getScalar(i + 1), idx.getScalar(i + 2)];
        pos.getElement(ids[0], a);
        pos.getElement(ids[1], b);
        pos.getElement(ids[2], c);
        const [ra, rb, rc] = [a, b, c].map(rel);
        const centre = [0, 1, 2].map((j) => (ra[j] + rb[j] + rc[j]) / 3);
        const u = [rb[0] - ra[0], rb[1] - ra[1], rb[2] - ra[2]];
        const v = [rc[0] - ra[0], rc[1] - ra[1], rc[2] - ra[2]];
        const area =
          Math.hypot(
            u[1] * v[2] - u[2] * v[1],
            u[2] * v[0] - u[0] * v[2],
            u[0] * v[1] - u[1] * v[0],
          ) / 2;
        faces.push({ ids, centre, area });
      }
      const medianArea = faces.map((f) => f.area).sort((x, y) => x - y)[
        Math.floor(faces.length / 2)
      ];
      const inside = (p, box) => p.every((x, j) => x >= box.min[j] && x <= box.max[j]);
      const keep = faces.filter(
        (f) =>
          !regions.some(
            (r) =>
              inside(f.centre, r) && (r.minArea === undefined || f.area >= r.minArea * medianArea),
          ),
      );
      removed += faces.length - keep.length;
      idx.setArray(new Uint32Array(keep.flatMap((f) => f.ids)));
    }
  }
  await io.write(output, document);
  return removed;
}

/**
 * Island bases: repaints bare grey patches on the grass top in the island's own grass
 * colour. Only texture areas used by upward-facing triangles near the top are touched,
 * so the grey cliffs underneath stay rock. Each pixel keeps its own lightness variation,
 * so the brush strokes survive.
 */
export async function grassTopModel(input, output) {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const document = await io.read(input);
  for (const mesh of document.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const texture = prim.getMaterial()?.getBaseColorTexture();
      if (!texture) continue;
      const image = await sharp(texture.getImage())
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const topPixels = upwardPixels(prim, image.info.width, image.info.height);
      repaintGrey(image.data, topPixels);
      texture
        .setImage(await sharp(image.data, { raw: image.info }).png().toBuffer())
        .setMimeType('image/png');
    }
  }
  await io.write(output, document);
}

/** Faces whose normal points up at least this much count as the grass top. */
const UP = 0.55;
/** ...and whose centre is within this share of the model's height from the top. */
const TOP_BAND = 0.2;

/** Indices of texture pixels covered by upward-facing triangles near the top. */
function upwardPixels(prim, width, height) {
  const pos = prim.getAttribute('POSITION');
  const uv = prim.getAttribute('TEXCOORD_0');
  const idx = prim.getIndices();
  const min = pos.getMinNormalized([]);
  const max = pos.getMaxNormalized([]);
  const topLimit = max[1] - (max[1] - min[1]) * TOP_BAND;
  const covered = new Set();
  const a = [],
    b = [],
    c = [],
    ta = [],
    tb = [],
    tc = [];

  for (let i = 0; i < idx.getCount(); i += 3) {
    const [ia, ib, ic] = [idx.getScalar(i), idx.getScalar(i + 1), idx.getScalar(i + 2)];
    pos.getElement(ia, a);
    pos.getElement(ib, b);
    pos.getElement(ic, c);
    if ((a[1] + b[1] + c[1]) / 3 < topLimit) continue;
    // Face normal from the winding: cross(b - a, c - a), normalised; keep its y.
    const ux = b[0] - a[0],
      uy = b[1] - a[1],
      uz = b[2] - a[2];
    const vx = c[0] - a[0],
      vy = c[1] - a[1],
      vz = c[2] - a[2];
    const nx = uy * vz - uz * vy,
      ny = uz * vx - ux * vz,
      nz = ux * vy - uy * vx;
    if (ny / (Math.hypot(nx, ny, nz) || 1) < UP) continue;

    uv.getElement(ia, ta);
    uv.getElement(ib, tb);
    uv.getElement(ic, tc);
    rasterize(ta, tb, tc, width, height, (p) => covered.add(p));
  }
  return covered;
}

/** Calls `put` for every pixel inside a UV triangle (glTF UVs: origin top left). */
function rasterize(ta, tb, tc, width, height, put) {
  const pts = [ta, tb, tc].map(([u, v]) => [u * width, v * height]);
  const xs = pts.map((p) => p[0]),
    ys = pts.map((p) => p[1]);
  const x0 = Math.max(0, Math.floor(Math.min(...xs))),
    x1 = Math.min(width - 1, Math.ceil(Math.max(...xs)));
  const y0 = Math.max(0, Math.floor(Math.min(...ys))),
    y1 = Math.min(height - 1, Math.ceil(Math.max(...ys)));
  const [[ax, ay], [bx, by], [cx, cy]] = pts;
  const area = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
  if (Math.abs(area) < 1e-9) return;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const px = x + 0.5,
        py = y + 0.5;
      const w0 = ((bx - px) * (cy - py) - (cx - px) * (by - py)) / area;
      const w1 = ((cx - px) * (ay - py) - (ax - px) * (cy - py)) / area;
      const w2 = 1 - w0 - w1;
      // A little slack, so pixels on shared edges are included.
      if (w0 >= -0.02 && w1 >= -0.02 && w2 >= -0.02) put(y * width + x);
    }
  }
}

/** Repaints greyish pixels among `pixels` with the average grass colour found among them. */
function repaintGrey(data, pixels) {
  // The island's own grass colour: average of clearly green pixels on the top.
  let gh = 0,
    gs = 0,
    gl = 0,
    n = 0;
  for (const p of pixels) {
    const [h, s, l] = rgbToHsl(data[p * 4], data[p * 4 + 1], data[p * 4 + 2]);
    if (h > 60 && h < 150 && s > 0.25) {
      gh += h;
      gs += s;
      gl += l;
      n++;
    }
  }
  if (!n) return;
  [gh, gs, gl] = [gh / n, gs / n, gl / n];

  for (const p of pixels) {
    const [h, s, l] = rgbToHsl(data[p * 4], data[p * 4 + 1], data[p * 4 + 2]);
    // Grey or sandy-grey: low saturation, or a warm low-saturation stone colour.
    const grey = s < 0.22 || (s < 0.35 && (h < 50 || h > 180));
    if (!grey) continue;
    // Keep the pixel's light/dark variation around the grass average.
    const nl = Math.min(0.85, Math.max(0.12, gl + (l - 0.55) * 0.6));
    const [r, g, b] = hslToRgb(gh, gs, nl);
    data[p * 4] = r;
    data[p * 4 + 1] = g;
    data[p * 4 + 2] = b;
  }
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
