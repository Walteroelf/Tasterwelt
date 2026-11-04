/*
  Baustein 1: Geschichte.

  Titel → jeder Druck blendet die nächste Seite ein (Bild, Text, Sprache,
  ggf. Video) → "Ende" mit einem kurzen Klang → nächster Druck fängt von vorn an.
*/

function createStoryGame(collection) {
  const pages = collection.pages;
  let stage = null;
  let current = null;
  let progress = null;
  let index = -1;
  let busy = false;
  let speechTimer = null;

  function showElement(element) {
    element.classList.add("story-page", "enter");
    stage.appendChild(element);

    // Erst zeichnen lassen, dann einblenden
    element.getBoundingClientRect();
    element.classList.remove("enter");

    if (current) {
      const old = current;
      old.querySelectorAll("video").forEach(v => v.pause());
      old.classList.add("leave");
      setTimeout(() => old.remove(), 1300);
    }
    current = element;
  }

  function fill(element, page, { forceText = false } = {}) {
    const visual = page.video ? null : makeVisual(page);

    if (page.video) {
      const box = document.createElement("div");
      box.className = "story-visual";
      box.appendChild(makeVideo(page));
      element.appendChild(box);
    } else if (visual) {
      visual.classList.add("rise");
      element.appendChild(visual);
    }

    const hasPictureHere = Boolean(page.video || visual);
    if (page.text && (settings.showText || forceText || !hasPictureHere)) {
      element.appendChild(textElement(page.text, !hasPictureHere));
    }
  }

  function showTitle() {
    const page = document.createElement("div");
    page.classList.add("story-title-page");
    fill(page, { ...(pages[0] || {}), video: null, text: collection.name }, { forceText: true });
    showElement(page);
    updateProgress();
  }

  function showPage(data) {
    const page = document.createElement("div");
    fill(page, data);
    showElement(page);
    updateProgress();

    Sounds.page();

    // Geräusch zuerst, die Stimme setzt kurz danach ein
    const soundDone = data.sound ? startPageSound(data) : Promise.resolve(0);

    if (data.video) {
      stopVoice();
      const video = page.querySelector("video");
      video.play().catch(() => {});
      // Nach dem Video noch die Aufnahme bzw. den Text, falls vorhanden
      video.onended = () => { if (current === page && (data.audio || data.text)) sayPage(data); };
    } else {
      soundDone.then(duration => {
        const wait = duration ? Math.min(duration, 4) * 550 : 0;
        clearTimeout(speechTimer);
        speechTimer = setTimeout(() => { if (current === page) sayPage(data); }, wait);
      });
    }
  }

  function showEnd() {
    const page = document.createElement("div");
    page.appendChild(textElement("Ende", true));
    showElement(page);
    updateProgress();
    stopAmbient(2);
    Sounds.ending();
  }

  function updateProgress() {
    progress.innerHTML = "";
    pages.forEach((_, i) => {
      const bar = document.createElement("span");
      if (i <= index && index < pages.length) bar.classList.add("done");
      if (index >= pages.length) bar.classList.add("done");
      progress.appendChild(bar);
    });
  }

  return {
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
      setTimeout(() => { busy = false; }, 500);

      clearTimeout(speechTimer);
      stopVoice();
      stopPageSound();
      index++;
      if (index > pages.length) index = 0;

      if (index === pages.length) showEnd();
      else showPage(pages[index]);
    },

    release() {},

    stop() {
      clearTimeout(speechTimer);
      stopVoice();
      stopPageSound(0.2);
      stopAmbient(0.5);
      if (current) current.querySelectorAll("video").forEach(v => v.pause());
    }
  };
}
