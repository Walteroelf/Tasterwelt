/*
  Klang und Sprache.

  Alle Klänge werden im Gerät erzeugt (Web Audio) – keine Dateien, offline.
  Damit sie nicht nach "Piep" klingen:
  - Instrumente aus mehreren Teiltönen (Marimba, Glocke, weiche Flächen)
  - alles läuft durch einen Raumhall und einen sanften Begrenzer
  - Geräusche (Platzen, Klicken, Rauschen) aus gefiltertem Rauschen

  iOS erlaubt Ton erst nach einer Berührung oder einem Tastendruck –
  unlockAudio() wird beim Start einer Übung aufgerufen.
*/

let audioContext = null;
let master = null;
let reverbSend = null;
let noiseBuffer = null;
let currentVoiceAudio = null;
let germanVoice = null;

function getAudio() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
    buildMixer(audioContext);
  }
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

/* Begrenzer am Ausgang, Hall als Nebenweg */
function buildMixer(ctx) {
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -10;
  limiter.ratio.value = 6;
  limiter.connect(ctx.destination);

  master = ctx.createGain();
  master.gain.value = 0.8;
  master.connect(limiter);

  const convolver = ctx.createConvolver();
  convolver.buffer = makeImpulse(ctx, 2.6);
  const wet = ctx.createGain();
  wet.gain.value = 0.32;
  convolver.connect(wet).connect(limiter);

  reverbSend = convolver;
}

/* Künstlicher Raum: abklingendes Rauschen in Stereo */
function makeImpulse(ctx, seconds) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3.2);
    }
  }
  return buffer;
}

function unlockAudio() {
  const ctx = getAudio();

  if (ctx) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  if ("speechSynthesis" in window && !unlockAudio.speechDone) {
    unlockAudio.speechDone = true;
    const silent = new SpeechSynthesisUtterance(" ");
    silent.volume = 0;
    speechSynthesis.speak(silent);
  }
}

function soundsOn() {
  return settings.sounds;
}

/* Ausgang für ein Klangteil: trocken + Hallanteil */
function output(ctx, node, reverb = 0.5) {
  node.connect(master);
  if (reverb > 0) {
    const send = ctx.createGain();
    send.gain.value = reverb;
    node.connect(send).connect(reverbSend);
  }
}

function getNoise(ctx) {
  if (noiseBuffer) return noiseBuffer;
  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

/* Ein Teilton mit Hüllkurve */
function partial(freq, { start = 0, duration = 1, type = "sine", volume = 0.2, attack = 0.005, slideTo = null, reverb = 0.5 } = {}) {
  const ctx = getAudio();
  if (!ctx) return;

  const t = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration * 0.6);

  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  osc.connect(gain);
  output(ctx, gain, reverb);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

/* Gefiltertes Rauschen */
function noise({ start = 0, duration = 0.3, volume = 0.3, filter = "lowpass", freq = 1000, freqTo = null, q = 1, attack = 0.002, reverb = 0.3 } = {}) {
  const ctx = getAudio();
  if (!ctx) return;

  const t = ctx.currentTime + start;
  const source = ctx.createBufferSource();
  source.buffer = getNoise(ctx);
  source.loop = true;

  const biquad = ctx.createBiquadFilter();
  biquad.type = filter;
  biquad.Q.value = q;
  biquad.frequency.setValueAtTime(freq, t);
  if (freqTo) biquad.frequency.exponentialRampToValueAtTime(freqTo, t + duration);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  source.connect(biquad).connect(gain);
  output(ctx, gain, reverb);
  source.start(t, Math.random());
  source.stop(t + duration + 0.05);
}

/* Noten als Frequenz: midi(60) = C4 */
function midi(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

/* ---------- Instrumente ---------- */

/* Marimba: Grundton + Teilton bei ~4x, kurzer Anschlag */
function marimba(note, start = 0, volume = 0.22) {
  const f = midi(note);
  partial(f, { start, duration: 1.4, volume, reverb: 0.45 });
  partial(f * 3.93, { start, duration: 0.18, volume: volume * 0.25, reverb: 0.3 });
  partial(f * 10.1, { start, duration: 0.05, volume: volume * 0.08, reverb: 0 });
}

/* Glocke: unharmonische Teiltöne, langes Ausklingen */
function bell(note, start = 0, volume = 0.12) {
  const f = midi(note);
  [[1, 1, 3.2], [2.76, 0.45, 2.2], [5.4, 0.22, 1.2], [8.9, 0.1, 0.6]].forEach(([ratio, vol, dur]) => {
    partial(f * ratio, { start, duration: dur, volume: volume * vol, reverb: 0.7 });
  });
}

/* Weiche Fläche aus leicht verstimmten Sägezähnen hinter einem Tiefpass – läuft bis stop() */
function pad(notes, { volume = 0.07, attack = 0.8, cutoff = 900 } = {}) {
  const ctx = soundsOn() ? getAudio() : null;
  if (!ctx) return { stop() {}, swell() {} };

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  filter.Q.value = 0.7;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + attack);

  filter.connect(gain);
  output(ctx, gain, 0.8);

  const oscs = [];
  notes.forEach(note => {
    [-7, 7].forEach(detune => {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = midi(note);
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start();
      oscs.push(osc);
    });
  });

  return {
    /* Heller werden lassen (z. B. beim Halten) */
    swell(level) {
      const t = ctx.currentTime;
      filter.frequency.cancelScheduledValues(t);
      filter.frequency.setTargetAtTime(cutoff + level * 2200, t, 0.3);
    },
    stop(release = 1.2) {
      const t = ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + release);
      oscs.forEach(osc => osc.stop(t + release + 0.1));
    }
  };
}

