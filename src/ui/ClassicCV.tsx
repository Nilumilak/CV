import { useEffect } from 'react';
import { chapters, profile } from '@/data/cv';
import { datesOf } from '@/data/navigation';
import styles from './ClassicCV.module.css';

const prettyUrl = (href: string) => href.replace(/^https?:\/\//, '');

const monthYear = (ym: string) =>
  new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1).toLocaleString('en', {
    month: 'short',
    year: 'numeric',
  });

/**
 * Plain, printable CV built from the same data as the 3D world.
 * Shown at #/cv, and automatically when WebGL is unavailable.
 */
export function ClassicCV({ noWebGL = false }: { noWebGL?: boolean }) {
  // The 3D view locks page scrolling; the classic page needs it back.
  useEffect(() => {
    document.documentElement.dataset.view = 'cv';
    return () => {
      delete document.documentElement.dataset.view;
    };
  }, []);

  const { contacts } = profile;
  const jobs = chapters.filter((c) => c.kind === 'job').reverse();
  const openSource = chapters.filter((c) => c.kind === 'open-source');

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        {noWebGL ? (
          <span />
        ) : (
          <a className={styles.secondary} href="#/">
            ← Back to the sky
          </a>
        )}
        <span>
          <a href="/cv.pdf" download>
            Download PDF
          </a>{' '}
          <button type="button" className={styles.secondary} onClick={() => window.print()}>
            Print
          </button>
        </span>
      </div>

      {noWebGL && (
        <p className={styles.notice} role="status">
          Your browser cannot show the 3D version of this site, so here is the classic CV.
        </p>
      )}

      <main className={styles.page}>
        <header className={styles.header}>
          {profile.photo && <img className={styles.photo} src={profile.photo} alt={profile.name} />}
          <div className={styles.intro}>
            <h1 className={styles.name}>{profile.name}</h1>
            <p className={styles.role}>
              {profile.role} · {profile.tagline}
            </p>
            <ul className={styles.contacts}>
              <li>{profile.location}</li>
              <li>
                <a href={`mailto:${contacts.email}`}>{contacts.email}</a>
              </li>
              {contacts.phone && <li>{contacts.phone}</li>}
              <li>
                <a href={contacts.linkedin}>{prettyUrl(contacts.linkedin)}</a>
              </li>
              <li>
                <a href={contacts.github}>{prettyUrl(contacts.github)}</a>
              </li>
            </ul>
          </div>
        </header>

        <h2 className={styles.section}>Summary</h2>
        <p>{profile.summary}</p>

        <h2 className={styles.section}>Professional Experience</h2>
        {jobs.map((c) => (
          <article key={c.id} className={styles.job}>
            <div className={styles.jobHead}>
              <h3 className={styles.jobTitle}>
                {c.role} · <span className={styles.company}>{c.company}</span>
              </h3>
              <p className={styles.dates}>{datesOf(c)}</p>
            </div>
            <p className={styles.meta}>
              {[c.summary, c.employment, c.location].filter(Boolean).join(' · ')}
            </p>
            <ul className={styles.list}>
              {c.achievements.map((a) => (
                <li key={a.id}>{a.text}</li>
              ))}
            </ul>
          </article>
        ))}

        {openSource.length > 0 && (
          <>
            <h2 className={styles.section}>Open source</h2>
            {openSource.map((c) => (
              <article key={c.id} className={styles.job}>
                <div className={styles.jobHead}>
                  <h3 className={styles.jobTitle}>
                    {c.role} · <span className={styles.company}>{c.company}</span>
                  </h3>
                  <p className={styles.dates}>{datesOf(c)}</p>
                </div>
                {c.links?.map((l) => (
                  <p key={l.href} className={styles.meta}>
                    <a href={l.href}>{l.label}</a>
                  </p>
                ))}
                <ul className={styles.list}>
                  {c.achievements.map((a) => (
                    <li key={a.id}>{a.text}</li>
                  ))}
                </ul>
              </article>
            ))}
          </>
        )}

        <h2 className={styles.section}>Technical Skills</h2>
        <dl className={styles.skills}>
          {profile.skills.map((g) => (
            <div key={g.group} style={{ display: 'contents' }}>
              <dt>{g.group}</dt>
              <dd>{g.items.join(', ')}</dd>
            </div>
          ))}
          <dt>Languages</dt>
          <dd>{profile.languages.map((l) => `${l.name} (${l.level})`).join(', ')}</dd>
        </dl>

        <h2 className={styles.section}>Education</h2>
        {profile.education.map((e) => (
          <div key={e.title} className={styles.edu}>
            <div className={styles.jobHead}>
              <h3 className={styles.jobTitle}>{e.title}</h3>
              <p className={styles.dates}>
                {monthYear(e.start)} – {monthYear(e.end)}
              </p>
            </div>
            <p className={styles.meta}>{[e.school, e.note].filter(Boolean).join(' · ')}</p>
          </div>
        ))}
      </main>
    </div>
  );
}
