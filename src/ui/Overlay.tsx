import { useEffect, useRef } from 'react';
import { sound } from '@/audio/sound';
import { AnimatePresence } from 'motion/react';
import { chapterOf, neighbours } from '@/data/navigation';
import type { IslandId } from '@/data/types';
import { IslandLabels } from '@/islands/IslandLabel';
import { labelElements } from '@/islands/labelAnchors';
import { ObjectTooltip } from '@/objects/ObjectTooltip';
import { useHashSync } from '@/routing/useHashSync';
import { useWorld } from '@/store/useWorld';
import { IslandPanel } from './IslandPanel';
import { TopBar } from './TopBar';
import { CloudVeil, SkipIntro, Welcome } from './Welcome';

/** Everything drawn over the canvas: labels, top bar, panel, keyboard handling. */
export function Overlay() {
  const focused = useWorld((s) => s.focused);
  const phase = useWorld((s) => s.phase);
  const inWorld = phase === 'world';
  useKeyboardNavigation();
  useHashSync();
  useReturnFocusToLabel(focused);
  useSoundSync();
  useInterfaceSounds(focused);

  const announcement = focused
    ? `Now viewing ${chapterOf(focused)?.company ?? 'Home'}`
    : 'Overview of all islands';

  return (
    <>
      <CloudVeil />
      <AnimatePresence>
        {(phase === 'loading' || phase === 'welcome') && <Welcome key="welcome" />}
      </AnimatePresence>
      {phase === 'flyIn' && <SkipIntro />}
      {inWorld && (
        <>
          <IslandLabels />
          <ObjectTooltip />
          <TopBar />
        </>
      )}
      <AnimatePresence>
        {inWorld && focused && <IslandPanel key="panel" id={focused} />}
      </AnimatePresence>
      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>
    </>
  );
}

/** Esc goes back to the overview; Left and Right arrows move along the timeline. */
function useKeyboardNavigation() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;

      const { focused, focus, back } = useWorld.getState();
      if (!focused) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        back();
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const n = neighbours(focused);
        const to = e.key === 'ArrowLeft' ? n.prev : n.next;
        if (to) {
          e.preventDefault();
          focus(to);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

/** How long to keep trying to focus a label while the camera flies back to the overview. */
const FOCUS_RETURN_MS = 4000;

/**
 * After closing a panel, put keyboard focus back on that island's label.
 * The label is visibility:hidden while the camera is still flying and the island is
 * off screen, and a hidden element refuses focus, so keep trying until it is on screen.
 */
function useReturnFocusToLabel(focused: IslandId | null) {
  const previous = useRef<IslandId | null>(null);
  useEffect(() => {
    const last = previous.current;
    previous.current = focused;
    if (focused || !last) return;

    const started = performance.now();
    let raf = 0;
    const tryFocus = () => {
      const el = labelElements.get(last);
      if (el && el.style.visibility !== 'hidden') {
        el.focus({ preventScroll: true });
        if (document.activeElement === el) return;
      }
      if (performance.now() - started < FOCUS_RETURN_MS) raf = requestAnimationFrame(tryFocus);
    };
    raf = requestAnimationFrame(tryFocus);
    return () => cancelAnimationFrame(raf);
  }, [focused]);
}

/**
 * A page turns whenever an island's panel opens or moves to another island, and every
 * interface button or link taps softly. One listener covers all of them.
 */
function useInterfaceSounds(focused: IslandId | null) {
  useEffect(() => {
    if (focused) sound.rustle();
  }, [focused]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement | null)?.closest('button, a')) sound.tap();
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);
}

/** Turns the ambience on and off with the store's sound flag. */
function useSoundSync() {
  const on = useWorld((s) => s.sound);
  useEffect(() => {
    sound.setEnabled(on);
  }, [on]);
}
