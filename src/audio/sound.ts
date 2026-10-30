/**
 * The site's sound: a music loop and a wind loop for ambience, a whoosh for the fly-in, a page
 * rustle and a soft tap for the interface, and a short sound per interactive object. Recorded
 * files come from ElevenLabs (scripts/sound-gen.mjs); two objects keep synthesized sounds.
 *
 * Browsers only allow audio after a user gesture, so setEnabled() and whoosh() must be
 * called from a click handler (or after the page has had one: activation is sticky).
 */
import bookshelfUrl from '@/assets/audio/home-bookshelf.mp3?url';
import catUrl from '@/assets/audio/home-cat.mp3?url';
import signpostUrl from '@/assets/audio/mone-account.mp3?url';
import balloonUrl from '@/assets/audio/mone-fsd.mp3?url';
import shopUrl from '@/assets/audio/mone-nextjs.mp3?url';
import tramUrl from '@/assets/audio/mone-bnpl.mp3?url';
import containersUrl from '@/assets/audio/radio-backend.mp3?url';
import robotUrl from '@/assets/audio/radio-llm.mp3?url';
import bunkerUrl from '@/assets/audio/radio-platform.mp3?url';
import dishUrl from '@/assets/audio/radio-services.mp3?url';
import screenUrl from '@/assets/audio/radio-ui.mp3?url';
import podiumUrl from '@/assets/audio/olimp-apps.mp3?url';
import phoneUrl from '@/assets/audio/olimp-iframe.mp3?url';
import shoeUrl from '@/assets/audio/olimp-preact.mp3?url';
import scoreboardUrl from '@/assets/audio/olimp-virtual.mp3?url';
import circuitBoardUrl from '@/assets/audio/salyut-assemblies.mp3?url';
import whistleUrl from '@/assets/audio/salyut-lead.mp3?url';
import scrollUrl from '@/assets/audio/salyut-macros.mp3?url';
import oscilloscopeUrl from '@/assets/audio/salyut-projects.mp3?url';
import windmillUrl from '@/assets/audio/mone-packages.mp3?url';
import fountainUrl from '@/assets/audio/mone-pdl.mp3?url';
import lighthouseUrl from '@/assets/audio/kafka-auth.mp3?url';
import saplingsUrl from '@/assets/audio/eco-build.mp3?url';
import binsUrl from '@/assets/audio/eco-lead.mp3?url';
import collectionBoxUrl from '@/assets/audio/eco-payments.mp3?url';
import lanternUrl from '@/assets/audio/home-lantern.mp3?url';
import mailboxUrl from '@/assets/audio/home-mailbox.mp3?url';
import musicUrl from '@/assets/audio/music.mp3?url';
import rustleUrl from '@/assets/audio/rustle.mp3?url';
import tapUrl from '@/assets/audio/tap.mp3?url';
import whooshUrl from '@/assets/audio/whoosh.mp3?url';
import windUrl from '@/assets/audio/wind.mp3?url';

/** Master volume when sound is on. */
const LEVEL = 0.8;
const FADE_IN = 2.5;
const FADE_OUT = 0.6;

/**
 * Every file is levelled to the same loudness, so these set the mix: the music sits under
 * the wind, and object sounds come through clearly over both.
 */
const MUSIC_LEVEL = 0.45;
const WIND_LEVEL = 0.35;
const WHOOSH_LEVEL = 0.8;
const OBJECT_LEVEL = 0.9;
/** Interface sounds stay in the background: a page turning, a soft tap. */
const UI_LEVEL = 0.5;

/** Recorded object sounds, by object id, each with an optional level of its own. */
const OBJECT_SOUNDS: Record<string, { url: string; level?: number }> = {
  'home-cat': { url: catUrl, level: 0.4 },
  'home-bookshelf': { url: bookshelfUrl, level: 0.4 },
  'home-mailbox': { url: mailboxUrl, level: 0.4 },
  'home-lantern': { url: lanternUrl },
  'eco-build': { url: saplingsUrl, level: 0.4 },
  'eco-payments': { url: collectionBoxUrl },
  // Its sharp thumps capped the levelling, so this file is about 5 dB quieter than the rest.
  'eco-lead': { url: binsUrl, level: 0.4 },
  'radio-backend': { url: containersUrl },
  'olimp-preact': { url: shoeUrl, level: 0.4 },
  'olimp-virtual': { url: scoreboardUrl, level: 0.4 },
  // About 2 dB under the other files (a peak capped its levelling), hence a little higher.
  'olimp-iframe': { url: phoneUrl, level: 0.8 },
  'olimp-apps': { url: podiumUrl, level: 0.4 },
  'salyut-assemblies': { url: circuitBoardUrl, level: 0.4 },
  'salyut-macros': { url: scrollUrl, level: 0.4 },
  'salyut-lead': { url: whistleUrl, level: 0.6 },
  'salyut-projects': { url: oscilloscopeUrl, level: 0.4 },
  'radio-ui': { url: screenUrl, level: 0.4 },
  'radio-services': { url: dishUrl, level: 0.4 },
  'radio-platform': { url: bunkerUrl, level: 0.4 },
  'radio-llm': { url: robotUrl },
  'mone-bnpl': { url: tramUrl },
  'mone-packages': { url: windmillUrl, level: 0.4 },
  'mone-pdl': { url: fountainUrl, level: 0.4 },
  'mone-nextjs': { url: shopUrl },
  'mone-fsd': { url: balloonUrl },
  'mone-account': { url: signpostUrl, level: 0.6 },
  'kafka-auth': { url: lighthouseUrl, level: 0.3 },
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambientStarted = false;
let enabled = false;
let suspendTimer: number | undefined;

function context(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden) void ctx.suspend();
      else if (enabled) void ctx.resume();
    });
  }
  if (ctx.state === 'suspended' && enabled) void ctx.resume();
  return ctx;
}

