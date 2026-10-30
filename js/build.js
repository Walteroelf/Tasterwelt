/*
  Baustein 3: Aufbauen.

  Jeder Druck baut ein Stück weiter. Nach der eingestellten Zahl von Drücken
  (Einstellungen → Aufbauen) passiert das große Ereignis:
  - Ballon: wird aufgepumpt und platzt
  - Turm:   Steine stapeln sich und der Turm fällt um
  - Rakete: wird betankt und hebt ab
*/

const BALLOON_COLORS = ["#e63946", "#3d7ab8", "#f2b531", "#2a9d8f", "#9b5de5", "#f15bb5", "#f4a261"];

function createBuildGame(variant) {
  const steps = () => Number(settings.steps) || 5;
  let stage = null;
  let wrap = null;
  let count = 0;
  let busy = false;
  let round = 0;
  const timers = [];

  function later(fn, ms) {
    timers.push(setTimeout(fn, ms));
  }

  /* ---------- Ballon ---------- */

  let balloonBody = null;
  let balloonSvg = null;
  let pump = null;

  function setupBalloon() {
    wrap.innerHTML = `
      <svg class="balloon" viewBox="0 0 200 440" aria-hidden="true">
        <path d="M100 236 C 92 300, 112 340, 100 440" stroke="#6b3f22" stroke-width="3" fill="none"/>
        <g class="balloon-body">
          <ellipse cx="100" cy="128" rx="82" ry="102" class="balloon-fill"/>
          <path d="M90 236 L110 236 L100 222 Z" class="balloon-fill"/>
          <ellipse cx="68" cy="82" rx="16" ry="30" fill="#fff" opacity=".45" transform="rotate(25 68 82)"/>
        </g>
      </svg>
      <svg class="pump" viewBox="0 0 160 120" aria-hidden="true">
        <g class="pump-handle">
          <rect x="40" y="4" width="80" height="14" rx="7" fill="#6b3f22"/>
          <rect x="74" y="16" width="12" height="40" fill="#8a6a52"/>
        </g>
        <rect x="56" y="50" width="48" height="66" rx="10" fill="#3d7ab8" stroke="#6b3f22" stroke-width="5"/>
      </svg>
      <div class="press-hint">Drück den Taster!</div>`;

    balloonSvg = wrap.querySelector(".balloon");
    balloonBody = wrap.querySelector(".balloon-body");
    pump = wrap.querySelector(".pump");
    newBalloon();
  }

  function newBalloon() {
    const color = BALLOON_COLORS[round % BALLOON_COLORS.length];
    balloonSvg.querySelectorAll(".balloon-fill").forEach(el => el.setAttribute("fill", color));
    balloonBody.style.transition = "none";
    balloonBody.style.opacity = "1";
    balloonBody.style.transform = "scale(0.22)";
    balloonBody.getBoundingClientRect();
    balloonBody.style.transition = "";
    count = 0;
  }

  function pressBalloon() {
    count++;
    const progress = count / steps();
    wrap.querySelector(".press-hint")?.remove();

    pump.classList.add("push");
    later(() => pump.classList.remove("push"), 200);
    Sounds.pump(progress);

    if (count < steps()) {
      balloonBody.style.transform = `scale(${0.22 + 0.78 * progress})`;
      balloonSvg.classList.remove("wobble");
      balloonSvg.getBoundingClientRect();
      balloonSvg.classList.add("wobble");
      return;
    }

    // Letzter Druck: noch etwas größer – dann Peng!
    busy = true;
    balloonBody.style.transform = "scale(1.12)";
    later(() => {
      const c = centerOf(balloonBody);
      balloonBody.style.transition = "none";
      balloonBody.style.opacity = "0";
      Sounds.pop();
      Fx.confetti(c.x, c.y, 140);
      speak("Peng!");
    }, 450);
    later(() => {
      round++;
      newBalloon();
      busy = false;
    }, 2200);
  }

  /* ---------- Turm ---------- */

  let blocks = [];

  function setupTower() {
    wrap.innerHTML = `<div class="ground"></div><div class="press-hint">Drück den Taster!</div>`;
    blocks = [];
    count = 0;
  }

  function pressTower() {
    wrap.querySelector(".press-hint")?.remove();
    count++;

    const total = steps();
    const blockHeight = Math.min(14, 66 / total);   // in vh
    const block = document.createElement("div");
    block.className = "tower-block drop";
    block.style.height = blockHeight + "vh";
    block.style.width = "30vh";
    block.style.marginLeft = (-15 + (Math.random() - 0.5) * 3) + "vh";
    block.style.bottom = (8 + (count - 1) * blockHeight) + "vh";
    block.style.background = BALLOON_COLORS[(count + round) % BALLOON_COLORS.length];
    wrap.appendChild(block);
    blocks.push(block);

    later(() => Sounds.knock(), 380);

    if (count < total) return;

    busy = true;
    later(() => {
      Sounds.crash();
      speak("Bumm!");
      const direction = Math.random() < 0.5 ? -1 : 1;
      blocks.forEach((b, i) => {
        const height = i / blocks.length;
        b.style.transitionDelay = (0.25 * (1 - height)) + "s";
        b.style.transform = `translate(${direction * (20 + height * 60)}vw, ${10 + Math.random() * 10}vh) rotate(${direction * (60 + Math.random() * 80)}deg)`;
        b.style.opacity = "0";
      });
    }, 900);
    later(() => {
      blocks.forEach(b => b.remove());
      blocks = [];
      count = 0;
      round++;
      busy = false;
    }, 2700);
  }

  /* ---------- Rakete ---------- */

  let rocket = null;
  let fuel = null;
  let flameTimer = null;

  function setupRocket() {
    wrap.innerHTML = `
      <div class="sky">
        <div class="press-hint">Drück den Taster!</div>
      </div>
      <div class="ground"></div>
      <div class="rocket"><span class="rocket-inner">🚀</span></div>
      <div class="fuel"></div>`;

    // Ein paar Sterne
    const sky = wrap.querySelector(".sky");
    for (let i = 0; i < 40; i++) {
      const star = document.createElement("span");
      const size = 2 + Math.random() * 3;
      star.style.cssText = `position:absolute;left:${Math.random() * 100}%;top:${Math.random() * 60}%;width:${size}px;height:${size}px;border-radius:50%;background:#fff;opacity:${0.4 + Math.random() * 0.6}`;
      sky.appendChild(star);
    }

    rocket = wrap.querySelector(".rocket");
    fuel = wrap.querySelector(".fuel");
    resetFuel();
  }

  function resetFuel() {
    count = 0;
    fuel.innerHTML = "";
    for (let i = 0; i < steps(); i++) fuel.appendChild(document.createElement("span"));
  }

  function rocketBottom() {
    const r = rocket.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.bottom - r.height * 0.1 };
  }

  function pressRocket() {
    wrap.querySelector(".press-hint")?.remove();
    if (fuel.children.length !== steps()) resetFuel();

    count++;
    fuel.children[count - 1].classList.add("full");

    rocket.classList.remove("shake");
    rocket.getBoundingClientRect();
    rocket.classList.add("shake");
    Sounds.rumble();
    const b = rocketBottom();
    Fx.smoke(b.x, b.y, 8);

    if (count < steps()) return;

    busy = true;
    speak("Drei, zwei, eins, los!");
    later(() => {
      Sounds.liftoff();
      rocket.classList.remove("shake");
      rocket.classList.add("launch");
      const p = rocketBottom();
      Fx.smoke(p.x, p.y, 30);
      flameTimer = setInterval(() => {
        const f = rocketBottom();
        Fx.flame(f.x, f.y);
      }, 50);
    }, 1400);
    later(() => {
      clearInterval(flameTimer);
      const w = window.innerWidth;
      const h = window.innerHeight;
      Fx.firework(w * 0.3, h * 0.25);
      later(() => Fx.firework(w * 0.7, h * 0.2), 300);
      Sounds.bang();
    }, 3000);
    later(() => {
      // Neue Rakete kommt von unten auf die Startrampe
      rocket.classList.remove("launch");
      rocket.classList.add("back");
      rocket.getBoundingClientRect();
      rocket.style.transition = "transform 1s ease-out";
      rocket.classList.remove("back");
      resetFuel();
    }, 4200);
    later(() => {
      rocket.style.transition = "";
      busy = false;
    }, 5300);
  }

  /* ---------- gemeinsam ---------- */

  const setup = { ballon: setupBalloon, turm: setupTower, rakete: setupRocket };
  const press = { ballon: pressBalloon, turm: pressTower, rakete: pressRocket };

  return {
    title: BUILD_VARIANTS.find(v => v.id === variant).name,

    start(stageElement) {
      stage = stageElement;
      wrap = document.createElement("div");
      wrap.className = "build-wrap";
      stage.appendChild(wrap);
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
