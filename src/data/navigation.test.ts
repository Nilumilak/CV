import { describe, expect, it } from 'vitest';
import { datesOf, ISLAND_ORDER, neighbours, yearsOf } from './navigation';

describe('navigation', () => {
  it('starts at home and covers every island once', () => {
    expect(ISLAND_ORDER[0]).toBe('home');
    expect(new Set(ISLAND_ORDER).size).toBe(ISLAND_ORDER.length);
  });

  it('finds neighbours with open ends', () => {
    expect(neighbours('home').prev).toBeNull();
    expect(neighbours(ISLAND_ORDER[1]).prev).toBe('home');
    expect(neighbours(ISLAND_ORDER.at(-1)!).next).toBeNull();
  });

  it('formats years and dates', () => {
    expect(yearsOf({ start: '2022-11', end: null })).toBe('2022 – now');
    expect(yearsOf({ start: '2015-06', end: '2020-04' })).toBe('2015 – 2020');
    expect(datesOf({ start: '2022-11', end: null })).toBe('Nov 2022 – Present');
    expect(datesOf({ start: '2024-05', end: '2025-09' })).toBe('May 2024 – Sep 2025');
  });
});
