/*
  Einstellungen für die Lehrkraft – über das Zahnrad, auf der Startseite und
  mitten in einer Übung. Wie in Bilderwahl und im Kirmes-Kiosk fragt die App
  vorher einen Zahlen-Code ab: vier Zahlen werden als Wörter angezeigt
  ("drei – sieben – eins – vier"). Der Code schützt auch das Haus (Zurück).
*/

const NUMBER_WORDS = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"];

const codeScreen = document.getElementById("codeScreen");
const codeWords = document.getElementById("codeWords");
const codeDots = document.getElementById("codeDots");
const keypad = document.getElementById("keypad");
const codeError = document.getElementById("codeError");
const settingsScreen = document.getElementById("settingsScreen");

let expectedCode = "";
let enteredCode = "";
let afterCode = null;

function requestSettings() {
  if (settings.codeLock) askForCode(openSettingsScreen);
  else openSettingsScreen();
}

document.getElementById("homeGearButton").addEventListener("click", requestSettings);
document.getElementById("playGearButton").addEventListener("click", requestSettings);

keypad.addEventListener("click", event => {
  const key = event.target.closest("button[data-key]");
  if (key) pressCodeKey(key.dataset.key);
});

document.addEventListener("keydown", event => {
  if (codeScreen.classList.contains("hidden")) return;

  if (/^[0-9]$/.test(event.key)) pressCodeKey(event.key);
  else if (event.key === "Backspace") pressCodeKey("back");
  else if (event.key === "Escape") pressCodeKey("cancel");
});

function askForCode(onSuccess) {
  afterCode = onSuccess;
  newCode();
  codeError.textContent = "";
  codeScreen.classList.remove("hidden");
}

function newCode() {
  expectedCode = Array.from({ length: 4 }, () => String(Math.floor(Math.random() * 10))).join("");
  enteredCode = "";
  codeWords.textContent = [...expectedCode].map(digit => NUMBER_WORDS[digit]).join(" – ");
  updateCodeDots();
}

function updateCodeDots() {
  [...codeDots.children].forEach((dot, index) => dot.classList.toggle("filled", index < enteredCode.length));
}

function pressCodeKey(key) {
  if (key === "cancel") {
    codeScreen.classList.add("hidden");
    afterCode = null;
    if (document.activeElement) document.activeElement.blur();
    return;
  }

  if (key === "back") {
    enteredCode = enteredCode.slice(0, -1);
    updateCodeDots();
    return;
  }

  if (enteredCode.length >= 4) return;

  enteredCode += key;
  updateCodeDots();

  if (enteredCode.length < 4) return;

  if (enteredCode === expectedCode) {
    codeScreen.classList.add("hidden");
    const next = afterCode;
    afterCode = null;
    if (next) next();
    return;
  }

  // Falsch: neue Zahlen, damit nicht einfach probiert werden kann
  codeError.textContent = "Das war nicht richtig. Bitte die neuen Zahlen eintippen.";
  setTimeout(newCode, 400);
}

/* ---------- Einstellungsfenster ---------- */

const form = {
  anyKey: document.getElementById("anyKeyToggle"),
  screenTap: document.getElementById("screenTapToggle"),
  trigger: document.getElementById("triggerSelect"),
  lockMs: document.getElementById("lockSelect"),
  reminder: document.getElementById("reminderSelect"),
  pressDot: document.getElementById("pressDotToggle"),
  theme: document.getElementById("themeSelect"),
  showText: document.getElementById("showTextToggle"),
  speech: document.getElementById("speechToggle"),
  naturalVoice: document.getElementById("naturalVoiceToggle"),
  voiceName: document.getElementById("voiceSelect"),
  rate: document.getElementById("rateSelect"),
  sounds: document.getElementById("soundsToggle"),
  pop: document.getElementById("popSelect"),
  tiles: document.getElementById("tilesSelect"),
  steps: document.getElementById("stepsSelect"),
  hold: document.getElementById("holdToggle"),
  calm: document.getElementById("calmToggle"),
  codeLock: document.getElementById("codeLockToggle")
};

function applySettingsToForm() {
  for (const [name, input] of Object.entries(form)) {
    if (input.type === "checkbox") input.checked = Boolean(settings[name]);
    else input.value = String(settings[name]);
  }

  document.getElementById("keyBox").classList.toggle("hidden", settings.anyKey);
  renderKeyList();
}

function renderKeyList() {
  const list = document.getElementById("keyList");
  list.innerHTML = "";

  if (settings.keys.length === 0) {
    list.innerHTML = `<span class="hint">Noch keine Taste – bitte „Taste lernen“.</span>`;
  }

  settings.keys.forEach(key => {
    const chip = document.createElement("span");
    chip.className = "key-chip";
    chip.textContent = keyLabel(key);
    const remove = document.createElement("button");
    remove.textContent = "✕";
    remove.setAttribute("aria-label", keyLabel(key) + " entfernen");
    remove.addEventListener("click", () => {
      settings.keys = settings.keys.filter(k => k !== key);
      saveSettings();
      renderKeyList();
    });
    chip.appendChild(remove);
    list.appendChild(chip);
  });
}

for (const [name, input] of Object.entries(form)) {
  input.addEventListener("change", () => {
    settings[name] = input.type === "checkbox" ? input.checked : input.value;
    if (name === "lockMs" || name === "reminder") settings[name] = Number(input.value);

    // Ohne Taste in der Liste würde gar nichts mehr zählen
    if (name === "anyKey" && !settings.anyKey && settings.keys.length === 0) settings.keys = [" ", "Enter"];

    saveSettings();
    applySettingsToForm();
    document.body.classList.toggle("calm", settings.calm);
    if (name === "theme") applyTheme();
    if (name === "reminder") restartReminder();
    if (name === "pop") Sounds.pop();
  });
}

document.getElementById("learnKeyButton").addEventListener("click", startLearningKey);

/* Deutsche Gerätestimmen zur Auswahl – bessere zuerst */
function renderVoiceOptions() {
  const select = document.getElementById("voiceSelect");
  select.innerHTML = "";
  const auto = document.createElement("option");
  auto.value = "";
  auto.textContent = germanVoices.length ? "automatisch (" + germanVoices[0].name + ")" : "automatisch";
  select.appendChild(auto);
  germanVoices.forEach(v => {
    const option = document.createElement("option");
    option.value = v.name;
    option.textContent = v.name;
    select.appendChild(option);
  });
  select.value = settings.voiceName || "";
}

document.getElementById("voiceTestButton").addEventListener("click", () => {
  unlockAudio();
  speakDevice("Hallo! So klingt diese Stimme.");
});

function openSettingsScreen() {
  renderVoiceOptions();
  applySettingsToForm();
  updateOfflineStatus();
  document.getElementById("settingsEndButton").classList.toggle("hidden", !activeGame);
  document.getElementById("switchTestText").textContent = "Taster testen – jetzt einmal drücken";
  settingsScreen.classList.remove("hidden");
  settingsScreen.querySelector(".modal").scrollTop = 0;
  if (document.activeElement) document.activeElement.blur();
}

function closeSettingsScreen() {
  learningKey = false;
  document.getElementById("switchTest").classList.remove("learning");
  settingsScreen.classList.add("hidden");
  if (document.activeElement) document.activeElement.blur();
}

document.getElementById("settingsCloseButton").addEventListener("click", () => {
  closeSettingsScreen();
  if (activeGame) restartReminder();
});

document.getElementById("settingsEndButton").addEventListener("click", () => {
  closeSettingsScreen();
  backToHome();
});
