/*
  Effekte zum Schauen: Lichtpunkt, Farben, Kontraste, Seifenblasen.

  Alles bewegt sich langsam, es gibt keine Blitze und keine harten Wechsel.
  Jeder Tasterdruck (oder Tipp irgendwo) bewirkt etwas – es muss nichts getroffen werden.
  Der Hintergrund und die Farben kommen aus der gewählten Farbwelt (CVI-Welten bleiben
  bei ihren Farben). Die Kontrast-Muster sind immer Schwarz und Weiß.

  Halten-Modus: Bei den Seifenblasen platzt eine Blase nach der anderen, solange gedrückt wird.
  Ruhiger Modus: alle Bewegungen halb so schnell.
*/

function createScreenGame(variant) {
  let wrap = null;
  let canvas = null;
  let ctx = null;
  let raf = 0;
  let lastFrame = 0;
  let clock = 0;
  let holdTimer = null;
  let wakeLock = null;
  let game = null;

  const rgbOf = hex => {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };

  /* ---------- Lichtpunkt ---------- */

  function lightGame() {
    let pulse = 0;
    let index = 0;

    return {
      press() {
        pulse = 1;
        index = (index + 1) % 3;
        Sounds.bell(index);
      },
      draw(t, dt, W, H) {
        const th = currentTheme();
        const colors = [th.a, th.b, th.c];
        ctx.fillStyle = th.bg;
        ctx.fillRect(0, 0, W, H);

        const x = W / 2 + Math.sin(t * 0.23) * W * 0.34;
        const y = H / 2 + Math.sin(t * 0.17 + 1) * H * 0.3;
        const r = Math.min(W, H) * 0.09 * (1 + pulse * 1.4);
        pulse *= Math.pow(0.975, dt * 60);

        const color = colors[index];
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.6);
        g.addColorStop(0, withAlpha(color, 1));
        g.addColorStop(0.3, withAlpha(color, 0.85));
        g.addColorStop(1, withAlpha(color, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r * 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    };
  }

  /* ---------- Farben fließen ---------- */

  function colorGame() {
    const th = currentTheme();
    const rich = settings.theme === "nacht" || settings.theme === "hell";
    const palette = (rich
      ? ["#de623c", "#f0b43c", "#5aaa5a", "#468cd2", "#9664c8", "#e66e96"]
      : [...new Set([th.a, th.b, th.c])]
    ).map(rgbOf);

    let index = 0;
    let from = palette[0];
    let to = palette[0];
    let mix = 1;
    let auto = 0;

    const current = () => from.map((v, k) => v + (to[k] - v) * mix);
    const next = () => {
      from = current();
      index = (index + 1) % palette.length;
      to = palette[index];
      mix = 0;
      auto = 0;
    };

    return {
      press() {
        next();
        Sounds.bell(index);
      },
      draw(t, dt, W, H) {
        mix = Math.min(1, mix + dt / 2.2);
        auto += dt;
        if (auto > 10 && palette.length > 1) next();

        const c = current();
        const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
        g.addColorStop(0, `rgb(${c.map(v => Math.min(255, v + 40)).join(",")})`);
        g.addColorStop(1, `rgb(${c.map(v => v * 0.7).join(",")})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
    };
  }

  /* ---------- Schwarz und Weiß ---------- */

  function contrastGame() {
    const PATTERNS = 5;
    let pattern = 0;
    let since = 0;
    const ripples = [];

    function drawPattern(t, W, H) {
      const cx = W / 2;
      const cy = H / 2;
      const M = Math.hypot(W, H) / 2;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#000";
      ctx.strokeStyle = "#000";

      if (pattern === 0) {
        // drehende Spirale mit zwei Armen
        const turns = 7;
        const b = M / (turns * 2 * Math.PI);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.lineWidth = Math.PI * b;
        ctx.lineCap = "butt";
        for (let k = 0; k < 2; k++) {
          ctx.beginPath();
          for (let th = 0.05; th < turns * 2 * Math.PI; th += 0.05) {
            const a = th + t * 0.9 + k * Math.PI;
            const px = Math.cos(a) * b * th;
            const py = Math.sin(a) * b * th;
            if (th < 0.06) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
        ctx.restore();
      } else if (pattern === 1) {
        // Ringe wandern nach außen
        const w = Math.min(W, H) / 9;
        const offset = (t * w * 0.6) % (2 * w);
        for (let i = Math.ceil(M / w) + 2; i >= 0; i--) {
          ctx.fillStyle = i % 2 ? "#000" : "#fff";
          ctx.beginPath();
          ctx.arc(cx, cy, i * w + offset, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (pattern === 2) {
        // Windrad
        const n = 12;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * 0.35);
        for (let k = 0; k < n; k += 2) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, M, k * 2 * Math.PI / n, (k + 1) * 2 * Math.PI / n);
          ctx.fill();
        }
        ctx.restore();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(cx, cy, Math.min(W, H) * 0.06, 0, Math.PI * 2);
        ctx.fill();
      } else if (pattern === 3) {
        // Schachbrett, dessen Felder wie eine Welle atmen
        const s = Math.min(W, H) / 6;
        for (let x = 0; x < W + s; x += s) {
          for (let y = 0; y < H + s; y += s) {
            const i = Math.round(x / s);
            const j = Math.round(y / s);
            if ((i + j) % 2) continue;
            const q = s * (0.55 + 0.45 * Math.sin(t * 1.6 - (i + j) * 0.6));
            ctx.fillRect(x + (s - q) / 2, y + (s - q) / 2, q, q);
          }
        }
      } else {
        // Gesicht: blinzelt und lächelt
        const r = Math.min(W, H) * 0.36;
        ctx.lineWidth = r * 0.09;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        const blink = (t % 4) < 0.18;
        const ex = r * 0.38;
        const ey = r * 0.25;
        const er = r * 0.1;
        [-1, 1].forEach(side => {
          ctx.beginPath();
          if (blink) {
            ctx.moveTo(cx + side * ex - er * 1.6, cy - ey);
            ctx.lineTo(cx + side * ex + er * 1.6, cy - ey);
            ctx.stroke();
          } else {
            ctx.arc(cx + side * ex, cy - ey, er * 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        ctx.beginPath();
        ctx.arc(cx, cy + r * 0.05, r * 0.5, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
      }
    }

    return {
      press(W, H) {
        ripples.push({ x: W * (0.3 + Math.random() * 0.4), y: H * (0.3 + Math.random() * 0.4), t: 0 });
        pattern = (pattern + 1) % PATTERNS;
        since = 0;
        Sounds.bell(pattern);
      },
      draw(t, dt, W, H) {
        since += dt;
        if (since > 20) {
          since = 0;
          pattern = (pattern + 1) % PATTERNS;
        }
        drawPattern(t, W, H);

        // Kreiswellen an der Stelle des Drucks
        for (let k = ripples.length - 1; k >= 0; k--) {
          const o = ripples[k];
          o.t += dt;
          if (o.t > 2.4) {
            ripples.splice(k, 1);
            continue;
          }
          ctx.lineWidth = 14;
          ctx.globalAlpha = Math.max(0, 1 - o.t / 2.4);
          for (let n = 0; n < 4; n++) {
            const radius = o.t * 160 - n * 34;
            if (radius <= 0) continue;
            ctx.strokeStyle = n % 2 ? "#fff" : "#000";
            ctx.beginPath();
            ctx.arc(o.x, o.y, radius, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
      }
    };
  }

  /* ---------- Seifenblasen ---------- */

  function bubbleGame() {
    const bubbles = [];
    const sparks = [];
    let spawn = 0;
    let ready = false;

    const rich = () => settings.theme === "nacht";
    const hueColor = h => rich() ? `hsl(${h}, 80%, 70%)` : currentTheme().a;

    function add(W, H, y) {
      bubbles.push({
        x: Math.random() * W,
        y: y === undefined ? H + 60 : y,
        r: 36 + Math.random() * 46,
        v: 20 + Math.random() * 25,
        phase: Math.random() * 6,
        hue: Math.random() * 360
      });
    }

    function pop(b) {
      bubbles.splice(bubbles.indexOf(b), 1);
      const count = settings.calm ? 8 : 14;
      for (let k = 0; k < count; k++) {
        const a = k / count * Math.PI * 2;
        sparks.push({ x: b.x, y: b.y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, life: 1, hue: b.hue });
      }
      Sounds.bubble();
    }

    return {
      press(W, H) {
        // Die größte sichtbare Blase platzt – genau treffen ist nicht nötig
        const visible = bubbles.filter(b => b.y > 0 && b.y < H);
        if (!visible.length) return;
        pop(visible.reduce((a, b) => (b.r > a.r ? b : a)));
      },
      draw(t, dt, W, H) {
        const th = currentTheme();
        ctx.fillStyle = rich() ? "#13304a" : th.bg;
        ctx.fillRect(0, 0, W, H);

        if (!ready) {
          ready = true;
          for (let k = 0; k < 6; k++) add(W, H, H * (0.2 + k * 0.13));
        }

        spawn -= dt;
        if (spawn <= 0 && bubbles.length < 9) {
          add(W, H);
          spawn = 1.2 + Math.random() * 1.4;
        }

        for (let k = bubbles.length - 1; k >= 0; k--) {
          const b = bubbles[k];
          b.y -= b.v * dt;
          if (b.y < -b.r * 2) {
            bubbles.splice(k, 1);
            continue;
          }
          b.sx = b.x + Math.sin(t * 0.8 + b.phase) * 18;

          const color = hueColor(b.hue);
          ctx.globalAlpha = 0.8;
          ctx.lineWidth = 3;
          ctx.strokeStyle = rich() ? "#ffffff" : color;
          ctx.fillStyle = rich() ? `hsla(${b.hue}, 80%, 70%, 0.22)` : withAlpha(th.a, 0.18);
          ctx.beginPath();
          ctx.arc(b.sx, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // kleines Glanzlicht
          ctx.globalAlpha = 0.55;
          ctx.strokeStyle = rich() ? "#ffffff" : th.text;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(b.sx, b.y, b.r * 0.7, Math.PI * 1.15, Math.PI * 1.45);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        for (let k = sparks.length - 1; k >= 0; k--) {
          const p = sparks[k];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt * 1.6;
          if (p.life <= 0) {
            sparks.splice(k, 1);
            continue;
          }
          ctx.globalAlpha = p.life;
          ctx.fillStyle = hueColor(p.hue);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5 * p.life + 1, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    };
  }

  /* ---------- Rahmen ---------- */

  function resize() {
    if (!canvas) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.clientWidth * ratio;
    canvas.height = canvas.clientHeight * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function frame(now) {
    const dt = Math.min(0.1, (now - lastFrame) / 1000) * (settings.calm ? 0.5 : 1);
    lastFrame = now;
    clock += dt;
    game.draw(clock, dt, canvas.clientWidth, canvas.clientHeight);
    raf = requestAnimationFrame(frame);
  }

  function pressAction() {
    game.press(canvas.clientWidth, canvas.clientHeight);
  }

  async function keepAwake() {
    try {
      if (navigator.wakeLock) wakeLock = await navigator.wakeLock.request("screen");
    } catch (error) {
      // nicht überall erlaubt – dann gilt die Sperrzeit des Geräts
    }
  }

  return {
    start(stageElement) {
      wrap = document.createElement("div");
      wrap.className = "effect-wrap";
      canvas = document.createElement("canvas");
      canvas.className = "effect-canvas";
      wrap.appendChild(canvas);
      stageElement.appendChild(wrap);
      ctx = canvas.getContext("2d");
      resize();
      window.addEventListener("resize", resize);

      game = { licht: lightGame, farben: colorGame, kontrast: contrastGame, blasen: bubbleGame }[variant]();
      lastFrame = performance.now();
      raf = requestAnimationFrame(frame);
      keepAwake();
    },

    press() {
      pressAction();
      // Halten-Modus: bei den Blasen platzt eine nach der anderen
      if (settings.hold && variant === "blasen") {
        clearInterval(holdTimer);
        holdTimer = setInterval(pressAction, 450);
      }
    },

    release() {
      clearInterval(holdTimer);
    },

    stop() {
      clearInterval(holdTimer);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      if (wakeLock) {
        wakeLock.release().catch(() => {});
        wakeLock = null;
      }
    }
  };
}
