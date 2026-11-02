/*
  Klang und Sprache.

  Klänge: echte Aufnahmen in klang/ (Marimba, Vibraphon, Handglocken,
  Weingläser, Ocean Drum, Holz, Raketenstart, Feuerwerk – Quellen in
  klang/LIZENZ.md). Sie werden beim Start einer Übung einmal geladen und
  über Web Audio abgespielt; Tonhöhen entstehen durch schnelleres oder
  langsameres Abspielen der nächstliegenden Aufnahme.

  Sprache, in dieser Reihenfolge:
  1. eigene Aufnahme der Seite
  2. natürliche Stimme (Thorsten) für die Texte der Vorlagen, siehe stimme/
  3. Gerätestimme – die Lehrkraft kann in den Einstellungen eine wählen

  iOS erlaubt Ton erst nach einer Berührung oder einem Tastendruck –
  unlockAudio() wird beim Start einer Übung aufgerufen.
*/

let audioContext = null;
let master = null;
let reverbSend = null;
let currentVoiceAudio = null;

const buffers = {};
let loading = null;

const ALL_CLIPS = [...Object.values(INSTRUMENTS).flatMap(Object.keys), ...EFFECT_CLIPS];

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

/* Sanfter Begrenzer am Ausgang, etwas Raumhall als Nebenweg */
function buildMixer(ctx) {
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -8;
  limiter.ratio.value = 4;
  limiter.connect(ctx.destination);

  master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(limiter);

  const convolver = ctx.createConvolver();
  convolver.buffer = makeImpulse(ctx, 2.2);
  const wet = ctx.createGain();
  wet.gain.value = 0.22;
  convolver.connect(wet).connect(limiter);
  reverbSend = convolver;
}

function makeImpulse(ctx, seconds) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3.5);
  }
  return buffer;
}

/* Alle Klänge einmal laden (danach kommen sie aus dem Offline-Speicher) */
function loadSounds() {
  const ctx = getAudio();
  if (!ctx || loading) return loading;

  loading = Promise.all(ALL_CLIPS.map(async name => {
    try {
      const response = await fetch("klang/" + name + ".m4a");
      const data = await response.arrayBuffer();
      buffers[name] = await new Promise((resolve, reject) => ctx.decodeAudioData(data, resolve, reject));
    } catch (error) {
      console.warn("Klang fehlt:", name, error);
    }
  }));
  return loading;
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
    loadSounds();
  }

  if ("speechSynthesis" in window && !unlockAudio.speechDone) {
    unlockAudio.speechDone = true;
    const silent = new SpeechSynthesisUtterance(" ");
    silent.volume = 0;
    speechSynthesis.speak(silent);
  }
}

/* Eine Aufnahme abspielen. Gibt ein Objekt mit stop() zurück. */
function play(name, { start = 0, rate = 1, volume = 1, reverb = 0.3, offset = 0, duration = null, fadeIn = 0 } = {}) {
  const ctx = settings.sounds ? getAudio() : null;
  const buffer = buffers[name];
  if (!ctx || !buffer) return { stop() {} };

  const t = ctx.currentTime + start;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = rate;

  const gain = ctx.createGain();
  if (fadeIn > 0) {
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + fadeIn);
  } else {
    gain.gain.setValueAtTime(volume, t);
  }

  if (duration) {
    gain.gain.setValueAtTime(volume, t + Math.max(0, duration - 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  }

  source.connect(gain);
  gain.connect(master);
  if (reverb > 0) {
    const send = ctx.createGain();
    send.gain.value = reverb;
    gain.connect(send).connect(reverbSend);
  }

  source.start(t, offset);
  if (duration) source.stop(t + duration + 0.05);

  return {
    stop(release = 0.6) {
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + release);
      try { source.stop(now + release + 0.05); } catch (error) { /* schon beendet */ }
    }
  };
}

