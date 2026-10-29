// Generates the site's sounds with ElevenLabs into art-source/audio/raw/ (not in git), levels
// each to one loudness in art-source/audio/, and builds a listening page there to pick the best
// version of each by ear.
// The API key comes only from the ELEVENLABS_API_KEY environment variable; never write it down.
// Usage:
//   node scripts/sound-gen.mjs home-cat           one sound, VERSIONS versions
//   node scripts/sound-gen.mjs wind whoosh -n 1   several sounds, one version each
//   node scripts/sound-gen.mjs home-lantern -p "..."   try a one-off prompt instead of the listed one
//   node scripts/sound-gen.mjs --all              everything not generated yet
//   node scripts/sound-gen.mjs --page             only re-level the files and rebuild the page
//   node scripts/sound-gen.mjs --export           compress the PICKS into src/assets/audio/
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import ffmpeg from 'ffmpeg-static';

const OUT = 'art-source/audio';
const RAW = `${OUT}/raw`;
const API = 'https://api.elevenlabs.io/v1';
const VERSIONS = 3;

/**
 * The quiet prompts give soft sounds that are also very faint, at wildly different levels,
 * so every file is levelled to one loudness (LUFS) with its loudest peak kept below PEAK (dBFS).
 */
const LOUDNESS = -24;
const PEAK = -3;

/** Every prompt gets the art direction's sound rule (docs/plan/art-direction.md, Sound). */
const STYLE =
  'Very quiet and intimate, ASMR-soft, muffled and rounded with no sharp attack, slightly distant, ' +
  'warm and cosy, low volume, clean, no music, no voices.';

/**
 * The sounds. `seconds` is the requested length; `loop` asks for a seamless loop.
 * `music` ones go through ElevenLabs Music instead of sound effects.
 * Object sounds are keyed by object id and last as long as that object's click reaction.
 */
