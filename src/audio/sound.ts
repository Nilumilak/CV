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
};
