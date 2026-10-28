import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { profile } from '@/data/cv';
import { chapterOf, ISLAND_ORDER, yearsOf } from '@/data/navigation';
import { layoutOf } from '@/data/world';
import { useWorld } from '@/store/useWorld';
import { IslandIcon } from './IslandIcon';
import styles from './TopBar.module.css';

/** Name, the Islands menu (fastest route for recruiters and keyboard users), classic CV and PDF. */
export function TopBar() {
  const back = useWorld((s) => s.back);
  return (
    <nav className={styles.bar} aria-label="Main">
      <button type="button" className={styles.brand} onClick={back} title="Back to the overview">
        <span className={styles.name}>{profile.name}</span>
        <span className={styles.role}>{profile.role}</span>
      </button>
      <div className={styles.actions}>
        <IslandMenu />
        <a className={styles.pill} href="#/cv">
          Classic CV
        </a>
        <a
          className={`${styles.pill} ${styles.primary} ${styles.hideMobile}`}
          href="/cv.pdf"
          download
        >
          Download PDF
        </a>
      </div>
    </nav>
  );
}

function IslandMenu() {
  const [open, setOpen] = useState(false);
  const focused = useWorld((s) => s.focused);
  const focus = useWorld((s) => s.focus);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Close on outside click; Esc closes the menu before it reaches the world's Esc handler.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const onPointer = (e: PointerEvent) => {
      if (!listRef.current?.contains(e.target as Node) && e.target !== buttonRef.current) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={styles.pill}
        aria-expanded={open}
        aria-controls="island-menu"
        onClick={() => setOpen((o) => !o)}
      >
        Islands ▾
      </button>
      {open && (
        <ul id="island-menu" ref={listRef} className={styles.menu} aria-label="Islands">
          {ISLAND_ORDER.map((id) => {
            const chapter = chapterOf(id);
            return (
              <li key={id}>
                <button
                  type="button"
                  className={styles.menuItem}
                  aria-current={focused === id}
                  style={{ '--accent': layoutOf(id).accent } as CSSProperties}
                  onClick={() => {
                    focus(id);
                    setOpen(false);
                  }}
                >
                  <span className={styles.menuIcon}>
                    <IslandIcon id={id} />
                  </span>
                  <span className={styles.menuText}>
                    {chapter ? (chapter.shortName ?? chapter.company) : 'Home'}
                    <small>
                      {chapter
                        ? `${chapter.role} · ${yearsOf(chapter)}`
                        : 'About, skills, contacts'}
                    </small>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
