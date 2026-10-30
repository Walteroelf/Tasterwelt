/*
  Bilder einer Seite anzeigen: eigenes Foto (Blob) oder mitgelieferte Grafik.
  Seiten ohne Bild zeigen nur den Text.
  Blob-Adressen werden einmal je Blob erzeugt und wiederverwendet.
*/

const blobUrls = new WeakMap();

function blobUrl(blob) {
  if (!blobUrls.has(blob)) blobUrls.set(blob, URL.createObjectURL(blob));
  return blobUrls.get(blob);
}

function hasPicture(page) {
  return Boolean(page && (page.image || (page.svg && ILL[page.svg])));
}

/* Großes Bild einer Seite (für Geschichte, Aufdecken, Überraschung) – oder null */
function makeVisual(page) {
  if (!hasPicture(page)) return null;

  const box = document.createElement("div");
  box.className = "story-visual";

  if (page.image) {
    const img = document.createElement("img");
    img.src = blobUrl(page.image);
    img.alt = page.text || "";
    img.draggable = false;
    box.appendChild(img);
  } else {
    box.innerHTML = ILL[page.svg];
  }

  return box;
}

/* Video einer Seite – startet mit Ton (der Tasterdruck zählt als Nutzer-Aktion) */
function makeVideo(page) {
  const video = document.createElement("video");
  video.src = blobUrl(page.video);
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.preload = "auto";
  return video;
}

/* Kleines Vorschaubild für Karten und Listen */
function makeThumb(page, className = "card-visual") {
  const box = document.createElement("div");
  box.className = className;

  if (page && page.image) {
    const img = document.createElement("img");
    img.src = blobUrl(page.image);
    img.alt = "";
    box.appendChild(img);
  } else if (page && page.svg && ILL[page.svg]) {
    box.innerHTML = ILL[page.svg];
  } else {
    const text = document.createElement("span");
    text.className = "card-text";
    text.textContent = (page && page.text) || "";
    box.appendChild(text);
  }

  return box;
}

function textElement(text, onlyText = false) {
  const p = document.createElement("p");
  p.className = "story-text" + (onlyText ? " only" : "");
  p.textContent = text || "";
  return p;
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
