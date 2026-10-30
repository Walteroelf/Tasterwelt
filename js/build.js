/*
  Baustein 3: Aufbauen.

  Jeder Druck baut ein Stück weiter. Nach der eingestellten Zahl von Drücken
  (Einstellungen → Bausteine) passiert das Ereignis:
  - Ballon: wird aufgepumpt und platzt
  - Domino: Steine werden aufgestellt, dann fällt die ganze Reihe
  - Rakete: wird betankt und hebt ab

  Alles ist eine Vektorgrafik im Format 400 × 300, Farben aus der Farbwelt.
*/

const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  return el;
}

function createBuildGame(variant) {
  const steps = () => Number(settings.steps) || 5;
  let svg = null;
  let count = 0;
  let busy = false;
  const timers = [];
  let flameTimer = null;

  function later(fn, ms) {
    timers.push(setTimeout(fn, ms));
  }

  /* ---------- Ballon ---------- */

  let balloon = null;

  function setupBalloon() {
    svg.innerHTML = `
      <path class="sb" d="M200 204 C192 232 210 262 200 320" stroke-width="2"/>
      <g class="balloon-body">
        <ellipse class="a" cx="200" cy="134" rx="54" ry="66"/>
        <path class="a" d="M192 206 L208 206 L200 196 Z"/>
        <ellipse class="k" cx="180" cy="108" rx="8" ry="18" transform="rotate(25 180 108)" opacity=".3"/>
      </g>`;
    balloon = svg.querySelector(".balloon-body");
    newBalloon();
  }

  function newBalloon() {
    count = 0;
    balloon.style.transition = "none";
    balloon.style.opacity = "1";
    balloon.style.transform = "scale(0.2)";
    balloon.getBoundingClientRect();
    balloon.style.transition = "";
  }

  function pressBalloon() {
    count++;
    const progress = count / steps();
    Sounds.pump(progress);

    if (count < steps()) {
      balloon.style.transform = `scale(${0.2 + 0.85 * progress})`;
      return;
    }

    busy = true;
    balloon.style.transform = "scale(1.15)";
    later(() => {
      const c = centerOf(balloon);
      balloon.style.transition = "none";
      balloon.style.opacity = "0";
      Sounds.pop();
      Fx.burst(c.x, c.y, 90, currentTheme().a);
    }, 600);
    later(() => {
      newBalloon();
      busy = false;
    }, 2200);
  }

  /* ---------- Domino ---------- */

  let dominos = [];

  function setupDomino() {
    svg.innerHTML = `<rect class="c" x="-400" y="250" width="1200" height="3" rx="1.5"/>`;
    dominos = [];
    count = 0;
  }

  function dominoX(i, total) {
    const spacing = total > 1 ? Math.min(46, 280 / (total - 1)) : 0;
    const width = spacing * (total - 1);
    return 200 - width / 2 + i * spacing - 8;
  }

  function pressDomino() {
    const total = steps();
    count++;

    const g = svgEl("g", { class: "domino up" });
    const x = dominoX(count - 1, total);
    g.appendChild(svgEl("rect", { class: "a", x, y: 180, width: 16, height: 70, rx: 2 }));
    g.appendChild(svgEl("circle", { class: "k", cx: x + 8, cy: 200, r: 2.6 }));
    g.appendChild(svgEl("circle", { class: "k", cx: x + 8, cy: 230, r: 2.6 }));
    svg.appendChild(g);
    dominos.push(g);
    Sounds.place(count - 1);

    if (count < total) return;

    // Die Reihe fällt – Stein für Stein
    busy = true;
    later(() => {
      dominos.forEach((d, i) => {
        later(() => {
          d.classList.remove("up");
          d.style.transform = `rotate(${i === dominos.length - 1 ? 84 : 62}deg)`;
          Sounds.clack();
        }, i * 130);
      });
    }, 500);

    const fallen = 500 + dominos.length * 130;
    later(() => {
      const last = dominos[dominos.length - 1].getBoundingClientRect();
      Fx.burst(last.right, last.bottom, 24, currentTheme().b);
    }, fallen);
    later(() => dominos.forEach(d => { d.style.opacity = "0"; }), fallen + 1200);
    later(() => {
      setupDomino();
      busy = false;
    }, fallen + 2100);
  }

  /* ---------- Rakete ---------- */

  let rocket = null;
  let cells = [];

  function setupRocket() {
    svg.innerHTML = `<rect class="c" x="-400" y="262" width="1200" height="3" rx="1.5"/>`;

    // Sterne
    for (let i = 0; i < 46; i++) {
      svg.appendChild(svgEl("circle", {
        class: "b",
        cx: -200 + Math.random() * 800,
        cy: Math.random() * 220,
        r: 0.6 + Math.random() * 1.4,
        opacity: 0.25 + Math.random() * 0.5
      }));
    }

    rocket = svgEl("g", { class: "rocket-group" });
    rocket.innerHTML = `
      <path class="a" d="M200 120 C222 142 226 196 218 232 L182 232 C174 196 178 142 200 120 Z"/>
      <circle class="k" cx="200" cy="172" r="11"/><circle class="b" cx="200" cy="172" r="6"/>
      <path class="c" d="M182 204 L164 240 L184 232 Z M218 204 L236 240 L216 232 Z"/>
      <rect class="c" x="190" y="232" width="20" height="8" rx="2"/>`;
    svg.appendChild(rocket);

    resetFuel();
  }

  function resetFuel() {
    cells.forEach(c => c.remove());
    cells = [];
    count = 0;
    const total = steps();
    const cellHeight = Math.min(16, 130 / total - 4);
    for (let i = 0; i < total; i++) {
      const cell = svgEl("rect", { class: "a fuel-cell", x: 300, y: 250 - (i + 1) * (cellHeight + 4), width: 22, height: cellHeight, rx: 3, opacity: 0.15 });
      svg.appendChild(cell);
      cells.push(cell);
    }
  }

  function rocketNozzle() {
    const r = rocket.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.bottom };
  }

  function pressRocket() {
    if (cells.length !== steps()) resetFuel();

    count++;
    cells[count - 1].setAttribute("opacity", "1");

    rocket.classList.remove("shake");
    rocket.getBoundingClientRect();
    rocket.classList.add("shake");
    Sounds.rumble();
    const n = rocketNozzle();
    Fx.smoke(n.x, n.y, 6);

    if (count < steps()) return;

    busy = true;
    later(() => {
      Sounds.liftoff();
      rocket.classList.remove("shake");
      rocket.style.transform = "translateY(-460px)";
      const p = rocketNozzle();
      Fx.smoke(p.x, p.y, 26);
      flameTimer = setInterval(() => {
        const f = rocketNozzle();
        Fx.flame(f.x, f.y);
      }, 45);
    }, 700);
    later(() => {
      clearInterval(flameTimer);
      const w = window.innerWidth;
      const h = window.innerHeight;
      Fx.firework(w * 0.36, h * 0.24);
      later(() => Fx.firework(w * 0.62, h * 0.18), 260);
      Sounds.burst();
    }, 2700);
    later(() => {
      rocket.style.transition = "none";
      rocket.style.transform = "translateY(240px)";
      rocket.getBoundingClientRect();
      rocket.style.transition = "transform 1.4s cubic-bezier(.2,.8,.3,1)";
      rocket.style.transform = "";
      cells.forEach(c => c.setAttribute("opacity", "0.15"));
    }, 4300);
    later(() => {
      rocket.style.transition = "";
      count = 0;
      busy = false;
    }, 5800);
  }

  /* ---------- gemeinsam ---------- */

  const setup = { ballon: setupBalloon, domino: setupDomino, rakete: setupRocket };
  const press = { ballon: pressBalloon, domino: pressDomino, rakete: pressRocket };

  return {
    start(stageElement) {
      const wrap = document.createElement("div");
      wrap.className = "build-wrap";
      svg = svgEl("svg", { class: "build-svg ill", viewBox: "0 0 400 300", preserveAspectRatio: "xMidYMid meet" });
      wrap.appendChild(svg);
      stageElement.appendChild(wrap);
      setup[variant]();
    },

    press() {
      if (busy) return;
      press[variant]();
    },

    release() {},

    stop() {
      timers.forEach(clearTimeout);
      clearInterval(flameTimer);
      stopVoice();
    }
  };
}
