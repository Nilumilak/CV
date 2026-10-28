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
});
