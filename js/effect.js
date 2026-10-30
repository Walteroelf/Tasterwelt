/*
  Baustein 4: Effekt – jeder Druck löst sofort etwas aus.

  - Feuerwerk:  eine Rakete steigt auf und zerplatzt
  - Wellen:     ein Tropfen fällt, Ringe breiten sich aus
  - Polarlicht: Lichtschleier leuchten auf, dazu eine Klangfläche
  - Lavalampe:  ruhige Formen kommen in Bewegung und leuchten
  - Musik:      Akkord für Akkord ein ruhiges Stück (Cmaj7 – Am7 – Fmaj7 – G6)
  - Überraschung (Sammlung): ein zufälliges Bild erscheint

  Halten-Modus (Einstellungen → Bausteine): Der Effekt läuft nur, solange
  der Taster gedrückt bleibt. Sonst klingt er nach einem Druck von selbst aus.
*/

function createEffectGame(variant, collection) {
  let wrap = null;
  let canvas = null;
  let ctx = null;
  let raf = null;
  let holdTimer = null;
  let decayTimer = null;
  let padSound = null;
  let energy = 0.12;
  let target = 0.12;
  let time = 0;
  const timers = [];

  function later(fn, ms) {
    timers.push(setTimeout(fn, ms));
  }

  /* Aktion sofort – im Halten-Modus wiederholt, bis losgelassen wird */
  function repeatWhileHeld(action, interval) {
    action();
    if (!settings.hold) return;
    clearInterval(holdTimer);
    holdTimer = setInterval(action, interval);
  }

  function stopHold() {
    clearInterval(holdTimer);
  }

  /* ---------- Zeichenfläche für Polarlicht und Lavalampe ---------- */

  function setupCanvas() {
    canvas = document.createElement("canvas");
    canvas.className = "effect-canvas";
    wrap.appendChild(canvas);
    ctx = canvas.getContext("2d");
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
  }

  function resizeCanvas() {
    if (!canvas) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.clientWidth * ratio;
    canvas.height = canvas.clientHeight * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function loop(draw) {
    const step = () => {
      energy += (target - energy) * (settings.calm ? 0.02 : 0.045);
      time += 0.016 * (0.3 + energy * 1.4) * (settings.calm ? 0.5 : 1);
      draw(canvas.clientWidth, canvas.clientHeight);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  /* Leuchten an: Klangfläche starten bzw. heller machen */
  function glowOn(notes) {
    target = 1;
    if (!padSound) padSound = pad(notes, { volume: 0.06, attack: 0.6, cutoff: 500 });
    padSound.swell(1);

    clearTimeout(decayTimer);
    if (!settings.hold) decayTimer = setTimeout(glowOff, 2600);
  }

  function glowOff() {
    target = 0.12;
    if (padSound) {
      padSound.stop(1.8);
      padSound = null;
    }
  }

  /* ---------- Polarlicht ---------- */

  /* Lichtvorhänge: Unterkante als Welle, darüber senkrechte Strahlen,
     die nach oben ausblenden – wie echtes Polarlicht */
  const rays = Array.from({ length: 3 }, () => {
    const raw = Array.from({ length: 400 }, () => Math.random());
    // geglättet, damit weiche Strahlenbündel statt Streifen entstehen
    return raw.map((_, i) => {
      let sum = 0;
      for (let k = -4; k <= 4; k++) sum += raw[(i + k + 400) % 400];
      return 0.35 + (sum / 9) * 0.9;
    });
  });

  function drawAurora(w, h) {
    ctx.clearRect(0, 0, w, h);
    const t = currentTheme();
    ctx.globalCompositeOperation = settings.theme === "hell" ? "multiply" : "lighter";
    const step = 5;

    [t.b, t.a, t.c].forEach((color, band) => {
      const base = h * (0.5 + band * 0.1);
      const height = h * (0.18 + energy * 0.22);
      const strength = 0.03 + energy * 0.22;

      for (let i = 0, x = 0; x <= w; i++, x += step) {
        const edge = base +
          Math.sin(x * 0.005 + time * (0.7 + band * 0.25) + band * 2) * h * 0.08 +
          Math.sin(x * 0.012 - time * 1.1 + band) * h * 0.025;
        const shimmer = 0.7 + 0.18 * Math.sin(time * 2 + i * 0.11 + band) + 0.12 * Math.sin(time * 3.7 - i * 0.047);
        const length = height * rays[band][i % 400] * shimmer;

        const gradient = ctx.createLinearGradient(0, edge - length, 0, edge);
        gradient.addColorStop(0, withAlpha(color, 0));
        gradient.addColorStop(0.85, withAlpha(color, strength));
        gradient.addColorStop(1, withAlpha(color, strength * 0.4));
        ctx.fillStyle = gradient;
        ctx.fillRect(x, edge - length, step + 1, length);
      }
    });

    ctx.globalCompositeOperation = "source-over";
  }

  /* ---------- Lavalampe ---------- */

  let blobs = [];

  function setupLava() {
    const t = currentTheme();
    const colors = [t.a, t.c, t.b, t.a, t.c, t.a, t.b];
    blobs = colors.map(color => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.002,
      vy: (Math.random() - 0.5) * 0.003,
      r: 0.08 + Math.random() * 0.1,
      color
    }));
  }

  function drawLava(w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = settings.theme === "hell" ? "multiply" : "lighter";
    const speed = 0.25 + energy * 3;
    const size = Math.min(w, h);

    blobs.forEach((b, i) => {
      b.x += b.vx * speed;
      b.y += b.vy * speed + Math.sin(time + i) * 0.0004 * speed;
      if (b.x < 0.05 || b.x > 0.95) b.vx *= -1;
      if (b.y < 0.08 || b.y > 0.92) b.vy *= -1;

      const r = size * b.r * (0.85 + energy * 0.35 + Math.sin(time * 1.4 + i) * 0.06);
      const x = b.x * w;
      const y = b.y * h;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
      gradient.addColorStop(0, withAlpha(b.color, 0.25 + energy * 0.6));
      gradient.addColorStop(0.55, withAlpha(b.color, 0.12 + energy * 0.35));
      gradient.addColorStop(1, withAlpha(b.color, 0));
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalCompositeOperation = "source-over";
  }

  /* ---------- Feuerwerk ---------- */

  function launchFirework() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    Sounds.launch();
    Fx.rocket(w * (0.2 + Math.random() * 0.6), h * (0.18 + Math.random() * 0.3), (x, y) => {
      Fx.firework(x, y);
      Sounds.burst();
    });
  }

  /* ---------- Wellen ---------- */

  function dropWave() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const x = w * (0.3 + Math.random() * 0.4);
    const y = h * (0.35 + Math.random() * 0.35);
    Fx.ripple(x, y, randomParticleColor(), 4);
    Fx.burst(x, y, 10, currentTheme().text);
    Sounds.drop();
  }

  /* ---------- Musik ---------- */

  let disc = null;
  let chordIndex = 0;
  let noteStep = 0;

  function setupMusic() {
    disc = document.createElement("div");
    disc.style.cssText = "position:absolute;left:50%;top:50%;width:26vmin;height:26vmin;margin:-13vmin 0 0 -13vmin;border-radius:50%;background:var(--st-a);opacity:.9;transition:transform .5s cubic-bezier(.2,1.4,.4,1), background .6s";
    wrap.appendChild(disc);
  }

  function pulse(scale) {
    const t = currentTheme();
    disc.style.background = [t.a, t.b, t.c, t.a][chordIndex % 4];
    disc.style.transition = "none";
    disc.style.transform = `scale(${scale})`;
    disc.getBoundingClientRect();
    disc.style.transition = "";
    disc.style.transform = "scale(1)";
    const c = centerOf(disc);
    Fx.ripple(c.x, c.y, disc.style.background, 2);
  }

  function playChord() {
    Sounds.chord(chordIndex);
    pulse(1.25);
    chordIndex = (chordIndex + 1) % 4;
  }

  function playHeldNote() {
    Sounds.chordNote(chordIndex, noteStep);
    pulse(1.1);
    noteStep++;
    if (noteStep % 8 === 0) chordIndex = (chordIndex + 1) % 4;
  }

  /* ---------- Überraschung ---------- */

  let queue = [];
  let shown = null;

  function nextSurprise() {
    if (queue.length === 0) queue = shuffle(collection.pages);
    const page = queue.shift();

    stopVoice();
    if (shown) shown.remove();

    shown = document.createElement("div");
    shown.className = "surprise";
    const visual = makeVisual(page);
    if (visual) shown.appendChild(visual);
    if (page.text && (settings.showText || !visual)) shown.appendChild(textElement(page.text, !visual));
    wrap.appendChild(shown);

    Sounds.appear();
    sayPage(page);
  }

  /* ---------- gemeinsam ---------- */

  const handlers = {
    feuerwerk: {
      setup() {},
      press: () => repeatWhileHeld(launchFirework, 520),
      release: stopHold
    },
    wellen: {
      setup() {},
      press: () => repeatWhileHeld(dropWave, 480),
      release: stopHold
    },
    polarlicht: {
      setup() { setupCanvas(); loop(drawAurora); },
      press: () => glowOn([48, 55, 59, 64]),
      release() { if (settings.hold) glowOff(); }
    },
    lava: {
      setup() { setupCanvas(); setupLava(); loop(drawLava); },
      press: () => glowOn([45, 52, 57, 60]),
      release() { if (settings.hold) glowOff(); }
    },
    musik: {
      setup: setupMusic,
      press() {
        if (settings.hold) {
          noteStep = 0;
          repeatWhileHeld(playHeldNote, 300);
        } else {
          playChord();
        }
      },
      release() {
        if (settings.hold && noteStep > 0) chordIndex = (chordIndex + 1) % 4;
        stopHold();
      }
    },
    ueberraschung: {
      setup() {},
      press: nextSurprise,
      release() {}
    }
  };

  const handler = handlers[variant];

  return {
    start(stageElement) {
      wrap = document.createElement("div");
      wrap.className = "effect-wrap";
      stageElement.appendChild(wrap);
      handler.setup();
    },

    press() {
      handler.press();
    },

    release() {
      handler.release();
    },

    stop() {
      stopHold();
      timers.forEach(clearTimeout);
      clearTimeout(decayTimer);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resizeCanvas);
      if (padSound) padSound.stop(0.4);
      padSound = null;
      stopVoice();
    }
  };
}