const SOUNDS = {
  // Ambience and interface.
  wind: {
    seconds: 20,
    loop: true,
    prompt:
      'Whimsical wind from a hand-drawn animated film: soft breathy whooshes rising and falling ' +
      'in slow smooth waves, like wind sweeping over grassy hills and floating islands, warm, ' +
      'airy and playful, rounded and smooth, not realistic, no hiss, no whistling.',
  },
  music: {
    music: true,
    seconds: 60,
    prompt:
      'Gentle, peaceful instrumental in the style of a hand-drawn fantasy film score: warm solo ' +
      'piano with soft strings, slow tempo, dreamy and floating, light and hopeful, no drums, ' +
      'no vocals, quiet throughout, suitable as calm background music.',
  },
  whoosh: {
    seconds: 6,
    prompt:
      'Whimsical whoosh from a hand-drawn animated film: a soft, breathy, magical swoosh of ' +
      'floating down through fluffy clouds, swelling in a smooth wave and gently drifting away, ' +
      'with a faint airy shimmer. Playful and dreamy, not realistic, no engine, no airplane, no jet, ' +
      'no rumble, no hiss.',
  },
  rustle: { seconds: 0.7, prompt: 'A book page turning softly.' },
  tap: { seconds: 0.5, prompt: 'A tiny, soft tap on light wood, a gentle UI click.' },

  // Home.
  'home-cat': {
    seconds: 3,
    prompt:
      'A drowsy cat, half asleep, giving one tiny soft purring trill through a closed mouth, ' +
      'then a slow sleepy sigh and a little quiet purring as it settles back to sleep.',
  },
  'home-bookshelf': {
    seconds: 1,
    prompt: 'A small wooden bookshelf wobbling, books softly bumping against each other and settling.',
  },
  'home-globe': {
    seconds: 1.6,
    prompt:
      'Cartoon spin sound effect from a hand-drawn animated film: a quick, bouncy swish-swish-swish ' +
      'of a little globe spinning around on its stand, light and playful, slowing down to a soft stop. ' +
      'Simple and charming, not realistic, no sparkle, no music.',
  },
  'home-lantern': {
    seconds: 2.4,
    prompt:
      'Cartoon sound from a hand-drawn animated film: a soft cosy fwoomp as a little lantern lights ' +
      'up, a warm glow swelling gently like a breath, then a few tiny glassy twinkles like fireflies ' +
      'waking up. Whimsical and warm, not realistic, no crackle.',
  },
  'home-mailbox': {
    seconds: 1.3,
    prompt: 'A small mailbox flap rattling softly, then a letter popping out with a light paper flick.',
  },

  // Green Grove.
  'eco-admin': {
    seconds: 1.5,
    prompt:
      'Cartoon sound from a hand-drawn animated film: a few sheets of paper being moved and slid ' +
      'around on a wooden desk, a soft papery shuffle with light taps on the wood. Cosy and tidy, ' +
      'not realistic.',
  },
  'eco-build': {
    seconds: 3.2,
    prompt:
      'Cartoon sound from a hand-drawn animated film: little trees growing up, leaves rustling and ' +
      'moving, with a soft woody creak and crunch as the young trunks stretch upwards. Cosy and ' +
      'natural, gently whimsical, not harsh.',
  },
  'eco-lead': {
    seconds: 2.6,
    prompt:
      'Cartoon sound from a hand-drawn animated film: a few sheets of paper and little books dropped ' +
      'one after another into a cardboard box, soft papery flaps and cosy cardboard thumps, gentle ' +
      'and tidy. Whimsical, not realistic.',
  },
  'eco-payments': {
    seconds: 1.8,
    prompt:
      'Cartoon sound effect from a hand-drawn animated film: three shiny coins dropping into a box ' +
      'with a bright playful clink-clink-clink, then a cheerful little ding. Whimsical, not realistic.',
  },

  // Lighthouse.
  'kafka-auth': {
    seconds: 3.4,
    prompt:
      'Cartoon seaside sound from a hand-drawn animated film: a flock of seagulls calling clearly ' +
      'and cheerfully close by, several gull cries overlapping, over gentle sea waves washing in ' +
      'and out by a lighthouse. Lively but cosy, not harsh.',
  },

  // Market Town.
  'mone-account': {
    seconds: 1.4,
    prompt:
      'Cartoon sound from a hand-drawn animated film: a quick whirling swish as a signpost spins ' +
      'around once, an airy swirl rising and settling. Playful and light, not realistic.',
  },
  'mone-bnpl': {
    seconds: 4.5,
    prompt: 'A small toy tram rolling around a town square on rails, soft clickety-clack, two light bell dings.',
  },
  'mone-fsd': {
    seconds: 5,
    prompt: 'A small hot-air balloon lifting off, a soft burner whoosh, then a gentle airy rise and float.',
  },
  'mone-nextjs': {
    seconds: 3,
    prompt:
      'Cartoon sound from a hand-drawn animated film: a few cardboard boxes tumbling and falling ' +
      'one after another, soft hollow cardboard thumps and bumps. Playful and cosy, not harsh.',
  },
  'mone-packages': {
    seconds: 3.2,
    prompt: 'Wooden windmill sails turning faster with soft creaks in a breeze, small parcels whooshing out.',
  },
  'mone-pdl': {
    seconds: 3.4,
    prompt: 'A small stone fountain, four water jets rising and splashing gently, soft trickling water.',
  },

  // Radio Tower.
  'radio-backend': {
    seconds: 2.6,
    prompt: 'A soft thump on stacked metal containers, quick tiny ticks, then a gentle success chime.',
  },
  'radio-llm': {
    seconds: 3.2,
    prompt: 'A cute little robot thinking with soft computing bleeps, then a small hop and a happy two-note beep.',
  },
  'radio-platform': {
    seconds: 2.4,
    prompt: 'A heavy bunker door glowing, a deep soft electric hum swelling and fading.',
  },
  'radio-services': {
    seconds: 1.8,
    prompt: 'A satellite dish turning with a soft motor whirr, then a few soft radio signal pings.',
  },
  'radio-ui': {
    seconds: 1,
    prompt: 'A soft switch click and a gentle flicker of an old screen changing.',
  },

  // Workshop.
  'salyut-assemblies': {
    seconds: 2.3,
    prompt: 'Small metal parts flying onto a circuit board one after another, each clicking softly into place.',
  },
  'salyut-lead': {
    seconds: 1.6,
    prompt: 'A small brass steam whistle giving one soft short toot with a puff of hissing steam.',
  },
  'salyut-macros': {
    seconds: 2.6,
    prompt: 'The pages of an old paper scroll fluttering softly in a breeze.',
  },
  'salyut-projects': {
    seconds: 2.4,
    prompt: 'An old oscilloscope warming up, a soft electric hum with a gentle rising tone.',
  },

  // Arena.
  'olimp-apps': {
    seconds: 3.6,
    prompt: 'Three soft spotlight clunks one after another, then light confetti popping and a sparkly chime.',
  },
  'olimp-iframe': {
    seconds: 2.8,
    prompt: 'A tin-can telephone string tightening, a soft twang and a tinny buzz travelling along the string.',
  },
  'olimp-preact': {
    seconds: 2.6,
    prompt: 'A winged running shoe dashing off, soft feathery wing flaps and a quick airy whoosh.',
  },
  'olimp-virtual': {
    seconds: 2.6,
    prompt: 'A split-flap scoreboard flipping its rows, soft fluttering clicks.',
  },
};

