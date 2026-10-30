/*
  Ton und Sprache.

  - Geräusche (Pumpen, Platzen, Feuerwerk, Xylophon …) werden mit Web Audio
    erzeugt – es gibt keine Sounddateien, alles funktioniert offline.
  - Sprache: eigene Aufnahme der Seite, sonst die deutsche Gerätestimme.
  - iOS erlaubt Ton erst nach einer Berührung oder einem Tastendruck.
    unlockAudio() wird deshalb beim Start einer Übung aufgerufen.
*/

let audioContext = null;
let noiseBuffer = null;
let currentVoiceAudio = null;
let germanVoice = null;

function getAudio() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function unlockAudio() {
  const ctx = getAudio();

  // Ein stiller Ton schaltet den Lautsprecher unter iOS frei
  if (ctx) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  // Auch die Sprachausgabe muss unter iOS einmal "angestoßen" werden
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

function getNoise(ctx) {
  if (noiseBuffer) return noiseBuffer;
  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

/* Ein einzelner Ton mit Hüllkurve */
function tone(freq, { start = 0, duration = 0.3, type = "sine", volume = 0.25, slideTo = null, attack = 0.01 } = {}) {
  const ctx = getAudio();
  if (!ctx) return;

  const t = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);

  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

/* Rauschen durch einen Filter – für Platzen, Knallen, Pumpen */
function noise({ start = 0, duration = 0.3, volume = 0.4, filter = "lowpass", freq = 1000, freqTo = null, q = 1 } = {}) {
  const ctx = getAudio();
  if (!ctx) return;

  const t = ctx.currentTime + start;
  const source = ctx.createBufferSource();
  source.buffer = getNoise(ctx);

  const biquad = ctx.createBiquadFilter();
  biquad.type = filter;
  biquad.Q.value = q;
  biquad.frequency.setValueAtTime(freq, t);
  if (freqTo) biquad.frequency.exponentialRampToValueAtTime(freqTo, t + duration);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  source.connect(biquad).connect(gain).connect(ctx.destination);
  source.start(t);
  source.stop(t + duration + 0.05);
}

const NOTE = { C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, G4: 392.0, A4: 440.0, H4: 493.9, C5: 523.3 };

const Sounds = {
  pump(progress) {
    if (!soundsOn()) return;
    noise({ duration: 0.35, volume: 0.35, filter: "bandpass", freq: 300 + progress * 900, freqTo: 900 + progress * 1800, q: 2 });
    tone(180 + progress * 300, { duration: 0.3, type: "triangle", volume: 0.12, slideTo: 260 + progress * 400 });
  },

  pop() {
    if (!soundsOn()) return;
    noise({ duration: 0.25, volume: 0.9, filter: "highpass", freq: 600 });
    tone(140, { duration: 0.25, type: "sine", volume: 0.5, slideTo: 50 });
  },

  bang() {
    if (!soundsOn()) return;
    noise({ duration: 1.1, volume: 0.6, filter: "lowpass", freq: 1800, freqTo: 120 });
    tone(90, { duration: 0.5, volume: 0.35, slideTo: 40 });
  },

  whistle() {
    if (!soundsOn()) return;
    tone(500, { duration: 0.55, type: "sine", volume: 0.1, slideTo: 1500, attack: 0.05 });
  },

  knock() {
    if (!soundsOn()) return;
    tone(320 + Math.random() * 80, { duration: 0.18, type: "triangle", volume: 0.4, slideTo: 180 });
    noise({ duration: 0.06, volume: 0.3, filter: "bandpass", freq: 2000, q: 3 });
  },

  crash() {
    if (!soundsOn()) return;
    for (let i = 0; i < 6; i++) {
      tone(200 - i * 20, { start: i * 0.09, duration: 0.25, type: "triangle", volume: 0.35, slideTo: 80 });
      noise({ start: i * 0.09, duration: 0.15, volume: 0.25, filter: "bandpass", freq: 900, q: 2 });
    }
  },

  rumble() {
    if (!soundsOn()) return;
    noise({ duration: 0.5, volume: 0.45, filter: "lowpass", freq: 300, freqTo: 120 });
  },

  liftoff() {
    if (!soundsOn()) return;
    noise({ duration: 2.2, volume: 0.6, filter: "lowpass", freq: 250, freqTo: 1600 });
    tone(80, { duration: 2, type: "sawtooth", volume: 0.08, slideTo: 300, attack: 0.3 });
  },

  splat() {
    if (!soundsOn()) return;
    noise({ duration: 0.22, volume: 0.6, filter: "lowpass", freq: 900, freqTo: 150 });
    tone(260 + Math.random() * 200, { duration: 0.25, type: "sine", volume: 0.2, slideTo: 90 });
  },

  chime() {
    if (!soundsOn()) return;
    const notes = [NOTE.C5, NOTE.D4 * 2, NOTE.E4 * 2, NOTE.G4 * 2, NOTE.A4 * 2];
    const f = notes[Math.floor(Math.random() * notes.length)];
    tone(f, { duration: 0.6, volume: 0.2 });
    tone(f * 2, { duration: 0.3, volume: 0.06 });
  },

  page() {
    if (!soundsOn()) return;
    noise({ duration: 0.25, volume: 0.18, filter: "bandpass", freq: 2500, freqTo: 900, q: 0.8 });
  },

  fanfare() {
    if (!soundsOn()) return;
    [NOTE.C4 * 2, NOTE.E4 * 2, NOTE.G4 * 2, NOTE.C5 * 2].forEach((f, i) => {
      tone(f, { start: i * 0.13, duration: i === 3 ? 0.7 : 0.2, type: "triangle", volume: 0.22 });
    });
  },

  /* Xylophon: Grundton plus leiser Oberton, schnell ausklingend */
  xylo(freq) {
    if (!soundsOn()) return;
    tone(freq * 2, { duration: 0.9, type: "sine", volume: 0.35 });
    tone(freq * 8, { duration: 0.15, type: "sine", volume: 0.05 });
  },

  remind() {
    if (!soundsOn()) return;
    tone(NOTE.E4 * 2, { duration: 0.35, volume: 0.12 });
    tone(NOTE.C4 * 2, { start: 0.3, duration: 0.5, volume: 0.12 });
  },

  /* Ein Klang, der so lange läuft, bis stop() aufgerufen wird (Lichter im Halten-Modus) */
  hum() {
    const ctx = soundsOn() ? getAudio() : null;
    if (!ctx) return { stop() {} };

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.3);
    gain.connect(ctx.destination);

    const oscs = [NOTE.C4, NOTE.E4, NOTE.G4].map((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      osc.detune.value = i * 4;
      osc.connect(gain);
      osc.start();
      return osc;
    });

    return {
      stop() {
        const t = ctx.currentTime;
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
        oscs.forEach(osc => osc.stop(t + 0.45));
      }
    };
  }
};

/* ---------- Sprache ---------- */

function pickGermanVoice() {
  if (!("speechSynthesis" in window)) return;
  const voices = speechSynthesis.getVoices().filter(v => v.lang && v.lang.toLowerCase().startsWith("de"));
  // Bevorzugt eine "erweiterte" oder "Premium"-Stimme, falls installiert
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