/* Ton eines Instruments in beliebiger Höhe: nächstliegende Aufnahme, umgestimmt */
function note(instrument, midiNote, options = {}) {
  const samples = INSTRUMENTS[instrument];
  let best = null;
  for (const [name, root] of Object.entries(samples)) {
    if (!best || Math.abs(root - midiNote) < Math.abs(best[1] - midiNote)) best = [name, root];
  }
  return play(best[0], { ...options, rate: Math.pow(2, (midiNote - best[1]) / 12) });
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

/* Ruhige Akkordfolge für "Musik": Cmaj7 – Am7 – Fmaj7 – G6 */
const CHORDS = [
  { bass: 36, notes: [60, 64, 67, 71] },
  { bass: 33, notes: [57, 60, 64, 67] },
  { bass: 41, notes: [57, 60, 64, 65] },
  { bass: 43, notes: [55, 59, 62, 64] }
];

const PENTATONIC = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84];

const Sounds = {
  /* Ballon aufpumpen: Luftgeräusch, wird mit dem Ballon höher */
  pump(progress) {
    play("luft", { rate: 0.75 + progress * 0.7, volume: 0.7, reverb: 0.1 });
  },

  pop() {
    play("knall", { volume: 1, reverb: 0.35 });
    play("luft", { start: 0.02, rate: 1.8, volume: 0.35, reverb: 0.2 });
  },

  /* Dominostein aufstellen: Holzblock, Stein für Stein etwas höher */
  place(i) {
    play("holz", { rate: 0.85 + (i % 10) * 0.035, volume: 0.8, reverb: 0.15 });
  },

  /* Dominostein fällt: Claves */
  clack() {
    play("klack", { rate: 0.9 + Math.random() * 0.25, volume: 0.75, reverb: 0.15 });
  },

  /* Rakete tanken: ein kurzes Stück Triebwerksgrollen */
  rumble() {
    play("rakete", { offset: 1.2 + Math.random(), duration: 0.8, volume: 0.6, fadeIn: 0.08, reverb: 0.1 });
  },

  liftoff() {
    play("rakete", { volume: 1, fadeIn: 0.4, reverb: 0.2 });
  },

  launch() {
    play("luft", { rate: 1.6, volume: 0.35, reverb: 0.4 });
  },

  burst() {
    play(pick(["feuerwerk-1", "feuerwerk-2", "feuerwerk-3"]), { volume: 0.9, reverb: 0.3 });
  },

  /* Wellen: Tropfen (Kalimba) und ein Hauch Meeresrauschen */
  drop() {
    play(pick(["tropfen-1", "tropfen-2", "tropfen-3", "tropfen-4"]), { volume: 0.7, reverb: 0.6 });
    play("meer", { start: 0.05, offset: Math.random() * 1.5, duration: 2.2, volume: 0.35, fadeIn: 0.3, reverb: 0.2 });
  },

  /* Aufdecken: Marimba, mit jedem Feld etwas höher */
  tick(i) {
    note("marimba", PENTATONIC[i % PENTATONIC.length], { volume: 0.8, reverb: 0.3 });
  },

  /* Bild ist frei: Handglocken */
  revealed() {
    note("chime", 72, { volume: 0.6, reverb: 0.5 });
    note("chime", 76, { start: 0.12, volume: 0.55, reverb: 0.5 });
    note("chime", 79, { start: 0.24, volume: 0.5, reverb: 0.5 });
  },

  page() {
    play("luft", { rate: 2.2, volume: 0.12, reverb: 0.2 });
  },

  ending() {
    play("glocke-c4", { volume: 0.7, reverb: 0.5 });
  },

  appear() {
    play("glitzer", { volume: 0.45, reverb: 0.4 });
    note("vibes", pick([67, 69, 72, 74]), { volume: 0.6, reverb: 0.4 });
  },

  remind() {
    note("chime", 76, { volume: 0.35, reverb: 0.5 });
  },

  /* Ein Akkord auf dem Vibraphon, Bass auf der Marimba */
  chord(index) {
    const chord = CHORDS[index % CHORDS.length];
    note("marimba", chord.bass, { volume: 0.7, reverb: 0.2 });
    chord.notes.forEach((n, i) => note("vibes", n, { start: i * 0.09, volume: 0.55, reverb: 0.35 }));
  },

  /* Einzelner Ton aus einem Akkord (Halten-Modus) */
  chordNote(index, step) {
    const chord = CHORDS[index % CHORDS.length];
    if (step % 4 === 0) note("marimba", chord.bass, { volume: 0.6, reverb: 0.2 });
    note("vibes", chord.notes[step % 4] + (step % 8 >= 4 ? 12 : 0), { volume: 0.55, reverb: 0.35 });
  },

  /* Polarlicht und Lavalampe: gestrichene Weingläser, auf C-Dur gestimmt */
  glow(low = false) {
    const shift = low ? -12 : 0;
    const voices = [
      play("glas-1", { rate: Math.pow(2, (-3 + shift) / 12), volume: 0.5, fadeIn: 0.4, reverb: 0.6 }),
      play("glas-2", { start: 0.25, rate: Math.pow(2, (-2 + shift) / 12), volume: 0.42, fadeIn: 0.5, reverb: 0.6 }),
      play("glas-3", { start: 0.5, rate: Math.pow(2, (-3 + shift) / 12), volume: 0.38, fadeIn: 0.6, reverb: 0.6 })
    ];
    return { stop(release = 1.5) { voices.forEach(v => v.stop(release)); } };
  }
};

