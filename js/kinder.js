/*
  Kinder und Beobachtung.

  Auf der Startseite wird ein Kind gewählt (oder „Ohne Kind“). Nach jeder Übung mit
  Tasterdrücken fragt die App kurz: Wie war es? Die Lehrkraft hakt Merkmale an,
  wählt „gut / mittel / schwer“ und kann eine Notiz schreiben. Die Zahl der Drücke und
  die Dauer trägt die App selbst ein.

  Pro Kind gibt es einen Verlauf – zum Drucken (Förderplan, Gespräche) und zum Sichern.
  Alles bleibt auf diesem Gerät (IndexedDB, siehe db.js).
*/

const OBS_TAGS = [
  ["blick", "Blick zugewandt", "good"],
  ["laecheln", "Lächeln / Lachen", "good"],
  ["laut", "Lautiert", "good"],
  ["ruhig", "Atmung ruhiger", "good"],
  ["selbst", "Drückt selbst", "good"],
  ["hilfe", "Mit Hilfe (Hand unter Hand)", "neutral"],
  ["wartet", "Wartet gespannt", "neutral"],
  ["spannung", "Spannung steigt", "bad"],
  ["abwenden", "Wendet sich ab", "bad"],
  ["unruhe", "Unruhe, Weinen", "bad"]
];

const OBS_RATINGS = [["gut", "Lief gut"], ["mittel", "Mittel"], ["schwer", "Schwierig"]];

const kidSelect = document.getElementById("kidSelect");
const kidManageButton = document.getElementById("kidManageButton");
const kidHistoryButton = document.getElementById("kidHistoryButton");
const kidScreen = document.getElementById("kidScreen");
const kidModal = document.getElementById("kidModal");
const histScreen = document.getElementById("histScreen");
const histModal = document.getElementById("histModal");
const obsScreen = document.getElementById("obsScreen");
const obsModal = document.getElementById("obsModal");
const printArea = document.getElementById("printArea");

let kids = [];

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(label, onClick, className = "") {
  const b = el("button", className, label);
  b.type = "button";
  b.addEventListener("click", onClick);
  return b;
}

function currentKid() {
  return kids.find(k => k.id === settings.kidId) || null;
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m + ":" + String(s).padStart(2, "0") + " min";
}

