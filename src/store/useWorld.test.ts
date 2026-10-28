import { beforeEach, describe, expect, it } from 'vitest';
import { useWorld } from './useWorld';

const reset = () =>
  useWorld.setState({
    focused: null,
    activeObject: null,
    hintObject: null,
    visited: [],
    found: [],
  });

describe('world store', () => {
  beforeEach(reset);

  it('focuses an island and remembers it as visited', () => {
    useWorld.getState().focus('radio');
    expect(useWorld.getState().focused).toBe('radio');
    expect(useWorld.getState().visited).toEqual(['radio']);
  });

  it('does not duplicate visited islands', () => {
    const { focus, back } = useWorld.getState();
    focus('radio');
    back();
    focus('radio');
    expect(useWorld.getState().visited).toEqual(['radio']);
  });

  it('goes back to the overview and clears object state', () => {
    const s = useWorld.getState();
    s.focus('arena');
    s.activateObject('olimp-box');
    s.back();
    expect(useWorld.getState()).toMatchObject({ focused: null, activeObject: null });
    expect(useWorld.getState().found).toEqual(['olimp-box']);
  });

  it('counts every activation, even of the same object', () => {
    const s = useWorld.getState();
    const before = s.activeCount;
    s.activateObject('home-cat');
    s.activateObject('home-cat');
    expect(useWorld.getState().activeCount).toBe(before + 2);
    expect(useWorld.getState().found).toEqual(['home-cat']);
  });

  it('enter starts the fly-in with the chosen sound setting', () => {
    useWorld.getState().enter(true);
    expect(useWorld.getState()).toMatchObject({ phase: 'flyIn', sound: true });
  });
});
