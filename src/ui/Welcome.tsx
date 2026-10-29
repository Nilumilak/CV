import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { sound } from '@/audio/sound';
import { profile } from '@/data/cv';
import { registerVeil } from '@/scenes/introEffects';
import { useWorld } from '@/store/useWorld';
import styles from './Welcome.module.css';

const TITLE = ['Welcome', 'to', 'my', 'World'];

/** Welcome overlay over the live sky. Plain HTML, so it shows before the 3D scene is ready. */
export function Welcome() {
  const ready = useWorld((s) => s.phase === 'welcome');
  const enterWorld = useWorld((s) => s.enter);
  const setPhase = useWorld((s) => s.setPhase);
  const reduceMotion = useReducedMotion();
  const enterRef = useRef<HTMLButtonElement>(null);

  // Keyboard users can press Enter straight away once the button appears.
  useEffect(() => {
    if (ready) enterRef.current?.focus({ preventScroll: true });
  }, [ready]);

  const enter = (withSound: boolean) => {
    // Inside the click handler: browsers only start audio from a user gesture.
    sound.setEnabled(withSound);
    enterWorld(withSound);
    if (reduceMotion) setPhase('world');
    else sound.whoosh();
  };

  return (
    <motion.section
      className={styles.screen}
      aria-labelledby="welcome-title"
      initial={{ opacity: 1 }}
      // A slow fade while the camera starts to move, so the text melts away into the dive.
      exit={{ opacity: 0, transition: { duration: 1.2, ease: 'easeInOut' } }}
    >
      <motion.div
        className={styles.content}
        exit={
          reduceMotion
            ? undefined
            : { y: -28, scale: 0.97, transition: { duration: 1.2, ease: 'easeIn' } }
        }
      >
        <p className={styles.kicker}>
          {profile.name} · {profile.role}
        </p>
        <h1 id="welcome-title" className={styles.title}>
          {TITLE.map((word, i) => (
            <motion.span
              key={word}
              className={styles.word}
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.12, duration: 0.6, ease: 'easeOut' }}
            >
              {word}
              {i < TITLE.length - 1 ? ' ' : ''}
            </motion.span>
          ))}
        </h1>
        <p className={styles.subtitle}>A CV you can fly through, one island per chapter.</p>

        <div className={styles.actions}>
          {ready ? (
            <motion.div
              className={styles.buttons}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <button
                ref={enterRef}
                type="button"
                className={styles.enter}
                onClick={() => enter(true)}
              >
                Enter with sound
              </button>
              <button
                type="button"
                className={`${styles.enter} ${styles.quiet}`}
                onClick={() => enter(false)}
              >
                Enter quietly
              </button>
            </motion.div>
          ) : (
            <div
              className={styles.loading}
              role="progressbar"
              aria-label="Preparing the sky"
              aria-busy="true"
            >
              <span />
            </div>
          )}
          <a className={styles.cvLink} href="#/cv">
            Just the CV, please
          </a>
        </div>
      </motion.div>
    </motion.section>
  );
}

/** During the dive: a Skip button, and any key or click also skips. */
export function SkipIntro() {
  const setPhase = useWorld((s) => s.setPhase);

  useEffect(() => {
    const skip = () => setPhase('world');
    // Ignore the click that started the dive by listening from the next frame on.
    const raf = requestAnimationFrame(() => {
      window.addEventListener('keydown', skip, { once: true });
      window.addEventListener('pointerdown', skip, { once: true });
    });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('pointerdown', skip);
    };
  }, [setPhase]);

  return (
    <button type="button" className={styles.skip} onClick={() => setPhase('world')}>
      Skip ›
    </button>
  );
}

/** White veil for the moment inside the cloud. FlyIn sets its opacity every frame. */
export function CloudVeil() {
  return <div ref={registerVeil} className={styles.veil} aria-hidden="true" />;
}
