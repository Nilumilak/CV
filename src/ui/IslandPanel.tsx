import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { profile } from '@/data/cv';
import { objectForSection, type HomeSection } from '@/data/homeObjects';
import { chapterOf, datesOf, neighbours } from '@/data/navigation';
import type { Chapter, IslandId } from '@/data/types';
import { layoutOf } from '@/data/world';
import { useWorld } from '@/store/useWorld';
import { IslandIcon } from './IslandIcon';
import { isMobileWidth } from './layout';
import styles from './IslandPanel.module.css';

const nameOf = (id: IslandId) => {
  const c = chapterOf(id);
  return c ? (c.shortName ?? c.company) : 'Home';
};

/** Journal-style panel for the focused island. Every achievement is listed: nothing is gated. */
export function IslandPanel({ id }: { id: IslandId }) {
  const back = useWorld((s) => s.back);
  const focus = useWorld((s) => s.focus);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [expanded, setExpanded] = useState(false);
  const chapter = chapterOf(id);
  const { prev, next } = neighbours(id);
  const titleId = `panel-title-${id}`;
  const bodyRef = useRef<HTMLDivElement>(null);
  useScrollToActiveObject(bodyRef);

  // Move keyboard and screen reader focus to the title when the panel opens or changes island.
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, [id]);

  const mobile = typeof window !== 'undefined' && isMobileWidth(window.innerWidth);

  return (
    <motion.section
      key={id}
      className={styles.panel}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      data-expanded={expanded}
      style={{ '--accent': layoutOf(id).accent } as CSSProperties}
      initial={mobile ? { y: '100%' } : { x: 40, opacity: 0, rotate: 1.5 }}
      animate={mobile ? { y: 0 } : { x: 0, opacity: 1, rotate: 0 }}
      exit={mobile ? { y: '100%' } : { x: 40, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
    >
      <button
        type="button"
        className={styles.sheetHandle}
        aria-label={expanded ? 'Collapse panel' : 'Expand panel'}
        aria-expanded={expanded}
        onClick={() => setExpanded((e) => !e)}
      >
        <span />
      </button>

      <header className={styles.header}>
        <span className={styles.stamp} aria-hidden="true">
          <IslandIcon id={id} size={22} />
        </span>
        <button
          type="button"
          className={styles.close}
          onClick={back}
          aria-label="Back to the sky"
          title="Back to the sky (Esc)"
        >
          ×
        </button>
        {chapter ? (
          <ChapterHeader chapter={chapter} titleId={titleId} titleRef={titleRef} />
        ) : (
          <>
            <p className={styles.kicker}>{profile.tagline}</p>
            <h2 id={titleId} ref={titleRef} tabIndex={-1} className={styles.title}>
              {profile.name}
            </h2>
            <p className={styles.meta}>
              {profile.role} · {profile.location}
            </p>
          </>
        )}
      </header>

      <div ref={bodyRef} className={styles.body}>
        {chapter ? <ChapterBody chapter={chapter} /> : <HomeBody />}
      </div>

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.navButton}
          disabled={!prev}
          onClick={() => prev && focus(prev)}
          aria-label={prev ? `Previous island: ${nameOf(prev)}` : undefined}
        >
          ← {prev ? nameOf(prev) : ''}
        </button>
        <button
          type="button"
          className={styles.navButton}
          disabled={!next}
          onClick={() => next && focus(next)}
          aria-label={next ? `Next island: ${nameOf(next)}` : undefined}
        >
          {next ? nameOf(next) : ''} →
        </button>
      </footer>
    </motion.section>
  );
}

/**
 * When an object on the island is activated, scroll its section into view and flash it,
 * so a click on the island always leads to the matching content.
 */
function useScrollToActiveObject(body: React.RefObject<HTMLDivElement | null>) {
  const reduceMotion = useReducedMotion();
  useEffect(
    () =>
      useWorld.subscribe((s, prev) => {
        if (s.activeCount === prev.activeCount || !s.activeObject || !body.current) return;
        const section = body.current.querySelector<HTMLElement>(
          `[data-object="${s.activeObject}"]`,
        );
        if (!section) return;
        body.current.scrollTo({
          top: section.offsetTop - 12,
          behavior: reduceMotion ? 'auto' : 'smooth',
        });
        // Restart the flash even if it is still playing from the last activation.
        section.removeAttribute('data-flash');
        void section.offsetWidth;
        section.setAttribute('data-flash', '');
      }),
    [body, reduceMotion],
  );
}

