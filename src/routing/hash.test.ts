import { describe, expect, it } from 'vitest';
import { parseHash, sameHash, toHash } from './hash';

describe('hash routes', () => {
  it('parses the overview', () => {
    for (const h of ['', '#', '#/', '#/unknown']) {
      expect(parseHash(h)).toEqual({ view: 'world', island: null });
    }
  });

  it('parses islands, case-insensitive, with a trailing slash', () => {
    expect(parseHash('#/radio')).toEqual({ view: 'world', island: 'radio' });
    expect(parseHash('#/Market/')).toEqual({ view: 'world', island: 'market' });
  });

  it('parses the classic CV', () => {
    expect(parseHash('#/cv')).toEqual({ view: 'cv' });
  });

  it('round-trips', () => {
    expect(toHash(parseHash('#/arena'))).toBe('#/arena');
    expect(toHash({ view: 'world', island: null })).toBe('#/');
  });

  it('treats empty and root hashes as equal', () => {
    expect(sameHash('', '#/')).toBe(true);
    expect(sameHash('#/radio', '#/home')).toBe(false);
  });
});
