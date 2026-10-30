/*
  Lichteffekte auf einer Zeichenfläche über der Spielfläche: Funken,
  Feuerwerk, Wellenringe, Flammen, Rauch. Farben aus der Farbwelt.
  Auf dunklem Grund addieren sich die Lichter (leuchtet), auf hellem nicht.
  Die Zeichenschleife läuft nur, solange etwas unterwegs ist.
*/

const Fx = {
  canvas: null,
  ctx: null,
  particles: [],
  running: false,

  init() {
    this.canvas = document.getElementById("fxCanvas");
    this.ctx = this.canvas.getContext("2d");
    window.addEventListener("resize", () => this.resize());
    this.resize();
  },

  resize() {
    const ratio = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.clientWidth * ratio;
    this.canvas.height = this.canvas.clientHeight * ratio;
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  },

  amount(n) {
    return Math.max(3, Math.round(settings.calm ? n / 3 : n));
  },

  /* Funken, die von einer Stelle auseinanderstieben (z. B. Ballon platzt) */
  burst(x, y, n = 60, color = null) {
    for (let i = 0; i < this.amount(n); i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 9;
      this.particles.push({
        kind: "spark",
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.12,
        drag: 0.96,
        size: 2 + Math.random() * 5,
        color: color || randomParticleColor(),
        life: 1,
        decay: 0.012 + Math.random() * 0.012
      });
    }
    this.start();
  },

  /* Feuerwerk: Funkenkugel in einer Farbe, fällt langsam */
  firework(x, y, color) {
    const c = color || randomParticleColor();
    const n = this.amount(150);
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 + Math.random() * 0.05;
      const speed = 3 + Math.random() * 7;
      this.particles.push({
        kind: "spark",
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.05,
        drag: 0.972,
        size: 2.5 + Math.random() * 3,
        color: c,
        life: 1,
        decay: 0.006 + Math.random() * 0.008,
        twinkle: Math.random() < 0.3
      });
    }
    this.start();
  },

  /* Leuchtspur nach oben, danach onBurst */
  rocket(x, y, onBurst) {
    const h = this.canvas.clientHeight;
    this.particles.push({ kind: "trail", x, y: h + 10, targetY: y, vy: -(h - y) / 36, size: 3, color: currentTheme().text, life: 1, decay: 0, onBurst });
    this.start();
  },

  /* Ringe, die sich ausbreiten (Wellen) */
  ripple(x, y, color, count = 3) {
    for (let i = 0; i < count; i++) {
      this.particles.push({ kind: "ring", x, y, r: 4, vr: 2.6 - i * 0.5, width: 5 - i, color: color || randomParticleColor(), life: 1, decay: 0.008 + i * 0.002, delay: i * 14 });
    }
    this.start();
  },

  flame(x, y) {
    const t = currentTheme();
    for (let i = 0; i < this.amount(5); i++) {
      this.particles.push({
        kind: "spark",
        x: x + (Math.random() - 0.5) * 18,
        y,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 3 + Math.random() * 4,
        gravity: 0,
        drag: 0.95,
        size: 5 + Math.random() * 7,
        color: Math.random() < 0.5 ? t.a : t.c,
        life: 1,
        decay: 0.045
      });
    }
    this.start();
  },

  smoke(x, y, n = 12) {
    for (let i = 0; i < this.amount(n); i++) {
      this.particles.push({
        kind: "smoke",
        x: x + (Math.random() - 0.5) * 50,
        y,
        vx: (Math.random() - 0.5) * 2.5,
        vy: -Math.random() * 1.2,
        gravity: -0.015,
        drag: 0.97,
        size: 16 + Math.random() * 24,
        color: currentTheme().text,
        life: 1,
        decay: 0.014
      });
    }
    this.start();
  },

  clear() {
    this.particles = [];
    if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },

  start() {
    if (this.running) return;
    this.running = true;
    requestAnimationFrame(() => this.frame());
  },

  frame() {
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = settings.theme === "hell" ? "source-over" : "lighter";

    const alive = [];

    for (const p of this.particles) {
      if (p.kind === "trail") {
        p.y += p.vy;
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        if (Math.random() < 0.7) {
          alive.push({ kind: "spark", x: p.x + (Math.random() - 0.5) * 2, y: p.y + 4, vx: 0, vy: 0.6, gravity: 0.02, drag: 0.95, size: 1.6, color: p.color, life: 0.7, decay: 0.035 });
        }
        if (p.y <= p.targetY) {
          if (p.onBurst) p.onBurst(p.x, p.y);
          continue;
        }
        alive.push(p);
        continue;
      }

      if (p.kind === "ring") {
        if (p.delay > 0) {
          p.delay--;
          alive.push(p);
          continue;
        }
        p.r += p.vr;
        p.vr *= 0.995;
        p.life -= p.decay;
        if (p.life <= 0) continue;
        ctx.globalAlpha = p.life;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, p.width * p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.stroke();
        alive.push(p);
        continue;
      }

      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0 || p.y > h + 60) continue;

      const flicker = p.twinkle && p.life < 0.6 ? (Math.random() < 0.5 ? 0.2 : 1) : 1;

      if (p.kind === "smoke") {
        ctx.globalAlpha = 0.12 * p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1.6 - p.life * 0.6), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.globalAlpha = Math.min(1, p.life) * flicker;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.4 + p.life * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }

      alive.push(p);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    this.particles = alive;

    if (alive.length > 0) {
      requestAnimationFrame(() => this.frame());
    } else {
      this.running = false;
      ctx.clearRect(0, 0, w, h);
    }
  }
};

/* Mitte eines Elements in Bildschirm-Koordinaten */
function centerOf(element) {
  const r = element.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
