/**
 * Soft cloud puff drawn on a canvas, returned as a data URL for drei <Clouds texture>.
 * Generated locally so the site does not depend on drei's default texture CDN.
 */
export function createCloudTextureUrl(size = 256, seed = 7): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Small deterministic random, so the puff looks the same on every load.
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };

  const c = size / 2;
  // Several overlapping soft blobs make a lumpy, fluffy outline instead of a perfect circle.
  const blobs = [{ x: c, y: c, r: size * 0.36, a: 1 }];
  for (let i = 0; i < 9; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = size * (0.08 + rand() * 0.14);
    blobs.push({
      x: c + Math.cos(angle) * dist,
      y: c + Math.sin(angle) * dist,
      r: size * (0.16 + rand() * 0.14),
      a: 0.8 + rand() * 0.2,
    });
  }

  for (const b of blobs) {
    const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    // Solid body with a short soft rim: painted clouds have fairly crisp edges.
    g.addColorStop(0, `rgba(255,255,255,${b.a})`);
    g.addColorStop(0.7, `rgba(255,255,255,${b.a * 0.92})`);
    g.addColorStop(0.88, `rgba(255,255,255,${b.a * 0.45})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toDataURL('image/png');
}
