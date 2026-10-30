/*
  Baustein 4: Effekt – jeder Druck löst sofort etwas aus.

  - Feuerwerk:   eine Rakete steigt auf und explodiert
  - Farbkleckse: ein bunter Klecks erscheint, bis das Bild voll ist
  - Musik:       Ton für Ton "Alle meine Entchen" auf dem Xylophon
  - Lichter:     bunte Lichter leuchten
  - Überraschung (eigene Sammlung): ein zufälliges Bild springt herein

  Halten-Modus (Einstellungen → Effekt): Feuerwerk, Musik und Lichter laufen
  nur, solange der Taster gedrückt bleibt.
*/

const XYLO_NOTES = ["C4", "D4", "E4", "F4", "G4", "A4", "H4", "C5"];
const XYLO_COLORS = ["#e63946", "#f4a261", "#f2b531", "#8ac926", "#2a9d8f", "#3d7ab8", "#9b5de5", "#f15bb5"];

/* Alle meine Entchen – Silbe und Ton, Zeile für Zeile */
const SONG = [
  [["Al-", "C4"], ["le ", "D4"], ["mei-", "E4"], ["ne ", "F4"], ["Ent-", "G4"], ["chen", "G4"]],
  [["schwim-", "A4"], ["men ", "A4"], ["auf ", "A4"], ["dem ", "A4"], ["See,", "G4"]],
  [["schwim-", "A4"], ["men ", "A4"], ["auf ", "A4"], ["dem ", "A4"], ["See.", "G4"]],
  [["Köpf-", "F4"], ["chen ", "F4"], ["in ", "F4"], ["das ", "F4"], ["Was-", "E4"], ["ser,", "E4"]],
  [["Schwänz-", "D4"], ["chen ", "D4"], ["in ", "D4"], ["die ", "D4"], ["Höh.", "C4"]]
];

