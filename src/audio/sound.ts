/**
 * The site's sound: a music loop and a wind loop for ambience, a whoosh for the fly-in and a
 * short sound per interactive object. Recorded files come from ElevenLabs (scripts/sound-gen.mjs);
 * objects without a recorded sound yet fall back to a small synthesized cue.
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
  // Its sharp thumps capped the levelling, so this file is about 5 dB quieter than the rest.
  'eco-lead': { url: binsUrl, level: 0.4 },
  'radio-backend': { url: containersUrl },
  'radio-llm': { url: robotUrl },
  'mone-bnpl': { url: tramUrl },
  'mone-packages': { url: windmillUrl, level: 0.8 },
  'mone-pdl': { url: fountainUrl, level: 0.4 },
  'mone-nextjs': { url: shopUrl },
  'mone-fsd': { url: balloonUrl },
  'mone-account': { url: signpostUrl, level: 0.6 },
  'kafka-auth': { url: lighthouseUrl, level: 0.3 },
  'eco-payments': { url: collectionBoxUrl },
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambientStarted = false;
let enabled = false;
/**
 * TEMPORARY comparison switch (the button in ui/Overlay.tsx): false plays the old synthesized
 * cue for every object. Remove both once all object sounds are picked.
 */
let objectsRecorded = true;
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
 * Files are fetched once, early (fetching needs no user gesture), and decoded once the audio
 * context exists. A failed load stays silent rather than throwing.
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

/** Short, soft reaction sounds for interactive objects. All under a second. */
export type SoundCue =
  'mrrp' | 'chime' | 'paper' | 'knock' | 'whirr' | 'beep' | 'hum' | 'click' | 'bell' | 'coins';

/** One oscillator with a gliding pitch and a quick attack, exponential fade. */
function voice(
  ac: AudioContext,
  t: number,
  type: OscillatorType,
  pitch: [seconds: number, hz: number][],
  peak: number,
  seconds: number,
  out: AudioNode = ac.destination,
) {
  const osc = ac.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(pitch[0][1], t);
  for (const [at, hz] of pitch.slice(1)) osc.frequency.exponentialRampToValueAtTime(hz, t + at);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
  osc.connect(gain).connect(out);
  osc.start(t);
  osc.stop(t + seconds + 0.05);
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

const CUES: Record<SoundCue, (ac: AudioContext, t: number) => void> = {
  // A cat's chirp-trill: a voiced buzz shaped by two vowel-like resonances, with a fast
  // flutter in loudness for the rolled "rr". The pitch lifts a little and settles,
  // like a question ("mrrp?"), instead of a bouncy glide.
  mrrp: (ac, t) => {
    const seconds = 0.42;
    const buzz = ac.createOscillator();
    buzz.type = 'sawtooth';
    buzz.frequency.setValueAtTime(240, t);
    buzz.frequency.exponentialRampToValueAtTime(310, t + 0.16);
    buzz.frequency.exponentialRampToValueAtTime(275, t + seconds);

    // The rolled "rr": loudness wobbles about 24 times a second.
    const roll = ac.createGain();
    roll.gain.value = 0.55;
    const flutter = ac.createOscillator();
    flutter.frequency.value = 24;
    const depth = ac.createGain();
    depth.gain.value = 0.45;
    flutter.connect(depth).connect(roll.gain);
    buzz.connect(roll);

    // Envelope: soft start, a short hold, and the mouth closing at the end ("p").
    const env = ac.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.5, t + 0.05);
    env.gain.setValueAtTime(0.5, t + seconds * 0.6);
    env.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    env.connect(ac.destination);

    // Two resonances, roughly the vowel in "mur", so it sounds voiced, not electronic.
    for (const [hz, q, level] of [
      [700, 5, 1],
      [1250, 7, 0.45],
    ]) {
      const formant = ac.createBiquadFilter();
      formant.type = 'bandpass';
      formant.frequency.value = hz;
      formant.Q.value = q;
      const mix = ac.createGain();
      mix.gain.value = level;
      roll.connect(formant).connect(mix).connect(env);
    }

    for (const osc of [buzz, flutter]) {
      osc.start(t);
      osc.stop(t + seconds + 0.05);
    }
  },
  // Two bell tones a fifth apart (C6, G6).
  chime: (ac, t) => {
    voice(ac, t, 'sine', [[0, 1046.5]], 0.07, 1.1);
    voice(ac, t + 0.09, 'sine', [[0, 1568]], 0.05, 1.0);
  },
  // Two quick rustles, like a letter sliding out.
  paper: (ac, t) => {
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
  // Two soft knocks on wood.
  knock: (ac, t) => {
    voice(
      ac,
      t,
      'sine',
      [
        [0, 190],
        [0.12, 95],
      ],
      0.22,
      0.16,
    );
    voice(
      ac,
      t + 0.13,
      'sine',
      [
        [0, 170],
        [0.12, 90],
      ],
      0.16,
      0.16,
    );
  },
  // Air rushing up and down, like a globe spun by hand.
  whirr: (ac, t) =>
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
  // Two friendly robot blips, the second higher.
  beep: (ac, t) => {
    voice(ac, t, 'square', [[0, 880]], 0.04, 0.09);
    voice(ac, t + 0.11, 'square', [[0, 1320]], 0.04, 0.12);
  },
  // A low electric hum swelling and fading, like a lab switching on.
  hum: (ac, t) =>
    voice(
      ac,
      t,
      'sine',
      [
        [0, 110],
        [0.6, 120],
      ],
      0.12,
      0.9,
    ),
  // A soft switch click.
  click: (ac, t) =>
    voice(
      ac,
      t,
      'triangle',
      [
        [0, 1800],
        [0.04, 600],
      ],
      0.08,
      0.06,
    ),
  // A little tram bell: two quick dings.
  bell: (ac, t) => {
    voice(ac, t, 'sine', [[0, 1318]], 0.08, 0.5);
    voice(ac, t + 0.18, 'sine', [[0, 1318]], 0.07, 0.6);
  },
  // Coins tumbling: a handful of short bright pings at random pitches.
  coins: (ac, t) => {
    for (let i = 0; i < 6; i++) {
      voice(
        ac,
        t + i * 0.06 + Math.random() * 0.03,
        'sine',
        [[0, 2200 + Math.random() * 1400]],
        0.04,
        0.18,
      );
    }
  },
};

export const sound = {
  /** TEMPORARY: switch objects between recorded and synthesized sounds, for comparing. */
  toggleObjectsRecorded() {
    objectsRecorded = !objectsRecorded;
    return objectsRecorded;
  },

  /** Start downloading the sound files, so the first sounds don't wait on the network. */
  preload() {
    const objects = Object.values(OBJECT_SOUNDS).map((s) => s.url);
    for (const url of [musicUrl, windUrl, whooshUrl, rustleUrl, tapUrl, ...objects]) {
      void fetchFile(url);
    }
  },

  /** Turn ambient sound on or off with a short fade. */
  setEnabled(on: boolean) {
    enabled = on;
    window.clearTimeout(suspendTimer);
    if (on) {
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

  /**
   * An interactive object's reaction sound: its recorded sound if it has one, otherwise the
   * synthesized cue for its kind. Plays only when sound is on.
   */
  cue(name: SoundCue, object?: string) {
    const recorded = object && objectsRecorded && OBJECT_SOUNDS[object];
    if (recorded) {
      if (enabled) void play(recorded.url, recorded.level ?? OBJECT_LEVEL);
      return;
    }
    const ac = context();
    if (!ac || !enabled) return;
    CUES[name](ac, ac.currentTime);
  },
};
