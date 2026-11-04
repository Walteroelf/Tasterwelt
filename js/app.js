/*
  Tasterwelt – Ursache und Wirkung mit dem Taster.

  Hier: Einstellungen laden/speichern, Startseite aufbauen, Übungen starten
  und beenden, Erinnerung und Druck-Anzeige. Die Bausteine stehen in
  story.js, reveal.js, build.js und effect.js; die Tasterabfrage in switch.js.

  Jeder Baustein liefert ein Objekt mit start(stage), press(), release(), stop().
*/

const SETTINGS_KEY = "tasterwelt-einstellungen";

const DEFAULT_SETTINGS = {
  anyKey: true,
  keys: [" ", "Enter"],
  screenTap: true,
  trigger: "press",
  lockMs: 600,
  reminder: 0,
  pressDot: true,
  theme: "nacht",
  showText: true,
  speech: true,
  naturalVoice: true,
  voiceName: "",
  rate: "0.85",
  sounds: true,
  pop: "laut",
  tiles: "6",
  steps: "5",
  hold: false,
  calm: false,
  codeLock: true
};

const settings = loadSettings();

function loadSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    return { ...DEFAULT_SETTINGS, ...stored };
  } catch (error) {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    // z. B. privater Modus – dann gelten die Einstellungen nur bis zum Neuladen
  }
}

const homeScreen = document.getElementById("homeScreen");
const playScreen = document.getElementById("playScreen");
const stage = document.getElementById("stage");
const reminder = document.getElementById("reminder");
const pressDot = document.getElementById("pressDot");

let ownCollections = [];
let activeGame = null;
let reminderTimer = null;
let dotTimer = null;

function allCollections() {
  return [...BUILTIN_COLLECTIONS, ...ownCollections];
}

/* ---------- Startseite ---------- */

function makeCard({ thumbPage, title, note, onClick }) {
  const button = document.createElement("button");
  button.className = "play-card";
  button.appendChild(makeThumb(thumbPage));

  const t = document.createElement("span");
  t.className = "card-title";
  t.textContent = title;
  button.appendChild(t);

  if (note) {
    const n = document.createElement("span");
    n.className = "card-note";
    n.textContent = note;
    button.appendChild(n);
  }

  button.addEventListener("click", onClick);
  return button;
}

function pagesNote(collection) {
  const n = collection.pages.length;
  return n === 1 ? "1 Seite" : n + " Seiten";
}

/* Erstes Bild einer Sammlung – für die Vorschau */
function coverPage(collection, offset = 0) {
  const withPicture = collection.pages.filter(hasPicture);
  return withPicture[Math.min(offset, withPicture.length - 1)] || collection.pages[0];
}

async function renderHome() {
  ownCollections = await getOwnCollections();
  const collections = allCollections().filter(c => c.pages.length > 0);

  const storyCards = document.getElementById("storyCards");
  const revealCards = document.getElementById("revealCards");
  const buildCards = document.getElementById("buildCards");
  const effectCards = document.getElementById("effectCards");
  [storyCards, revealCards, buildCards, effectCards].forEach(el => { el.innerHTML = ""; });

  collections.forEach(collection => {
    storyCards.appendChild(makeCard({
      thumbPage: coverPage(collection),
      title: collection.name,
      note: pagesNote(collection),
      onClick: () => startGame(createStoryGame(collection))
    }));

    if (collection.pages.some(p => hasPicture(p) || p.video)) {
      revealCards.appendChild(makeCard({
        thumbPage: coverPage(collection, 2),
        title: collection.name,
        note: pagesNote(collection),
        onClick: () => startGame(createRevealGame(collection))
      }));
    }
  });

  BUILD_VARIANTS.forEach(variant => {
    buildCards.appendChild(makeCard({
      thumbPage: { svg: variant.svg },
      title: variant.name,
      note: variant.note,
      onClick: () => startGame(createBuildGame(variant.id))
    }));
  });

  EFFECT_VARIANTS.forEach(variant => {
    effectCards.appendChild(makeCard({
      thumbPage: { svg: variant.svg },
      title: variant.name,
      note: variant.note,
      onClick: () => startGame(createEffectGame(variant.id))
    }));
  });

  collections.forEach(collection => {
    effectCards.appendChild(makeCard({
      thumbPage: coverPage(collection, 1),
      title: "Überraschung",
      note: collection.name + " – zufällige Bilder",
      onClick: () => startGame(createEffectGame("ueberraschung", collection))
    }));
  });

  renderOwnList();
}

function renderOwnList() {
  const list = document.getElementById("ownList");
  list.innerHTML = "";

  allCollections().forEach(collection => {
    const row = document.createElement("div");
    row.className = "own-row";
    row.appendChild(makeThumb(coverPage(collection)));

    const name = document.createElement("span");
    name.className = "own-row-name";
    name.textContent = collection.name;
    const small = document.createElement("small");
    small.textContent = (collection.builtin ? "Vorlage · " : "") + pagesNote(collection);
    name.appendChild(small);
    row.appendChild(name);

    const edit = document.createElement("button");
    edit.className = "small";
    edit.textContent = collection.builtin ? "Als Kopie bearbeiten" : "Bearbeiten";
    edit.addEventListener("click", () => openEditor(collection));
    row.appendChild(edit);

    list.appendChild(row);
  });
}

/* ---------- Übung starten und beenden ---------- */

function startGame(game) {
  unlockAudio();
  stopGame();

  activeGame = game;
  stage.innerHTML = "";
  document.body.classList.toggle("calm", settings.calm);

  homeScreen.classList.add("hidden");
  playScreen.classList.remove("hidden");

  // Kein Knopf darf den Fokus haben – sonst würde "Enter" vom Taster ihn auslösen
  if (document.activeElement) document.activeElement.blur();

  Fx.resize();
  Fx.clear();
  game.start(stage);
  restartReminder();
}

function stopGame() {
  if (!activeGame) return;
  activeGame.stop();
  activeGame = null;
  Fx.clear();
  stage.innerHTML = "";
  clearTimeout(reminderTimer);
  reminder.classList.add("hidden");
}

function backToHome() {
  stopGame();
  playScreen.classList.add("hidden");
  homeScreen.classList.remove("hidden");
  renderHome();
}

/* Wird von switch.js aufgerufen, wenn ein Druck zählt (nach der Sperrzeit) */
function gamePress() {
  if (!activeGame) return;
  reminder.classList.add("hidden");
  restartReminder();
  activeGame.press();
}

function gameRelease() {
  if (activeGame) activeGame.release();
}

/* ---------- Erinnerung ---------- */

function restartReminder() {
  clearTimeout(reminderTimer);
  const seconds = Number(settings.reminder);
  if (!seconds || !activeGame) return;

  reminderTimer = setTimeout(() => {
    if (!activeGame) return;
    reminder.classList.remove("hidden");
    Sounds.remind();
    restartReminder();
  }, seconds * 1000);
}

/* ---------- Druck-Anzeige ---------- */

function flashPressDot(kind) {
  if (!settings.pressDot) return;
  pressDot.className = "press-dot " + kind;
  clearTimeout(dotTimer);
  dotTimer = setTimeout(() => { pressDot.className = "press-dot"; }, 250);
}

/* ---------- Start ---------- */

document.getElementById("playBackButton").addEventListener("click", () => {
  if (settings.codeLock) askForCode(backToHome);
  else backToHome();
});

applyTheme();
Fx.init();
loadSounds();
renderHome();
