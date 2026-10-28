import type { CSSProperties } from 'react';
import { chapterOf, yearsOf } from '@/data/navigation';
import type { IslandLayout } from '@/data/types';
import { ISLANDS } from '@/data/world';
import { useWorld } from '@/store/useWorld';
import { IslandIcon } from '@/ui/IslandIcon';
import { registerLabel } from './labelAnchors';
import styles from './IslandLabel.module.css';

/**
 * Floating tag above an island. It is a real <button>, so labels are reachable
 * with Tab and announced by screen readers even though the islands are in WebGL.
 * LabelProjector positions it every frame.
 */
function IslandLabel({ layout }: { layout: IslandLayout }) {
  const focus = useWorld((s) => s.focus);
  const anyFocused = useWorld((s) => s.focused !== null);
  const visited = useWorld((s) => s.visited.includes(layout.id));

  const chapter = chapterOf(layout.id);
  const name = chapter ? (chapter.shortName ?? chapter.company) : 'Home';
  const years = chapter ? yearsOf(chapter) : 'About me';
  const ongoing = chapter?.end === null;

  return (
    <button
      ref={(el) => {
        registerLabel(layout.id, el);
        return () => registerLabel(layout.id, null);
      }}
      type="button"
      className={`${styles.tag} ${anyFocused ? styles.hidden : styles.shown}`}
      style={{ '--accent': layout.accent } as CSSProperties}
      onClick={() => focus(layout.id)}
      tabIndex={anyFocused ? -1 : 0}
      aria-hidden={anyFocused}
      aria-label={`${name}, ${years}${ongoing ? ', ongoing' : ''}${visited ? ', visited' : ''}`}
    >
      <span className={styles.icon}>
        <IslandIcon id={layout.id} />
      </span>
      <span className={styles.bar}>
        <span className={styles.name}>{name}</span>
        <span className={styles.years}>{years}</span>
        {ongoing && <span className={styles.now}>Now</span>}
        {visited && (
          <span className={styles.flag} aria-hidden="true">
            ⚑
          </span>
        )}
      </span>
    </button>
  );
}

/** All labels, in a layer over the canvas. Tab order follows world.ts order. */
export function IslandLabels() {
  return (
    <div className={styles.layer}>
      {ISLANDS.map((layout) => (
        <IslandLabel key={layout.id} layout={layout} />
      ))}
    </div>
  );
}
