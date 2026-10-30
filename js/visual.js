/*
  Bilder einer Seite anzeigen: eigenes Foto (Blob) oder Emoji.
  Blob-Adressen werden einmal je Blob erzeugt und wiederverwendet.
*/

const blobUrls = new WeakMap();

function blobUrl(blob) {
  if (!blobUrls.has(blob)) blobUrls.set(blob, URL.createObjectURL(blob));
  return blobUrls.get(blob);
}

/* Großes Bild einer Seite (für Geschichte, Aufdecken, Überraschung) */
function makeVisual(page) {
  const box = document.createElement("div");
  box.className = "story-visual";
  box.style.background = page.image ? "#fff" : (page.bg || "#fff");

  if (page.image) {
    const img = document.createElement("img");
    img.src = blobUrl(page.image);
    img.alt = page.text || "";
    img.draggable = false;
    box.appendChild(img);
  } else {
    const span = document.createElement("span");
    span.textContent = page.emoji || "⭐";
    span.className = "wiggle";
    box.appendChild(span);
  }

  return box;
}

/* Video einer Seite – startet sofort mit Ton (der Tasterdruck zählt als Nutzer-Aktion) */
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
  } else {
    box.textContent = (page && page.emoji) || "⭐";
    if (page && page.bg) box.style.background = page.bg;
  }

  return box;
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
