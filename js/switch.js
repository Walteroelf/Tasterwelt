/*
  Tasterabfrage.

  Taster-Adapter (per Kabel oder Bluetooth, z. B. iSwitch) melden sich am iPad
  als Tastatur und schicken z. B. Leertaste oder Enter. Hier wird daraus ein
  "Druck" und ein "Loslassen":

  - Welche Tasten zählen: jede Taste oder nur die gelernten (Einstellungen)
  - Bildschirm antippen zählt auf Wunsch auch
  - Auslösen beim Drücken oder beim Loslassen
  - Sperrzeit gegen Doppeldrücke; gedrückt gehaltene Tasten wiederholen nicht
  - Im Einstellungsfenster: Taster testen und Taste lernen
*/

const MODIFIER_KEYS = ["Shift", "Control", "Alt", "Meta", "CapsLock", "Fn", "Unidentified"];

const KEY_LABELS = {
  " ": "Leertaste",
  "Enter": "Enter",
  "ArrowLeft": "Pfeil links",
  "ArrowRight": "Pfeil rechts",
  "ArrowUp": "Pfeil hoch",
  "ArrowDown": "Pfeil runter",
  "Tab": "Tab",
  "Escape": "Escape",
  "Backspace": "Löschtaste"
};

function keyLabel(key) {
  return KEY_LABELS[key] || key.toUpperCase();
}

let switchIsDown = false;
let lastFire = -Infinity;
let learningKey = false;

function isSwitchKey(key) {
  return settings.anyKey || settings.keys.includes(key);
}

function anyModalOpen() {
  return [...document.querySelectorAll(".modal-backdrop")].some(el => !el.classList.contains("hidden"));
}

function settingsOpen() {
  return !document.getElementById("settingsScreen").classList.contains("hidden");
}

function codeOpen() {
  return !document.getElementById("codeScreen").classList.contains("hidden");
}

function switchDown() {
  if (switchIsDown) return;
  switchIsDown = true;
  if (settings.trigger === "press") fireSwitch();
}

function switchUp() {
  if (!switchIsDown) return;
  switchIsDown = false;
  if (settings.trigger === "release") fireSwitch();
  gameRelease();
}

function fireSwitch() {
  const now = performance.now();
  if (now - lastFire < Number(settings.lockMs)) {
    flashPressDot("ignored");
    return;
  }
  lastFire = now;
  flashPressDot("ok");
  gamePress();
}

/* ---------- Tastatur (= Taster) ---------- */

document.addEventListener("keydown", event => {
  if (MODIFIER_KEYS.includes(event.key)) return;

  if (codeOpen()) return;   // dort tippt die Lehrkraft Zahlen (teacher.js)

  if (settingsOpen()) {
    switchTestKey(event, true);
    return;
  }

  if (!activeGame) {
    showSwitchStatus(event.key);
    return;
  }

  if (anyModalOpen() || !isSwitchKey(event.key)) return;

  // Kein Scrollen, kein Auslösen von Knöpfen
  event.preventDefault();
  if (event.repeat) return;
  switchDown();
});

document.addEventListener("keyup", event => {
  if (MODIFIER_KEYS.includes(event.key)) return;

  if (settingsOpen()) {
    switchTestKey(event, false);
    return;
  }

  if (!activeGame || !isSwitchKey(event.key)) return;
  event.preventDefault();
  switchUp();
});

// Wechselt die App in den Hintergrund, gilt der Taster als losgelassen
window.addEventListener("blur", () => {
  if (switchIsDown) {
    switchIsDown = false;
    gameRelease();
  }
});

/* ---------- Bildschirm als Taster ---------- */

const activePointers = new Set();

playScreen.addEventListener("pointerdown", event => {
  if (event.target.closest(".play-top button")) return;
  if (!settings.screenTap || anyModalOpen()) return;
  unlockAudio();
  activePointers.add(event.pointerId);
  switchDown();
});

["pointerup", "pointercancel"].forEach(type => {
  playScreen.addEventListener(type, event => {
    if (!activePointers.delete(event.pointerId)) return;
    if (activePointers.size === 0) switchUp();
  });
});

// Kein Kontextmenü / keine Lupe beim langen Drücken
playScreen.addEventListener("contextmenu", event => event.preventDefault());

/* ---------- Startseite: zeigen, dass der Taster ankommt ---------- */

let statusTimer = null;

function showSwitchStatus(key) {
  if (document.activeElement && document.activeElement.matches("input, select, textarea")) return;
  const status = document.getElementById("switchStatus");
  status.textContent = "✓ Taster erkannt: " + keyLabel(key) + (isSwitchKey(key) ? "" : " (zählt nicht – siehe Einstellungen)");
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => { status.textContent = ""; }, 4000);
}

/* ---------- Einstellungen: Taster testen und Taste lernen ---------- */

const switchTest = document.getElementById("switchTest");
const switchTestDot = document.getElementById("switchTestDot");
const switchTestText = document.getElementById("switchTestText");

function switchTestKey(event, down) {
  // In Eingabefeldern normal tippen lassen
  if (!learningKey && event.target.matches && event.target.matches("input[type=text], select")) return;

  if (learningKey && down) {
    event.preventDefault();
    learningKey = false;
    switchTest.classList.remove("learning");
    if (!settings.keys.includes(event.key)) settings.keys.push(event.key);
    settings.anyKey = false;
    saveSettings();
    applySettingsToForm();
    switchTestText.textContent = "Gelernt: " + keyLabel(event.key) + ". Ab jetzt zählt nur noch diese Taste (und die anderen in der Liste).";
    return;
  }

  if (event.key === " " || event.key === "Enter") event.preventDefault();
  if (event.repeat) return;

  switchTestDot.classList.toggle("down", down);
  if (down) {
    switchTestText.textContent = "Angekommen: " + keyLabel(event.key) +
      (isSwitchKey(event.key) ? " ✓ zählt als Taster" : " – zählt im Moment nicht");
  }
}

function startLearningKey() {
  learningKey = true;
  switchTest.classList.add("learning");
  switchTestText.textContent = "Jetzt den Taster drücken …";
  if (document.activeElement) document.activeElement.blur();
}
