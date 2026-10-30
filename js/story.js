/*
  Baustein 1: Geschichte.

  Titelseite → jeder Druck blättert eine Seite weiter (Bild, Text, Sprache,
  ggf. Video) → "Ende" mit Konfetti → nächster Druck fängt von vorn an.
*/

function createStoryGame(collection) {
  const pages = collection.pages;
  let stage = null;
  let current = null;
  let progress = null;
  let index = -1;
  let busy = false;

  function showElement(element) {
    element.classList.add("story-page", "enter");
    stage.appendChild(element);

    // Erst zeichnen lassen, dann hineinschieben
    element.getBoundingClientRect();
    element.classList.remove("enter");

    if (current) {
      const old = current;
      old.querySelectorAll("video").forEach(v => v.pause());
      old.classList.add("leave");
      setTimeout(() => old.remove(), 700);
    }
    current = element;
  }

  function textElement(text) {
    const p = document.createElement("p");
    p.className = "story-text";
    p.textContent = text || "";
    return p;
  }

  function showTitle() {
    const page = document.createElement("div");
    page.classList.add("story-title-page");
    page.style.background = "var(--buehne)";
    page.append(makeVisual(pages[0] || {}), textElement(collection.name));
    showElement(page);
    updateProgress();
    speak(collection.name);
  }

  function showPage(data) {
    const page = document.createElement("div");
    page.style.background = data.image || data.video ? "var(--buehne)" : (data.bg || "var(--buehne)");

    let visual;
    if (data.video) {
      visual = document.createElement("div");
      visual.className = "story-visual";
      const video = makeVideo(data);
      visual.appendChild(video);
    } else {
      visual = makeVisual(data);
    }

    page.append(visual);
    if (data.text) page.append(textElement(data.text));
    showElement(page);
    updateProgress();

    Sounds.page();

    if (data.video) {
      stopVoice();
      const video = visual.querySelector("video");
      video.play().catch(() => {});
      // Nach dem Video noch die Aufnahme bzw. den Text, falls vorhanden
      video.onended = () => { if (current === page && (data.audio || data.text)) sayPage(data); };
    } else {
      sayPage(data);
    }
  }

  function showEnd() {
    const page = document.createElement("div");
    page.style.background = "var(--buehne)";
    page.append(makeVisual({ emoji: "🌟", bg: "#fff1c1" }), textElement("Ende!"));
    showElement(page);
    updateProgress();

    Sounds.fanfare();
    Fx.rain(140);
    speak("Ende! Super gemacht!");
  }

  function updateProgress() {
    progress.innerHTML = "";
    pages.forEach((_, i) => {
      const dot = document.createElement("span");
      if (i <= index) dot.classList.add("done");
      progress.appendChild(dot);
    });
  }

  return {
    title: collection.name,

    start(stageElement) {
      stage = stageElement;
      progress = document.createElement("div");
      progress.className = "story-progress";
      stage.appendChild(progress);
      showTitle();
    },

    press() {
      if (busy || pages.length === 0) return;
      busy = true;
      setTimeout(() => { busy = false; }, 450);

      stopVoice();
      index++;

      if (index > pages.length) index = 0;

      if (index === pages.length) showEnd();
      else showPage(pages[index]);
    },

    release() {},

    stop() {
      stopVoice();
      if (current) current.querySelectorAll("video").forEach(v => v.pause());
    }
  };
}
