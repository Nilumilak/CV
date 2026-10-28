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

/** After closing a panel, put keyboard focus back on that island's label. */
function useReturnFocusToLabel(focused: IslandId | null) {
  const previous = useRef<IslandId | null>(null);
  useEffect(() => {
    const last = previous.current;
    previous.current = focused;
    if (focused || !last) return;
    // Wait a frame so the label is tabbable again before focusing it.
    const raf = requestAnimationFrame(() =>
      labelElements.get(last)?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(raf);
  }, [focused]);
}

/** Turns the synthesized ambience on and off with the store's sound flag. */
function useSoundSync() {
  const on = useWorld((s) => s.sound);
  useEffect(() => {
    sound.setEnabled(on);
  }, [on]);
}