/* ---------- Sprache ---------- */

let germanVoices = [];

function loadVoices() {
  if (!("speechSynthesis" in window)) return;
  germanVoices = speechSynthesis.getVoices()
    .filter(v => v.lang && v.lang.toLowerCase().startsWith("de"))
    // Bessere Stimmen (Premium, Erweitert, Siri) zuerst
    .sort((a, b) => voiceRank(b) - voiceRank(a));
  if (typeof renderVoiceOptions === "function") renderVoiceOptions();
}

function voiceRank(v) {
  if (/premium/i.test(v.name)) return 3;
  if (/enhanced|erweitert|siri/i.test(v.name)) return 2;
  if (/eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley/i.test(v.name)) return 0;   // Spaßstimmen
  return 1;
}

function deviceVoice() {
  return germanVoices.find(v => v.name === settings.voiceName) || germanVoices[0] || null;
}

if ("speechSynthesis" in window) {
  loadVoices();
  speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
}

/* Schlüssel für vorab erzeugte Texte – muss zu key() in scripts/stimme.py passen */
function voiceKey(text) {
  return text.replace(/\s+/g, " ").trim().replace(/[.!]+$/, "").trim();
}

function speakDevice(text) {
  return new Promise(resolve => {
    if (!("speechSynthesis" in window)) return resolve();

    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    const voice = deviceVoice();
    if (voice) utterance.voice = voice;
    utterance.rate = Number(settings.rate) || 0.9;

    // Falls "end" nie kommt (kommt unter iOS manchmal vor)
    const fallback = setTimeout(resolve, 1500 + text.length * 120);
    utterance.onend = utterance.onerror = () => {
      clearTimeout(fallback);
      resolve();
    };

    speechSynthesis.speak(utterance);
  });
}

function playUrl(url, rate = 1) {
  return new Promise(resolve => {
    stopVoice();
    const audio = new Audio(url);
    audio.preservesPitch = true;
    audio.playbackRate = rate;
    currentVoiceAudio = audio;
    audio.onended = audio.onerror = () => resolve();
    audio.play().catch(() => resolve());
  });
}

function speak(text) {
  if (!text || !settings.speech) return Promise.resolve();

  const clip = settings.naturalVoice && typeof VOICE_CLIPS !== "undefined" ? VOICE_CLIPS[voiceKey(text)] : null;
  // Sprechtempo auch für die Thorsten-Stimme – ohne sie höher oder tiefer zu machen
  if (clip) return playUrl("stimme/" + clip + ".m4a", Math.min(1, (Number(settings.rate) || 0.9) / 0.9));

  return speakDevice(text);
}

function playBlob(blob) {
  return playUrl(blobUrl(blob));
}

/* Seite "vorlesen": eigene Aufnahme hat Vorrang */
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
