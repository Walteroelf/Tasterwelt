/*
  Eigene Sammlungen anlegen und bearbeiten.

  Jede Seite: Foto (oder mitgelieferte Grafik), Text (wird vorgelesen), eigene Sprachaufnahme
  (hat Vorrang vor der Gerätestimme) und auf Wunsch ein Video.
  Mitgelieferte Beispiele werden nicht verändert, sondern als Kopie bearbeitet.

  Export/Import: eine .json-Datei mit allen Bildern, Aufnahmen und Videos –
  z. B. per AirDrop auf ein anderes iPad.
*/

const editorScreen = document.getElementById("editorScreen");
const editorTitle = document.getElementById("editorTitle");
const collectionNameInput = document.getElementById("collectionNameInput");
const pageRows = document.getElementById("pageRows");
const editorError = document.getElementById("editorError");
const multiPhotoInput = document.getElementById("multiPhotoInput");
const pagePhotoInput = document.getElementById("pagePhotoInput");
const pageVideoInput = document.getElementById("pageVideoInput");
const exportButton = document.getElementById("exportCollectionButton");
const deleteButton = document.getElementById("deleteCollectionButton");

const MAX_IMAGE_SIZE = 1400;      // Pixel, längere Seite
const MAX_RECORDING_MS = 30000;

let draft = null;
let draftIsNew = false;
let photoTarget = null;
let videoTarget = null;
let recorder = null;
let recordingPage = null;

function newPage(fields = {}) {
  return { id: createId(), text: "", svg: null, image: null, audio: null, video: null, ...fields };
}

function openEditor(collection) {
  stopRecording();

  if (!collection) {
    draft = { id: createId(), name: "", createdAt: Date.now(), pages: [] };
    draftIsNew = true;
    editorTitle.textContent = "Neue Sammlung";
  } else if (collection.builtin) {
    draft = {
      id: createId(),
      name: collection.name + " (eigene)",
      createdAt: Date.now(),
      pages: collection.pages.map(p => ({ ...p, id: createId() }))
    };
    draftIsNew = true;
    editorTitle.textContent = "Kopie bearbeiten";
  } else {
    draft = { ...collection, pages: collection.pages.map(p => ({ ...p })) };
    draftIsNew = false;
    editorTitle.textContent = "Sammlung bearbeiten";
  }

  collectionNameInput.value = draft.name;
  editorError.textContent = "";
  multiPhotoInput.value = "";
  exportButton.classList.toggle("hidden", draftIsNew);
  deleteButton.classList.toggle("hidden", draftIsNew);

  renderPageRows();
  editorScreen.classList.remove("hidden");
  editorScreen.querySelector(".modal").scrollTop = 0;
}

function closeEditor() {
  stopRecording();
  editorScreen.classList.add("hidden");
  draft = null;
}

/* ---------- Seiten-Liste ---------- */

