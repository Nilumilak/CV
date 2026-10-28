/**
 * Ambient sound, synthesized with the Web Audio API: soft wind plus a slow warm chord.
 * No audio files to download or license. Phase 6 can swap in recorded music.
 *
 * Browsers only allow audio after a user gesture, so start() and whoosh() must be
 * called from a click handler (or after the page has had one: activation is sticky).
 */

/** Master volume when sound is on. */
const LEVEL = 0.55;
const FADE_IN = 2.5;
const FADE_OUT = 0.6;

/** F major 7: F3, A3, C4, E4. Calm and open, no strong pull anywhere. */
const CHORD = [174.61, 220.0, 261.63, 329.63];

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
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Brown noise: random steps that wander, which sounds like wind rather than hiss. */
function brownNoise(ac: AudioContext, seconds: number): AudioBuffer {
  const buffer = ac.createBuffer(1, ac.sampleRate * seconds, ac.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}

function whiteNoise(ac: AudioContext, seconds: number): AudioBuffer {
  const buffer = ac.createBuffer(1, ac.sampleRate * seconds, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function lfo(ac: AudioContext, hz: number, depth: number, target: AudioParam) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.frequency.value = hz;
  gain.gain.value = depth;
  osc.connect(gain).connect(target);
  osc.start();
}

function startAmbient(ac: AudioContext, out: AudioNode) {
  // Wind: low-passed brown noise whose brightness slowly rises and falls.
  const wind = ac.createBufferSource();
  wind.buffer = brownNoise(ac, 6);
  wind.loop = true;
  const windFilter = ac.createBiquadFilter();
  windFilter.type = 'lowpass';
  windFilter.frequency.value = 500;
  windFilter.Q.value = 0.8;
  const windGain = ac.createGain();
  windGain.gain.value = 0.32;
  lfo(ac, 0.07, 280, windFilter.frequency);
  lfo(ac, 0.05, 0.12, windGain.gain);
  wind.connect(windFilter).connect(windGain).connect(out);
  wind.start();

  // Pad: two slightly detuned triangle voices per note, softened by a low-pass filter.
  const padFilter = ac.createBiquadFilter();
  padFilter.type = 'lowpass';
  padFilter.frequency.value = 900;
  const padGain = ac.createGain();
  padGain.gain.value = 0.05;
  lfo(ac, 0.09, 0.018, padGain.gain);
  padFilter.connect(padGain).connect(out);
  for (const freq of CHORD) {
    for (const cents of [-4, 4]) {
      const osc = ac.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = cents;
      osc.connect(padFilter);
      osc.start();
    }
  }
}

function rampTo(param: AudioParam, value: number, seconds: number) {
  if (!ctx) return;
  const now = ctx.currentTime;
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.linearRampToValueAtTime(value, now + seconds);
}

/** Short, soft reaction sounds for interactive objects. All under a second. */
export type SoundCue = 'mrrp' | 'chime' | 'paper' | 'knock' | 'whirr' | 'beep' | 'hum' | 'click';

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
};

export const sound = {
  /** Turn ambient sound on or off with a short fade. */
  setEnabled(on: boolean) {
    enabled = on;
    window.clearTimeout(suspendTimer);
    if (on) {
      const ac = context();
      if (!ac || !master) return;
      if (!ambientStarted) {
        startAmbient(ac, master);
        ambientStarted = true;
      }
      rampTo(master.gain, LEVEL, FADE_IN);
    } else if (ctx && master) {
      rampTo(master.gain, 0, FADE_OUT);
      // Suspend after the fade to stop using CPU.
      suspendTimer = window.setTimeout(() => void ctx?.suspend(), FADE_OUT * 1000 + 100);
    }
  },

  /** A rushing-air sweep for the dive through the clouds. Plays only when sound is on. */
  whoosh(seconds = 3.2) {
    const ac = context();
    if (!ac || !enabled) return;
    const src = ac.createBufferSource();
    src.buffer = whiteNoise(ac, seconds);
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.1;
    const gain = ac.createGain();
    const t = ac.currentTime;
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.exponentialRampToValueAtTime(1800, t + seconds * 0.45);
    filter.frequency.exponentialRampToValueAtTime(220, t + seconds);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.35, t + seconds * 0.45);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    src.connect(filter).connect(gain).connect(ac.destination);
    src.start(t);
    src.stop(t + seconds);
  },

  /** A short reaction sound for an interactive object. Plays only when sound is on. */
  cue(name: SoundCue) {
    const ac = context();
    if (!ac || !enabled) return;
    CUES[name](ac, ac.currentTime);
  },
};
