/*
  Farbwelten der Spielfläche.

  a = Hauptfarbe (das leuchtende Objekt), b und c = Begleitfarben,
  text = Schriftfarbe. Die CVI-Farbwelten bleiben bei einer kräftigen Farbe
  auf Schwarz – so wenig visuelle Unruhe wie möglich.
*/

const THEMES = {
  nacht: { bg: "#0e1116", a: "#ffd23f", b: "#4cc9f0", c: "#ff6b4a", text: "#f4f1ea", particles: ["#ffd23f", "#4cc9f0", "#ff6b4a", "#f4f1ea"] },
  gelb:  { bg: "#000000", a: "#ffd400", b: "#ffffff", c: "#ffd400", text: "#ffd400", particles: ["#ffd400"] },
  rot:   { bg: "#000000", a: "#ff2d20", b: "#ffd400", c: "#ff2d20", text: "#ffffff", particles: ["#ff2d20"] },
  weiss: { bg: "#000000", a: "#ffffff", b: "#ffd400", c: "#9aa5b1", text: "#ffffff", particles: ["#ffffff"] },
  hell:  { bg: "#f4f1ea", a: "#1d1d1b", b: "#c4462f", c: "#2f5d62", text: "#1d1d1b", particles: ["#1d1d1b", "#c4462f", "#2f5d62"] }
};

function currentTheme() {
  return THEMES[settings.theme] || THEMES.nacht;
}

function applyTheme() {
  const t = currentTheme();
  const root = document.documentElement.style;
  root.setProperty("--st-bg", t.bg);
  root.setProperty("--st-a", t.a);
  root.setProperty("--st-b", t.b);
  root.setProperty("--st-c", t.c);
  root.setProperty("--st-text", t.text);
}

function randomParticleColor() {
  const list = currentTheme().particles;
  return list[Math.floor(Math.random() * list.length)];
}

/* Farbe mit Deckkraft – für Leuchten auf der Zeichenfläche */
function withAlpha(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