function toolButton(label, onClick, extraClass = "") {
  const button = document.createElement("button");
  button.className = "tiny " + extraClass;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function renderPageRows() {
  pageRows.innerHTML = "";

  if (draft.pages.length === 0) {
    pageRows.innerHTML = `<p class="hint">Noch keine Seiten. Oben Fotos auswählen oder unten „+ Leere Seite“ antippen.</p>`;
    return;
  }

  draft.pages.forEach((page, index) => {
    const row = document.createElement("div");
    row.className = "page-row";

    const thumb = makeThumb(page, "page-thumb");
    const number = document.createElement("span");
    number.className = "page-number";
    number.textContent = index + 1;
    thumb.appendChild(number);
    if (page.video) {
      const badge = document.createElement("span");
      badge.className = "video-badge";
      badge.textContent = "Video";
      thumb.appendChild(badge);
    }
    row.appendChild(thumb);

    const fields = document.createElement("div");
    fields.className = "page-fields";

    const text = document.createElement("input");
    text.type = "text";
    text.className = "text-input";
    text.placeholder = "Text, der vorgelesen wird";
    text.value = page.text || "";
    text.addEventListener("input", () => { page.text = text.value; });
    fields.appendChild(text);

    const tools = document.createElement("div");
    tools.className = "page-tools";

    tools.appendChild(toolButton(page.image ? "Anderes Foto" : "Foto", () => {
      photoTarget = page;
      pagePhotoInput.value = "";
      pagePhotoInput.click();
    }));

    if (page.image) {
      tools.appendChild(toolButton("Foto entfernen", () => { page.image = null; renderPageRows(); }));
    } else if (page.svg) {
      tools.appendChild(toolButton("Grafik entfernen", () => { page.svg = null; renderPageRows(); }));
    }

    const isRecording = recordingPage === page;
    tools.appendChild(toolButton(isRecording ? "Stopp" : (page.audio ? "Neu aufnehmen" : "Aufnehmen"), () => {
      if (isRecording) stopRecording();
      else startRecording(page);
    }, isRecording ? "recording" : ""));

    if (page.audio) {
      tools.appendChild(toolButton("Anhören", () => { unlockAudio(); playBlob(page.audio); }));
      tools.appendChild(toolButton("Aufnahme löschen", () => { page.audio = null; renderPageRows(); }));
    } else if (page.text) {
      tools.appendChild(toolButton("Text anhören", () => { unlockAudio(); speak(page.text); }));
    }

    tools.appendChild(toolButton(page.video ? "Anderes Video" : "Video", () => {
      videoTarget = page;
      pageVideoInput.value = "";
      pageVideoInput.click();
    }));
    if (page.video) {
      tools.appendChild(toolButton("Video entfernen", () => { page.video = null; renderPageRows(); }));
    }

    const up = toolButton("↑", () => movePage(index, -1));
    up.disabled = index === 0;
    up.setAttribute("aria-label", "Seite nach oben");
    const down = toolButton("↓", () => movePage(index, 1));
    down.disabled = index === draft.pages.length - 1;
    down.setAttribute("aria-label", "Seite nach unten");
    tools.append(up, down);

    const remove = toolButton("Löschen", () => {
      if (recordingPage === page) stopRecording();
      draft.pages.splice(index, 1);
      renderPageRows();
    }, "danger");
    remove.setAttribute("aria-label", "Seite löschen");
    tools.appendChild(remove);

    fields.appendChild(tools);
    row.appendChild(fields);
    pageRows.appendChild(row);
  });
}

function movePage(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= draft.pages.length) return;
  [draft.pages[index], draft.pages[target]] = [draft.pages[target], draft.pages[index]];
  renderPageRows();
}

/* ---------- Fotos ---------- */

/* Fotos verkleinern: iPad-Fotos sind sonst mehrere MB groß */
function resizeImage(file) {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const scale = Math.min(1, MAX_IMAGE_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => resolve(blob || file), "image/jpeg", 0.86);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

function textFromFileName(name) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[_]+/g, " ")
    .replace(/^(IMG|DSC|PXL|Foto|Photo)[ -]?\d+.*$/i, "")
    .trim();
}

multiPhotoInput.addEventListener("change", async () => {
  const files = [...multiPhotoInput.files];
  if (files.length === 0) return;

  editorError.textContent = "Fotos werden vorbereitet …";
  for (const file of files) {
    const image = await resizeImage(file);
    draft.pages.push(newPage({ image, text: textFromFileName(file.name) }));
  }
  editorError.textContent = "";
  multiPhotoInput.value = "";
  renderPageRows();
});

pagePhotoInput.addEventListener("change", async () => {
  const file = pagePhotoInput.files[0];
  if (!file || !photoTarget) return;
  photoTarget.image = await resizeImage(file);
  if (!photoTarget.text) photoTarget.text = textFromFileName(file.name);
  photoTarget = null;
  renderPageRows();
});

pageVideoInput.addEventListener("change", () => {
  const file = pageVideoInput.files[0];
  if (!file || !videoTarget) return;

  if (file.size > 80 * 1024 * 1024) {
    editorError.textContent = "Das Video ist sehr groß (über 80 MB). Bitte ein kürzeres Video wählen.";
    return;
  }

  videoTarget.video = file;
  videoTarget = null;
  editorError.textContent = "";
  renderPageRows();
});

/* ---------- Sprachaufnahme ---------- */

function pickRecordingType() {
  if (typeof MediaRecorder === "undefined") return null;
  const types = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg"];
  return types.find(type => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) || "";
}