/* Ruhige Akkordfolge für "Musik" und Begleitung: Cmaj7 – Am7 – Fmaj7 – G6 */
const CHORDS = [
  { bass: 36, notes: [60, 64, 67, 71] },
  { bass: 33, notes: [57, 60, 64, 67] },
  { bass: 29, notes: [57, 60, 64, 65] },
  { bass: 31, notes: [55, 59, 62, 64] }
];

const PENTATONIC = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84];

const Sounds = {
  /* Aufpumpen: Luftzischen, wird mit dem Ballon höher */
  pump(progress) {
    if (!soundsOn()) return;
    noise({ duration: 0.35, volume: 0.22, filter: "bandpass", freq: 500 + progress * 1400, freqTo: 1200 + progress * 2600, q: 1.6, attack: 0.05, reverb: 0.2 });
  },

  /* Platzen: kurzer heller Knall mit Körper */
  pop() {
    if (!soundsOn()) return;
    noise({ duration: 0.09, volume: 0.9, filter: "highpass", freq: 900, reverb: 0.6 });
    noise({ duration: 0.25, volume: 0.5, filter: "lowpass", freq: 1200, freqTo: 200, reverb: 0.4 });
    partial(150, { duration: 0.18, volume: 0.35, slideTo: 55, reverb: 0.3 });
  },

  /* Dominostein wird aufgestellt */
  place(i) {
    if (!soundsOn()) return;
    noise({ duration: 0.05, volume: 0.35, filter: "bandpass", freq: 2400, q: 3, reverb: 0.2 });
    marimba(PENTATONIC[i % PENTATONIC.length], 0.01, 0.12);
  },

  /* Dominostein fällt: trockenes Klacken */
  clack() {
    if (!soundsOn()) return;
    noise({ duration: 0.04, volume: 0.5, filter: "bandpass", freq: 3200 + Math.random() * 800, q: 5, reverb: 0.25 });
    partial(700 + Math.random() * 150, { duration: 0.04, volume: 0.08, reverb: 0 });
  },

  /* Rakete tanken: tiefes Grollen */
  rumble() {
    if (!soundsOn()) return;
    noise({ duration: 0.6, volume: 0.35, filter: "lowpass", freq: 260, freqTo: 120, attack: 0.04, reverb: 0.3 });
  },

  liftoff() {
    if (!soundsOn()) return;
    noise({ duration: 2.6, volume: 0.55, filter: "lowpass", freq: 180, freqTo: 1400, attack: 0.3, reverb: 0.5 });
    noise({ duration: 2.4, volume: 0.15, filter: "bandpass", freq: 600, freqTo: 3000, q: 0.8, attack: 0.5, reverb: 0.6 });
  },

  /* Feuerwerk: Aufsteigen, Knall, Knistern */
  launch() {
    if (!soundsOn()) return;
    noise({ duration: 0.6, volume: 0.12, filter: "bandpass", freq: 800, freqTo: 4000, q: 2, attack: 0.2, reverb: 0.4 });
  },

  burst() {
    if (!soundsOn()) return;
    noise({ duration: 1.4, volume: 0.6, filter: "lowpass", freq: 1500, freqTo: 90, reverb: 0.8 });
    for (let i = 0; i < 14; i++) {
      noise({ start: 0.25 + Math.random() * 0.9, duration: 0.03, volume: 0.15 + Math.random() * 0.15, filter: "highpass", freq: 3000, reverb: 0.5 });
    }
  },

  /* Wassertropfen: kurzer, nach oben gleitender Ton */
  drop() {
    if (!soundsOn()) return;
    const base = 500 + Math.random() * 300;
    partial(base, { duration: 0.22, volume: 0.25, slideTo: base * 2.4, reverb: 0.9 });
    noise({ start: 0.02, duration: 0.5, volume: 0.05, filter: "bandpass", freq: 1800, q: 0.6, attack: 0.05, reverb: 0.6 });
  },

  /* Aufdecken: Marimba, mit jedem Feld etwas höher */
  tick(i) {
    if (!soundsOn()) return;
    marimba(PENTATONIC[i % PENTATONIC.length], 0, 0.2);
  },

  /* Bild ist frei: Glockenakkord */
  revealed() {
    if (!soundsOn()) return;
    [72, 76, 79, 83].forEach((n, i) => bell(n, i * 0.08, 0.1));
  },

  /* Seite umblättern: sehr leises Wischen */
  page() {
    if (!soundsOn()) return;
    noise({ duration: 0.35, volume: 0.05, filter: "bandpass", freq: 3000, freqTo: 1200, q: 0.7, attack: 0.08, reverb: 0.3 });
  },

  /* Ende einer Geschichte */
  ending() {
    if (!soundsOn()) return;
    [60, 67, 72, 76].forEach((n, i) => marimba(n, i * 0.18, 0.16));
  },

  /* Überraschung */
  appear() {
    if (!soundsOn()) return;
    const root = PENTATONIC[Math.floor(Math.random() * 5)];
    marimba(root, 0, 0.16);
    marimba(root + 7, 0.09, 0.14);
    bell(root + 12, 0.18, 0.06);
  },

  remind() {
    if (!soundsOn()) return;
    marimba(76, 0, 0.1);
    marimba(72, 0.25, 0.1);
  },

  /* Ein Akkord: Bass + Arpeggio, sanft angeschlagen */
  chord(index, { arpeggio = true } = {}) {
    if (!soundsOn()) return;
    const chord = CHORDS[index % CHORDS.length];
    partial(midi(chord.bass), { duration: 2.2, volume: 0.2, attack: 0.02, reverb: 0.3 });
    chord.notes.forEach((n, i) => marimba(n, arpeggio ? i * 0.11 : 0, 0.13));
  },

  /* Einzelner Ton aus einem Akkord (Halten-Modus) */
  chordNote(index, step) {
    if (!soundsOn()) return;
    const chord = CHORDS[index % CHORDS.length];
    if (step % 4 === 0) partial(midi(chord.bass), { duration: 1.6, volume: 0.16, attack: 0.02, reverb: 0.3 });
    marimba(chord.notes[step % 4] + (step % 8 >= 4 ? 12 : 0), 0, 0.13);
  }
};

