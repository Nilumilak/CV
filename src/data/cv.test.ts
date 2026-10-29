import { describe, expect, it } from 'vitest';
import { chapters, profile } from './cv';
import { ISLAND_OBJECTS } from './islandObjects';
import { ISLAND_IDS } from './types';
import { ISLANDS, layoutOf } from './world';

describe('cv data', () => {
  it('has unique achievement ids', () => {
    const ids = chapters.flatMap((c) => c.achievements.map((a) => a.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('links every island object to a real achievement', () => {
    const ids = new Set(chapters.flatMap((c) => c.achievements.map((a) => a.id)));
    for (const o of ISLAND_OBJECTS) expect(ids.has(o.id), o.id).toBe(true);
  });

  it('has unique chapter ids', () => {
    const ids = chapters.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every chapter at least one achievement', () => {
    for (const c of chapters) expect(c.achievements.length, c.company).toBeGreaterThan(0);
  });

  it('keeps achievement titles short', () => {
    for (const a of chapters.flatMap((c) => c.achievements)) {
      expect(a.title.split(/\s+/).length, a.title).toBeLessThanOrEqual(6);
    }
  });

  it('orders chapters by start date', () => {
    const starts = chapters.map((c) => c.start);
    expect(starts).toEqual([...starts].sort());
  });

  it('uses YYYY-MM dates with end after start', () => {
    for (const c of chapters) {
      expect(c.start).toMatch(/^\d{4}-\d{2}$/);
      if (c.end) {
        expect(c.end).toMatch(/^\d{4}-\d{2}$/);
        expect(c.end >= c.start, c.company).toBe(true);
      }
    }
  });

  it('has contacts', () => {
    expect(profile.contacts.email).toContain('@');
  });
});

describe('world layout', () => {
  it('has exactly one layout per island id', () => {
    expect(ISLANDS.map((i) => i.id).sort()).toEqual([...ISLAND_IDS].sort());
  });

  it('gives every chapter a layout', () => {
    for (const c of chapters) expect(() => layoutOf(c.id)).not.toThrow();
  });

  it('keeps every focus camera and its view line clear of the other islands', () => {
    // An island's top is about 5.6 units from its centre at scale 1, plus room for tall
    // art and the bob. Checked along the line from the camera to its target, at heights
    // where another island's art could be.
    const clearance = (scale: number) => 5.6 * scale + 1.5;
    for (const island of ISLANDS) {
      const { position: cam, target } = island.camera;
      for (const other of ISLANDS) {
        if (other.id === island.id) continue;
        for (let i = 0; i <= 40; i++) {
          const k = i / 40;
          const q = cam.map((c, j) => c + (target[j] - c) * k);
          const dy = q[1] - other.position[1];
          if (dy < -2 || dy > 9) continue;
          const d = Math.hypot(q[0] - other.position[0], q[2] - other.position[2]);
          expect(d, `${island.id} camera vs ${other.id}`).toBeGreaterThanOrEqual(
            clearance(other.scale),
          );
        }
      }
    }
  });
});