async function startRecording(page) {
  stopRecording();
  const type = pickRecordingType();

  if (type === null || !navigator.mediaDevices) {
    editorError.textContent = "Aufnehmen geht in diesem Browser leider nicht.";
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const chunks = [];
    recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    recordingPage = page;

    recorder.ondataavailable = event => { if (event.data.size > 0) chunks.push(event.data); };
    recorder.onstop = () => {
      stream.getTracks().forEach(track => track.stop());
      if (chunks.length > 0) page.audio = new Blob(chunks, { type: recorder.mimeType || type || "audio/mp4" });
      recorder = null;
      recordingPage = null;
      if (draft) renderPageRows();
    };

    recorder.start();
    editorError.textContent = "";
    renderPageRows();

    // Nicht endlos aufnehmen
    setTimeout(() => { if (recordingPage === page) stopRecording(); }, MAX_RECORDING_MS);
  } catch (error) {
    recordingPage = null;
    editorError.textContent = "Kein Zugriff auf das Mikrofon. Bitte in den Einstellungen des iPads erlauben.";
    renderPageRows();
  }
}

function stopRecording() {
  if (recorder && recorder.state !== "inactive") recorder.stop();
}

/* ---------- Speichern, Löschen ---------- */

document.getElementById("addPageButton").addEventListener("click", () => {
  draft.pages.push(newPage());
  renderPageRows();
});

document.getElementById("saveCollectionButton").addEventListener("click", async () => {
  stopRecording();
  draft.name = collectionNameInput.value.trim();

  if (!draft.name) {
    editorError.textContent = "Bitte einen Namen eintragen.";
    collectionNameInput.focus();
    return;
  }
  if (draft.pages.length === 0) {
    editorError.textContent = "Bitte mindestens eine Seite anlegen.";
    return;
  }

  // Aufnahme wird evtl. gerade noch abgeschlossen
  await wait(150);

  try {
    await saveCollection(draft);
    closeEditor();
    renderHome();
  } catch (error) {
    editorError.textContent = "Speichern hat nicht geklappt. Ist der Speicher des Geräts voll?";
  }
});

document.getElementById("cancelEditButton").addEventListener("click", closeEditor);

deleteButton.addEventListener("click", async () => {
  if (!confirm("Sammlung „" + draft.name + "“ wirklich löschen? Das lässt sich nicht rückgängig machen.")) return;
  await deleteCollection(draft.id);
  closeEditor();
  renderHome();
});

/* ---------- Export und Import ---------- */

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function dataUrlToBlob(dataUrl) {
  if (!dataUrl) return null;
  const response = await fetch(dataUrl);
  return response.blob();
}

exportButton.addEventListener("click", async () => {
  editorError.textContent = "Export wird vorbereitet …";

  const data = {
    app: "tasterwelt",
    version: 2,
    name: draft.name,
    pages: await Promise.all(draft.pages.map(async page => ({
      text: page.text || "",
      svg: page.svg || null,
      image: page.image ? await blobToDataUrl(page.image) : null,
      audio: page.audio ? await blobToDataUrl(page.audio) : null,
      video: page.video ? await blobToDataUrl(page.video) : null
    })))
  };

  const file = new Blob([JSON.stringify(data)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = draft.name.replace(/[\\/:*?"<>|]+/g, "") + ".tasterwelt.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 10000);

  editorError.textContent = "";
});

const importInput = document.getElementById("importInput");

document.getElementById("newCollectionButton").addEventListener("click", () => openEditor(null));
document.getElementById("importButton").addEventListener("click", () => {
  importInput.value = "";
  importInput.click();
});

importInput.addEventListener("change", async () => {
  const file = importInput.files[0];
  if (!file) return;

  try {
    const data = JSON.parse(await file.text());
    if (data.app !== "tasterwelt" || !Array.isArray(data.pages)) throw new Error("Keine Tasterwelt-Datei");

    const collection = {
      id: createId(),
      name: String(data.name || "Importiert"),
      createdAt: Date.now(),
      pages: await Promise.all(data.pages.map(async page => newPage({
        text: String(page.text || ""),
        svg: ILL[page.svg] ? page.svg : null,
        image: await dataUrlToBlob(page.image),
        audio: await dataUrlToBlob(page.audio),
        video: await dataUrlToBlob(page.video)
      })))
    };

    await saveCollection(collection);
    renderHome();
    alert("„" + collection.name + "“ wurde importiert.");
  } catch (error) {
    alert("Diese Datei konnte nicht importiert werden. Bitte eine Datei wählen, die mit „Exportieren“ aus der Tasterwelt gespeichert wurde.");
  }
});
