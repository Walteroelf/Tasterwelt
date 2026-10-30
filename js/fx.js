/*
  Konfetti, Feuerwerk und Sterne auf einer Zeichenfläche über der Spielfläche.
  Die Zeichenschleife läuft nur, solange Teilchen unterwegs sind.
  Im ruhigen Modus gibt es deutlich weniger Teilchen.
*/

const FX_COLORS = ["#e63946", "#f4a261", "#f2b531", "#2a9d8f", "#3d7ab8", "#9b5de5", "#f15bb5", "#00bbf9"];

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
    return Math.max(4, Math.round(settings.calm ? n / 4 : n));
  },

  /* Konfetti-Explosion an einer Stelle (Bildschirm-Koordinaten) */
  confetti(x, y, n = 90) {
    for (let i = 0; i < this.amount(n); i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 9;
      this.particles.push({
        kind: "confetti",
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5,
        gravity: 0.28,
        drag: 0.985,
        size: 8 + Math.random() * 8,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.4,
        color: FX_COLORS[i % FX_COLORS.length],
        life: 1,
        decay: 0.006 + Math.random() * 0.006
      });
    }
    this.start();
  },

  /* Konfetti von oben über den ganzen Bildschirm */
  rain(n = 120) {
    const w = this.canvas.clientWidth;
    for (let i = 0; i < this.amount(n); i++) {
      this.particles.push({
        kind: "confetti",
        x: Math.random() * w,
        y: -20 - Math.random() * 300,
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 4,
        gravity: 0.05,
        drag: 0.995,
        size: 8 + Math.random() * 8,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.3,
        color: FX_COLORS[i % FX_COLORS.length],
        life: 1,
        decay: 0.004
      });
    }
    this.start();
  },

  /* Feuerwerk: leuchtende Funken in einer Farbe, die nach unten fallen */
  firework(x, y, color) {
    const c = color || FX_COLORS[Math.floor(Math.random() * FX_COLORS.length)];
    const n = this.amount(160);
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2;
      const speed = 4 + Math.random() * 8;
      this.particles.push({
        kind: "spark",
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.06,
        drag: 0.975,
        size: 4 + Math.random() * 4,
        color: Math.random() < 0.15 ? "#ffffff" : c,
        life: 1,
        decay: 0.007 + Math.random() * 0.008
      });
    }
    this.start();
  },

  /* Aufsteigende Leuchtspur (Feuerwerksrakete), danach Explosion */
  rocket(x, y, onBurst) {
    const h = this.canvas.clientHeight;
    this.particles.push({
      kind: "trail",
      x, y: h + 10,
      targetY: y,
      vx: 0,
      vy: -(h - y) / 32,
      size: 5,
      color: "#fff7d6",
      life: 1,
      decay: 0,
      onBurst
    });
    this.start();
  },

  /* Flammen und Rauch unter der Rakete */
  flame(x, y) {
    for (let i = 0; i < this.amount(6); i++) {
      this.particles.push({
        kind: "spark",
        x: x + (Math.random() - 0.5) * 30,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: 3 + Math.random() * 4,
        gravity: 0,
        drag: 0.96,
        size: 8 + Math.random() * 10,
        color: ["#ffd166", "#f4a261", "#e63946"][i % 3],
        life: 1,
        decay: 0.035
      });
    }
    this.start();
  },

  smoke(x, y, n = 14) {
    for (let i = 0; i < this.amount(n); i++) {
      this.particles.push({
        kind: "smoke",
        x: x + (Math.random() - 0.5) * 60,
        y,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 1.5,
        gravity: -0.02,
        drag: 0.97,
        size: 20 + Math.random() * 30,
        color: "rgba(200,200,200,",
        life: 1,
        decay: 0.015
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
    ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);

    const alive = [];

    for (const p of this.particles) {
      if (p.kind === "trail") {
        p.y += p.vy;
        ctx.globalAlpha = 1;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        // kleine Funken hinter der Leuchtspur
        if (Math.random() < 0.6) {
          alive.push({ kind: "spark", x: p.x, y: p.y + 6, vx: (Math.random() - 0.5), vy: 1, gravity: 0.05, drag: 0.95, size: 2, color: "#ffd166", life: 0.8, decay: 0.04 });
        }
        if (p.y <= p.targetY) {
          if (p.onBurst) p.onBurst(p.x, p.y);
          continue;
        }
        alive.push(p);
        continue;
      }

      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0 || p.y > this.canvas.clientHeight + 50) continue;

      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));

      if (p.kind === "confetti") {
        p.rot += p.vrot;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      } else if (p.kind === "smoke") {
        ctx.fillStyle = p.color + (0.5 * p.life) + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1.5 - p.life * 0.5), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }

      alive.push(p);
    }

    ctx.globalAlpha = 1;
    this.particles = alive;

    if (alive.length > 0) {
      requestAnimationFrame(() => this.frame());
    } else {
      this.running = false;
      ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
    }
  }
};

/* Mitte eines Elements in Bildschirm-Koordinaten */
function centerOf(element) {
  const r = element.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