/**
 * Files are fetched once, when sound is first turned on, and decoded once the audio context
 * exists. A failed load stays silent rather than throwing.
 */
const files = new Map<string, Promise<ArrayBuffer | null>>();
const decoded = new Map<string, Promise<AudioBuffer | null>>();

function fetchFile(url: string): Promise<ArrayBuffer | null> {
  let file = files.get(url);
  if (!file) {
    file = fetch(url)
      .then((res) => (res.ok ? res.arrayBuffer() : null))
      .catch(() => null);
    files.set(url, file);
  }
  return file;
}

function load(ac: AudioContext, url: string): Promise<AudioBuffer | null> {
  let buffer = decoded.get(url);
  if (!buffer) {
    buffer = fetchFile(url)
      .then((data) => (data ? ac.decodeAudioData(data.slice(0)) : null))
      .catch(() => null);
    decoded.set(url, buffer);
  }
  return buffer;
}

/**
 * Plays a file once, or looped. Ambience goes through the master gain, which fades with the
 * sound toggle; one-off sounds go straight out at full level so a fade-in can't swallow them.
 */
async function play(url: string, level: number, loop = false) {
  const ac = context();
  if (!ac || !master) return;
  const buffer = await load(ac, url);
  if (!buffer || !enabled) return;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  src.loop = loop;
  const gain = ac.createGain();
  gain.gain.value = loop ? level : level * LEVEL;
  src.connect(gain).connect(loop ? master : ac.destination);
  src.start();
}

function whiteNoise(ac: AudioContext, seconds: number): AudioBuffer {
  const buffer = ac.createBuffer(1, ac.sampleRate * seconds, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function rampTo(param: AudioParam, value: number, seconds: number) {
  if (!ctx) return;
  const now = ctx.currentTime;
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.linearRampToValueAtTime(value, now + seconds);
}

/** Band-passed noise with a sweeping centre, for paper and air sounds. */
function noiseSweep(
  ac: AudioContext,
  t: number,
  sweep: [seconds: number, hz: number][],
  peak: number,
  seconds: number,
) {
  const src = ac.createBufferSource();
  src.buffer = whiteNoise(ac, seconds);
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 0.9;
  filter.frequency.setValueAtTime(sweep[0][1], t);
  for (const [at, hz] of sweep.slice(1)) filter.frequency.exponentialRampToValueAtTime(hz, t + at);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + seconds * 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t);
  src.stop(t + seconds);
}

/**
 * The two objects whose synthesized sounds were kept over recorded ones: the globe's whirr
 * and the noticeboard's paper rustle. Every other object plays its file from OBJECT_SOUNDS.
 */
const SYNTHESIZED: Record<string, (ac: AudioContext, t: number) => void> = {
  // Air rushing up and down, like a globe spun by hand.
  'home-globe': (ac, t) =>
    noiseSweep(
      ac,
      t,
      [
        [0, 500],
        [0.35, 1400],
        [0.9, 420],
      ],
      0.07,
      0.9,
    ),
  // Two quick rustles, like notes being shuffled.
  'eco-admin': (ac, t) => {
    noiseSweep(
      ac,
      t,
      [
        [0, 1800],
        [0.18, 3200],
      ],
      0.1,
      0.2,
    );
    noiseSweep(
      ac,
      t + 0.16,
      [
        [0, 2600],
        [0.22, 4200],
      ],
      0.08,
      0.26,
    );
  },
};

export const sound = {
  /**
   * Turn sound on or off with a short fade. Nothing downloads until sound is first turned on,
   * so visitors who enter quietly never fetch the files; the first time, the small one-off
   * sounds are fetched first, then the music and wind loops.
   */
  setEnabled(on: boolean) {
    enabled = on;
    window.clearTimeout(suspendTimer);
    if (on) {
      const objects = Object.values(OBJECT_SOUNDS).map((s) => s.url);
      for (const url of [whooshUrl, tapUrl, rustleUrl, ...objects]) void fetchFile(url);
      const ac = context();
      if (!ac || !master) return;
      if (!ambientStarted) {
        void play(musicUrl, MUSIC_LEVEL, true);
        void play(windUrl, WIND_LEVEL, true);
        ambientStarted = true;
      }
      rampTo(master.gain, LEVEL, FADE_IN);
    } else if (ctx && master) {
      rampTo(master.gain, 0, FADE_OUT);
      // Suspend after the fade to stop using CPU.
      suspendTimer = window.setTimeout(() => void ctx?.suspend(), FADE_OUT * 1000 + 100);
    }
  },

  /** The airy swoosh of the dive through the clouds. Plays only when sound is on. */
  whoosh() {
    if (enabled) void play(whooshUrl, WHOOSH_LEVEL);
  },

  /** A page turning, when an island's panel opens. Plays only when sound is on. */
  rustle() {
    if (enabled) void play(rustleUrl, UI_LEVEL);
  },

  /** A soft tap for interface buttons and links. Plays only when sound is on. */
  tap() {
    if (enabled) void play(tapUrl, UI_LEVEL);
  },

  /** An interactive object's reaction sound, by object id. Plays only when sound is on. */
  cue(object: string) {
    if (!enabled) return;
    const recorded = OBJECT_SOUNDS[object];
    if (recorded) {
      void play(recorded.url, recorded.level ?? OBJECT_LEVEL);
      return;
    }
    const ac = context();
    if (ac) SYNTHESIZED[object]?.(ac, ac.currentTime);
  },
};