function formatDate(ms) {
  return new Date(ms).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function tagLabel(id) {
  const tag = OBS_TAGS.find(t => t[0] === id);
  return tag ? tag[1] : id;
}

/* ---------- Auswahl auf der Startseite ---------- */

async function renderKidBar() {
  kids = await getKids();

  // Gelöschtes Kind: Auswahl zurücksetzen
  if (settings.kidId && !currentKid()) {
    settings.kidId = "";
    saveSettings();
  }

  kidSelect.innerHTML = "";
  const none = el("option", "", "Ohne Kind – keine Beobachtung");
  none.value = "";
  kidSelect.appendChild(none);
  kids.forEach(kid => {
    const option = el("option", "", kid.name);
    option.value = kid.id;
    kidSelect.appendChild(option);
  });
  kidSelect.value = settings.kidId || "";
  kidHistoryButton.classList.toggle("hidden", !currentKid());
}

kidSelect.addEventListener("change", () => {
  settings.kidId = kidSelect.value;
  saveSettings();
  kidHistoryButton.classList.toggle("hidden", !currentKid());
});

kidHistoryButton.addEventListener("click", () => {
  const kid = currentKid();
  if (kid) openHistory(kid);
});

kidManageButton.addEventListener("click", openKidManager);

/* ---------- Kinder verwalten ---------- */

function openModal(screen) {
  screen.classList.remove("hidden");
  const modal = screen.querySelector(".modal");
  if (modal) modal.scrollTop = 0;
  if (document.activeElement) document.activeElement.blur();
}

function closeModal(screen) {
  screen.classList.add("hidden");
  if (document.activeElement) document.activeElement.blur();
}

async function openKidManager() {
  kids = await getKids();
  kidModal.innerHTML = "";
  kidModal.appendChild(el("h2", "", "Kinder"));
  kidModal.appendChild(el("p", "hint", "Nur Vornamen oder Kürzel eintragen. Alles bleibt auf diesem Gerät. Nach jeder Übung kann kurz festgehalten werden, wie es war."));

  const list = el("div", "kid-list");
  if (!kids.length) list.appendChild(el("p", "hint", "Noch kein Kind angelegt."));

  kids.forEach(kid => {
    const row = el("div", "kid-row");
    row.appendChild(el("span", "kid-name", kid.name));
    row.appendChild(button("Verlauf", () => { closeModal(kidScreen); openHistory(kid); }, "small"));
    row.appendChild(button("Löschen", async () => {
      if (!confirm("„" + kid.name + "“ und alle Beobachtungen wirklich löschen? Das lässt sich nicht rückgängig machen.")) return;
      await deleteKid(kid.id);
      if (settings.kidId === kid.id) {
        settings.kidId = "";
        saveSettings();
      }
      await renderKidBar();
      openKidManager();
    }, "small danger"));
    list.appendChild(row);
  });
  kidModal.appendChild(list);

  const input = el("input", "text-input");
  input.type = "text";
  input.placeholder = "Name oder Kürzel";
  input.maxLength = 40;
  input.setAttribute("aria-label", "Name des Kindes");

  const add = async () => {
    const name = input.value.trim();
    if (!name) return;
    const kid = { id: createId(), name, createdAt: Date.now() };
    await saveKid(kid);
    settings.kidId = kid.id;
    saveSettings();
    await renderKidBar();
    openKidManager();
  };
  input.addEventListener("keydown", event => { if (event.key === "Enter") add(); });

  const row = el("div", "button-row");
  row.appendChild(input);
  row.appendChild(button("Hinzufügen", add, "primary"));
  kidModal.appendChild(row);

  const actions = el("div", "button-row modal-actions");
  actions.appendChild(button("Fertig", () => closeModal(kidScreen), "primary"));
  kidModal.appendChild(actions);

  openModal(kidScreen);
}

/* ---------- Beobachtung nach der Übung ---------- */

function askObservation(meta) {
  const kid = currentKid();
  if (!kid || meta.presses < 1) return;

  const picked = new Set();
  let rating = "";

  obsModal.innerHTML = "";
  obsModal.appendChild(el("h2", "", "Wie war es?"));
  obsModal.appendChild(el("p", "obs-facts",
    kid.name + " · " + meta.title + " · " + meta.presses + (meta.presses === 1 ? " Druck" : " Drücke") + " in " + formatDuration(meta.seconds)));

  obsModal.appendChild(el("h3", "obs-head", "Was war zu sehen?"));
  const tagBox = el("div", "obs-tags");
  OBS_TAGS.forEach(([id, label, tone]) => {
    const b = button(label, () => {
      if (picked.has(id)) picked.delete(id);
      else picked.add(id);
      b.setAttribute("aria-pressed", String(picked.has(id)));
    }, "tag-button " + tone);
    b.setAttribute("aria-pressed", "false");
    tagBox.appendChild(b);
  });
  obsModal.appendChild(tagBox);

  obsModal.appendChild(el("h3", "obs-head", "Insgesamt"));
  const ratingBox = el("div", "obs-tags");
  OBS_RATINGS.forEach(([id, label]) => {
    const b = button(label, () => {
      rating = rating === id ? "" : id;
      [...ratingBox.children].forEach(child => child.setAttribute("aria-pressed", String(child.dataset.id === rating)));
    }, "tag-button");
    b.dataset.id = id;
    b.setAttribute("aria-pressed", "false");
    ratingBox.appendChild(b);
  });
  obsModal.appendChild(ratingBox);

  obsModal.appendChild(el("h3", "obs-head", "Notiz"));
  const note = el("textarea", "text-input obs-note");
  note.rows = 3;
  note.placeholder = "Zum Beispiel: Hat nach dem dritten Druck gelächelt. Lieber ohne Ton.";
  obsModal.appendChild(note);

  const actions = el("div", "button-row modal-actions");
  actions.appendChild(button("Speichern", async () => {
    await saveLog({
      id: createId(),
      kidId: kid.id,
      at: meta.startedAt,
      title: meta.title,
      kind: meta.kind,
      presses: meta.presses,
      seconds: meta.seconds,
      tags: [...picked],
      rating,
      note: note.value.trim()
    });
    closeModal(obsScreen);
  }, "primary"));
  actions.appendChild(button("Nicht speichern", () => closeModal(obsScreen)));
  obsModal.appendChild(actions);

  openModal(obsScreen);
}

/* ---------- Verlauf ---------- */

async function openHistory(kid) {
  const logs = await getLogs(kid.id);

  histModal.innerHTML = "";
  histModal.appendChild(el("h2", "", "Verlauf: " + kid.name));

  if (!logs.length) {
    histModal.appendChild(el("p", "hint", "Noch keine Beobachtung. Sie entsteht nach jeder Übung, wenn dieses Kind auf der Startseite gewählt ist."));
  } else {
    // Kurzüberblick: wie oft wurde was gemacht, wie oft gedrückt
    const byTitle = {};
    logs.forEach(log => {
      const entry = byTitle[log.title] || (byTitle[log.title] = { count: 0, presses: 0 });
      entry.count++;
      entry.presses += log.presses;
    });
    const summary = el("p", "hint");
    summary.textContent = logs.length + " Beobachtungen · " +
      Object.entries(byTitle).map(([title, e]) => title + " " + e.count + "×").join(" · ");
    histModal.appendChild(summary);
  }

  logs.forEach(log => {
    const entry = el("article", "hist-entry");
    const head = el("div", "hist-head");
    head.appendChild(el("strong", "", log.title));
    head.appendChild(el("span", "hint", formatDate(log.at)));
    entry.appendChild(head);

    entry.appendChild(el("p", "hist-facts",
      log.presses + (log.presses === 1 ? " Druck" : " Drücke") + " in " + formatDuration(log.seconds) +
      (log.rating ? " · " + (OBS_RATINGS.find(r => r[0] === log.rating) || [0, log.rating])[1] : "")));

    if (log.tags.length) {
      const tags = el("div", "hist-tags");
      log.tags.forEach(id => {
        const tone = (OBS_TAGS.find(t => t[0] === id) || [0, 0, "neutral"])[2];
        tags.appendChild(el("span", "hist-tag " + tone, tagLabel(id)));
      });
      entry.appendChild(tags);
    }
    if (log.note) entry.appendChild(el("p", "hist-note", log.note));

    entry.appendChild(button("Eintrag löschen", async () => {
      if (!confirm("Diesen Eintrag löschen?")) return;
      await deleteLog(log.id);
      openHistory(kid);
    }, "small danger"));
    histModal.appendChild(entry);
  });

  const actions = el("div", "button-row modal-actions");
  actions.appendChild(button("Schließen", () => closeModal(histScreen), "primary"));
  if (logs.length) {
    actions.appendChild(button("Drucken", () => printHistory(kid, logs)));
    actions.appendChild(button("Als Datei sichern", () => saveHistory(kid, logs)));
  }
  histModal.appendChild(actions);

  openModal(histScreen);
}

/* Druckansicht: nur dieser Bereich wird gedruckt (siehe css, @media print) */
function printHistory(kid, logs) {
  printArea.innerHTML = "";
  printArea.appendChild(el("h1", "", "Beobachtungen: " + kid.name));
  printArea.appendChild(el("p", "", "Tasterwelt · gedruckt am " + formatDate(Date.now())));

  const table = el("table");
  const head = el("tr");
  ["Datum", "Übung", "Drücke", "Dauer", "Eindruck", "Beobachtet", "Notiz"].forEach(h => head.appendChild(el("th", "", h)));
  table.appendChild(head);

  logs.forEach(log => {
    const row = el("tr");
    [
      formatDate(log.at),
      log.title,
      String(log.presses),
      formatDuration(log.seconds),
      log.rating ? (OBS_RATINGS.find(r => r[0] === log.rating) || [0, log.rating])[1] : "",
      log.tags.map(tagLabel).join(", "),
      log.note
    ].forEach(value => row.appendChild(el("td", "", value)));
    table.appendChild(row);
  });
  printArea.appendChild(table);

  document.body.classList.add("printing");
  window.print();
  setTimeout(() => document.body.classList.remove("printing"), 500);
}

/* Sicherung als Datei (zum Aufbewahren oder Weitergeben, z. B. per AirDrop) */
function saveHistory(kid, logs) {
  const data = { app: "tasterwelt-beobachtung", version: 1, kid: kid.name, logs };
  const file = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = "Beobachtungen " + kid.name.replace(/[\\/:*?"<>|]+/g, "") + ".json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 10000);
}

renderKidBar();