function createEffectGame(variant, collection) {
  let stage = null;
  let wrap = null;
  let holdTimer = null;
  let holding = false;
  const timers = [];

  function later(fn, ms) {
    timers.push(setTimeout(fn, ms));
  }

  function removeHint() {
    wrap.querySelector(".press-hint")?.remove();
  }

  /* Wiederholt eine Aktion, solange der Taster gehalten wird */
  function repeatWhileHeld(action, interval) {
    action();
    if (!settings.hold) return;
    holding = true;
    clearInterval(holdTimer);
    holdTimer = setInterval(() => { if (holding) action(); }, interval);
  }

  function stopHold() {
    holding = false;
    clearInterval(holdTimer);
  }

  /* ---------- Feuerwerk ---------- */

  function fireworkSetup() {
    wrap.classList.add("night");
    wrap.innerHTML = `<div class="press-hint">Drück den Taster!</div>`;
  }

  function launchFirework() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const x = w * (0.15 + Math.random() * 0.7);
    const y = h * (0.15 + Math.random() * 0.35);
    Sounds.whistle();
    Fx.rocket(x, y, (bx, by) => {
      Fx.firework(bx, by);
      Sounds.bang();
    });
  }

  /* ---------- Farbkleckse ---------- */

  let blobs = [];

  function blobSetup() {
    wrap.innerHTML = `<div class="press-hint">Drück den Taster!</div>`;
    blobs = [];
  }

  function addBlob() {
    if (blobs.length >= 14) {
      // Bild ist voll: alles verblasst, dann geht es von vorn los
      blobs.forEach(b => { b.style.opacity = "0"; });
      const old = blobs;
      blobs = [];
      later(() => old.forEach(b => b.remove()), 900);
    }

    const size = 16 + Math.random() * 18;   // vmin
    const blob = document.createElement("div");
    blob.className = "blob";
    blob.style.width = size + "vmin";
    blob.style.height = size * (0.8 + Math.random() * 0.4) + "vmin";
    blob.style.left = `calc(${Math.random() * 100}% - ${size / 2}vmin)`;
    blob.style.top = `calc(${8 + Math.random() * 84}% - ${size / 2}vmin)`;
    blob.style.background = FX_COLORS[Math.floor(Math.random() * FX_COLORS.length)];
    blob.style.setProperty("--r", Math.round(Math.random() * 360) + "deg");
    wrap.appendChild(blob);
    blobs.push(blob);
    Sounds.splat();
  }

  /* ---------- Musik ---------- */

  let bars = [];
  let songLine = null;
  let line = 0;
  let syllable = 0;

  function musicSetup() {
    wrap.innerHTML = `<div class="song-line"></div><div class="xylophone"></div>`;
    songLine = wrap.querySelector(".song-line");
    const xylo = wrap.querySelector(".xylophone");
    bars = XYLO_NOTES.map((note, i) => {
      const bar = document.createElement("div");
      bar.className = "xylo-bar";
      bar.style.background = XYLO_COLORS[i];
      bar.style.height = (100 - i * 6) + "%";
      xylo.appendChild(bar);
      return bar;
    });
    line = 0;
    syllable = -1;
    showSongLine();
  }

  function showSongLine() {
    songLine.innerHTML = "";
    SONG[line].forEach(([text], i) => {
      const span = document.createElement("span");
      span.textContent = text;
      span.style.whiteSpace = "pre";
      span.style.opacity = i <= syllable ? "1" : "0.3";
      songLine.appendChild(span);
    });
  }

  function playNote() {
    syllable++;
    if (syllable >= SONG[line].length) {
      line = (line + 1) % SONG.length;
      syllable = 0;
      if (line === 0) Fx.rain(60);
    }

    const [, note] = SONG[line][syllable];
    const i = XYLO_NOTES.indexOf(note);
    Sounds.xylo(NOTE[note]);

    const bar = bars[i];
    bar.classList.add("hit");
    later(() => bar.classList.remove("hit"), 220);
    showSongLine();
  }

  /* ---------- Lichter ---------- */

  let lights = null;
  let hum = null;
  let lightTimer = null;

  function lightSetup() {
    wrap.classList.add("night");
    wrap.innerHTML = `<div class="lights"></div><div class="press-hint">Drück den Taster!</div>`;
    lights = wrap.querySelector(".lights");
    ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93", "#f15bb5"].forEach((color, i) => {
      const light = document.createElement("div");
      light.className = "light";
      light.style.setProperty("--c", color);
      light.style.setProperty("--d", (i * 0.2) + "s");
      lights.appendChild(light);
    });
  }

  function lightsOn() {
    if (!lights.classList.contains("on")) {
      lights.classList.add("on");
      hum = Sounds.hum();
    }
  }

  function lightsOff() {
    lights.classList.remove("on");
    if (hum) hum.stop();
    hum = null;
  }

  /* ---------- Überraschung ---------- */

  let queue = [];
  let shown = null;

  function surpriseSetup() {
    wrap.innerHTML = `<div class="press-hint">Drück den Taster!</div>`;
  }

  function nextSurprise() {
    if (queue.length === 0) queue = shuffle(collection.pages);
    const page = queue.shift();

    stopVoice();
    if (shown) shown.remove();

    shown = document.createElement("div");
    shown.className = "surprise";
    shown.style.background = page.image ? "var(--buehne)" : (page.bg || "var(--buehne)");
    shown.appendChild(makeVisual(page));
    if (page.text) {
      const p = document.createElement("p");
      p.className = "story-text";
      p.textContent = page.text;
      shown.appendChild(p);
    }
    wrap.appendChild(shown);

    Sounds.chime();
    later(() => {
      const c = centerOf(shown.querySelector(".story-visual"));
      Fx.confetti(c.x, c.y, 50);
    }, 350);
    sayPage(page);
  }

  /* ---------- gemeinsam ---------- */

  const handlers = {
    feuerwerk: {
      setup: fireworkSetup,
      press: () => repeatWhileHeld(launchFirework, 450),
      release: stopHold
    },
    kleckse: {
      setup: blobSetup,
      press: addBlob,
      release() {}
    },
    musik: {
      setup: musicSetup,
      press: () => repeatWhileHeld(playNote, 380),
      release: stopHold
    },
    licht: {
      setup: lightSetup,
      press() {
        lightsOn();
        clearTimeout(lightTimer);
        // Ohne Halten-Modus: Licht bleibt 3 Sekunden an
        if (!settings.hold) lightTimer = setTimeout(lightsOff, 3000);
      },
      release() {
        if (settings.hold) lightsOff();
      }
    },
    ueberraschung: {
      setup: surpriseSetup,
      press: nextSurprise,
      release() {}
    }
  };

  const handler = handlers[variant];

  return {
    title: variant === "ueberraschung"
      ? collection.name + " – Überraschung"
      : EFFECT_VARIANTS.find(v => v.id === variant).name,

    start(stageElement) {
      stage = stageElement;
      wrap = document.createElement("div");
      wrap.className = "effect-wrap";
      stage.appendChild(wrap);
      handler.setup();
    },

    press() {
      removeHint();
      handler.press();
    },

    release() {
      handler.release();
    },

    stop() {
      stopHold();
      timers.forEach(clearTimeout);
      clearTimeout(lightTimer);
      if (hum) hum.stop();
      stopVoice();
    }
  };
}