/**
 * The chosen version of each sound, by listening-page name. The music loop is built from
 * music-3 by laying its fading last chord over its opening (see docs/plan/phase-6-polish.md).
 */
const PICKS = {
  wind: 'wind-5',
  music: 'music-loop',
  whoosh: 'whoosh-6',
  rustle: 'rustle-1',
  tap: 'tap-1',
  'home-cat': 'home-cat-6',
  'home-bookshelf': 'home-bookshelf-1',
  'home-mailbox': 'home-mailbox-1',
  'home-lantern': 'home-lantern-14',
  'eco-build': 'eco-build-7',
  'eco-lead': 'eco-lead-9',
  'eco-payments': 'eco-payments-6',
  // A mix made with ffmpeg: kafka-auth-5 (waves) with kafka-auth-8 (gulls) at 70%.
  'kafka-auth': 'kafka-auth-11',
  'mone-account': 'mone-account-7',
  'mone-fsd': 'mone-fsd-1',
  'mone-nextjs': 'mone-nextjs-5',
};

/** Web copies: music in stereo, everything else in mono, at modest bitrates. */
function exportPicks() {
  const dir = 'src/assets/audio';
  mkdirSync(dir, { recursive: true });
  for (const [name, pick] of Object.entries(PICKS)) {
    const stereo = name === 'music';
    const out = `${dir}/${name}.mp3`;
    execFileSync(ffmpeg, [
      '-y', '-v', 'error', '-i', `${OUT}/${pick}.mp3`,
      '-ac', stereo ? '2' : '1', '-b:a', stereo ? '112k' : '64k', out,
    ]);
    console.log(`${pick} -> ${out}`);
  }
}

const key = process.env.ELEVENLABS_API_KEY;
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const nAt = args.indexOf('-n');
const versions = nAt >= 0 ? Number(args[nAt + 1]) : VERSIONS;
const names = flag('--all')
  ? Object.keys(SOUNDS).filter((name) => !existsSync(file(name, 1)))
  : args.filter((a, i) => !a.startsWith('-') && args[i - 1] !== '-n' && args[i - 1] !== '-p');
const pAt = args.indexOf('-p');
const promptOverride = pAt >= 0 ? args[pAt + 1] : undefined;

function file(name, version) {
  return `${RAW}/${name}-${version}.mp3`;
}

/** The next free version number for a sound, so new runs never overwrite earlier picks. */
function nextVersion(name) {
  let v = 1;
  while (existsSync(file(name, v))) v++;
  return v;
}

async function generate(name) {
  const s = SOUNDS[name];
  const request = s.music
    ? {
        url: `${API}/music?output_format=mp3_44100_128`,
        body: { prompt: promptOverride ?? s.prompt, music_length_ms: s.seconds * 1000 },
      }
    : {
        url: `${API}/sound-generation?output_format=mp3_44100_128`,
        body: {
          text: `${promptOverride ?? s.prompt} ${STYLE}`,
          model_id: 'eleven_text_to_sound_v2',
          duration_seconds: s.seconds,
          prompt_influence: 0.5,
          ...(s.loop ? { loop: true } : {}),
        },
      };
  const res = await fetch(request.url, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify(request.body),
  });
  if (!res.ok) throw new Error(`${name}: ${res.status} ${await res.text()}`);
  const out = file(name, nextVersion(name));
  writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  // Report any cost the API sends back, to estimate the rest of a run.
  const cost = [...res.headers].filter(([h]) => /cost|character|credit/i.test(h));
  console.log(`${out}${cost.length ? `  (${cost.map(([h, v]) => `${h}: ${v}`).join(', ')})` : ''}`);
}