function ChapterHeader({
  chapter,
  titleId,
  titleRef,
}: {
  chapter: Chapter;
  titleId: string;
  titleRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const meta = [datesOf(chapter), chapter.employment, chapter.location].filter(Boolean).join(' · ');
  return (
    <>
      <p className={styles.kicker}>{chapter.company}</p>
      <h2 id={titleId} ref={titleRef} tabIndex={-1} className={styles.title}>
        {chapter.role}
      </h2>
      <p className={styles.meta}>{meta}</p>
    </>
  );
}

function ChapterBody({ chapter }: { chapter: Chapter }) {
  return (
    <>
      <p className={styles.summary}>{chapter.summary}</p>

      <h3 className={styles.sectionTitle}>Highlights</h3>
      <ul className={styles.achievements}>
        {chapter.achievements.map((a) => (
          <li key={a.id} className={styles.achievement} data-achievement={a.id}>
            <strong>{a.title}</strong>
            <p>{a.text}</p>
          </li>
        ))}
      </ul>

      <h3 className={styles.sectionTitle}>Tech</h3>
      <ul className={styles.chips}>
        {chapter.tech.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      {chapter.links && (
        <>
          <h3 className={styles.sectionTitle}>Links</h3>
          <div className={styles.links}>
            {chapter.links.map((l) => (
              <a
                key={l.href}
                className={styles.link}
                href={l.href}
                target="_blank"
                rel="noreferrer"
              >
                {l.label} ↗
              </a>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function HomeBody() {
  const [copied, setCopied] = useState(false);
  const { contacts } = profile;

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(contacts.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the address stays visible and selectable.
    }
  };

  return (
    <>
      <HomeSectionBlock section="summary" title="About me">
        <p className={styles.summary}>{profile.summary}</p>
      </HomeSectionBlock>

      <HomeSectionBlock section="contacts" title="Contacts">
        <ul className={styles.contactList}>
          <li>
            <a className={styles.link} href={`mailto:${contacts.email}`}>
              {contacts.email}
            </a>
            <button type="button" className={styles.copy} onClick={copyEmail}>
              {copied ? 'Copied' : 'Copy'}
            </button>
            <span className="visually-hidden" aria-live="polite">
              {copied ? 'Email address copied' : ''}
            </span>
          </li>
          <li>
            <a className={styles.link} href={contacts.linkedin} target="_blank" rel="noreferrer">
              LinkedIn ↗
            </a>
          </li>
          <li>
            <a className={styles.link} href={contacts.github} target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
          </li>
        </ul>
      </HomeSectionBlock>

      <HomeSectionBlock section="skills" title="Skills">
        {profile.skills.map((g) => (
          <div key={g.group} className={styles.skillGroup}>
            <h4>{g.group}</h4>
            <ul className={styles.chips}>
              {g.items.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        ))}
      </HomeSectionBlock>

      <HomeSectionBlock section="education" title="Education">
        <ul className={styles.plainList}>
          {profile.education.map((e) => (
            <li key={e.title}>
              <strong>{e.title}</strong>
              <small>
                {e.school} · {e.start.slice(0, 4)} – {e.end.slice(0, 4)}
              </small>
            </li>
          ))}
        </ul>
      </HomeSectionBlock>

      <HomeSectionBlock section="languages" title="Languages">
        <ul className={styles.plainList}>
          {profile.languages.map((l) => (
            <li key={l.name}>
              {l.name} · {l.level}
            </li>
          ))}
        </ul>
      </HomeSectionBlock>
    </>
  );
}

/**
 * One Home section, linked to its object on the island: hovering or focusing the section
 * makes the object glow, and "Show me" plays the object's reaction (the keyboard path
 * to the same thing a click on the island does).
 */
function HomeSectionBlock({
  section,
  title,
  children,
}: {
  section: HomeSection;
  title: string;
  children: ReactNode;
}) {
  const object = objectForSection(section);
  const activate = useWorld((s) => s.activateObject);
  const setHint = useWorld((s) => s.setHint);
  const hint = () => setHint(object.id);
  const unhint = () => setHint(null);

  return (
    <section
      className={styles.homeSection}
      data-object={object.id}
      onMouseEnter={hint}
      onMouseLeave={unhint}
      onFocus={hint}
      onBlur={unhint}
    >
      <div className={styles.sectionHead}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        <button
          type="button"
          className={styles.showMe}
          onClick={() => activate(object.id)}
          aria-label={`Show me ${object.name}`}
        >
          Show me
        </button>
      </div>
      {children}
    </section>
  );
}