/* ---------- Sprache ---------- */

function pickGermanVoice() {
  if (!("speechSynthesis" in window)) return;
  const voices = speechSynthesis.getVoices().filter(v => v.lang && v.lang.toLowerCase().startsWith("de"));
  germanVoice =
    voices.find(v => /premium|enhanced|erweitert/i.test(v.name)) ||
    voices.find(v => v.lang === "de-DE") ||
    voices[0] ||
    null;
}

if ("speechSynthesis" in window) {
  pickGermanVoice();
  speechSynthesis.addEventListener?.("voiceschanged", pickGermanVoice);
}

function speak(text) {
  return new Promise(resolve => {
    if (!text || !settings.speech || !("speechSynthesis" in window)) return resolve();

    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    if (germanVoice) utterance.voice = germanVoice;
    utterance.rate = Number(settings.rate) || 0.85;

    // Falls "end" nie kommt (kommt unter iOS manchmal vor)
    const fallback = setTimeout(resolve, 1500 + text.length * 120);
    utterance.onend = utterance.onerror = () => {
      clearTimeout(fallback);
      resolve();
    };

    speechSynthesis.speak(utterance);
  });
}

function playBlob(blob) {
  return new Promise(resolve => {
    stopVoice();
    const audio = new Audio(blobUrl(blob));
    currentVoiceAudio = audio;
    audio.onended = audio.onerror = () => resolve();
    audio.play().catch(() => resolve());
  });
}

/* Seite "vorlesen": eigene Aufnahme hat Vorrang vor der Gerätestimme */
function sayPage(page) {
  if (page.audio) return playBlob(page.audio);
  return speak(page.text);
}

function stopVoice() {
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  if (currentVoiceAudio) {
    currentVoiceAudio.pause();
    currentVoiceAudio = null;
  }
}