/** Measures a file's loudness and loudest peak with ffmpeg. */
function measure(path) {
  const args = ['-hide_banner', '-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'];
  return spawnSync(ffmpeg, args, { encoding: 'utf8' }).stderr;
}

/** Copies every raw file into OUT at one loudness: the same gain throughout, no compression. */
function level() {
  for (const f of readdirSync(RAW).filter((f) => f.endsWith('.mp3'))) {
    const out = `${OUT}/${f}`;
    if (existsSync(out)) continue;
    const stats = measure(`${RAW}/${f}`);
    const summary = stats.slice(stats.lastIndexOf('Summary:'));
    const loudness = Number(/I:\s+(-?[\d.]+) LUFS/.exec(summary)?.[1]);
    const peak = Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(summary)?.[1]);
    const gain = Math.min(LOUDNESS - loudness, PEAK - peak);
    execFileSync(ffmpeg, ['-y', '-v', 'error', '-i', `${RAW}/${f}`, '-af', `volume=${gain.toFixed(1)}dB`, '-b:a', '128k', out]);
    console.log(`${f}: ${loudness} LUFS, peak ${peak} dBFS -> gain ${gain.toFixed(1)} dB`);
  }
}

/** A plain page with a player for every generated file, grouped by sound. */
function writePage() {
  const files = readdirSync(OUT).filter((f) => f.endsWith('.mp3'));
  const rows = Object.keys(SOUNDS)
    .map((name) => {
      const mine = files
        .filter((f) => f.startsWith(`${name}-`))
        .sort((a, b) => parseInt(a.slice(name.length + 1)) - parseInt(b.slice(name.length + 1)));
      if (!mine.length) return '';
      const players = mine
        .map((f) => `<figure><figcaption>${f.replace('.mp3', '')}</figcaption><audio controls preload="none" src="${f}"${SOUNDS[name].loop || SOUNDS[name].music ? ' loop' : ''}></audio></figure>`)
        .join('');
      return `<section><h2>${name}</h2><p>${SOUNDS[name].prompt}</p><div>${players}</div></section>`;
    })
    .join('');
  writeFileSync(
    `${OUT}/listen.html`,
    `<!doctype html><meta charset="utf-8"><title>Sky Islands sounds</title>
<style>body{font:15px system-ui;margin:24px;max-width:1100px;background:#fbf7ef;color:#3b2f2a}
section{border-bottom:1px solid #e3d9c8;padding:10px 0}h2{margin:0 0 2px}p{margin:0 0 8px;color:#7a6a5d}
div{display:flex;flex-wrap:wrap;gap:12px}figure{margin:0}figcaption{font-size:13px}</style>
<h1>Sky Islands sounds</h1><p>Play each version and note the best one per sound. Loops repeat. Every file is levelled to the same loudness.</p>${rows}`,
  );
  console.log(`page: ${OUT}/listen.html`);
}

mkdirSync(RAW, { recursive: true });
if (flag('--export')) {
  exportPicks();
  process.exit(0);
}
if (!flag('--page')) {
  if (!key) throw new Error('Set ELEVENLABS_API_KEY in the environment first.');
  const unknown = names.filter((n) => !SOUNDS[n]);
  if (unknown.length) throw new Error(`Unknown sounds: ${unknown.join(', ')}`);
  if (!names.length) throw new Error('Name some sounds, or pass --all.');
  for (const name of names) {
    for (let i = 0; i < versions; i++) {
      try {
        await generate(name);
      } catch (e) {
        // One failure (say, a missing API permission) shouldn't stop the rest of the run.
        console.error(e.message);
        break;
      }
    }
  }
}
level();
writePage();
