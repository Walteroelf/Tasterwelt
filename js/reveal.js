/*
  Baustein 2: Aufdecken.

  Das Bild liegt unter bunten Teilen. Jeder Druck nimmt ein Teil weg
  (zufällige Reihenfolge). Ist alles weg: Bild wippt, Text wird gesprochen,
  Konfetti – und hat die Seite ein Video, läuft es als Belohnung.
  Der nächste Druck bringt das nächste Bild.
*/

const TILE_LAYOUTS = { 1: [1, 1], 2: [2, 1], 4: [2, 2], 6: [3, 2], 9: [3, 3], 12: [4, 3], 16: [4, 4] };
const TILE_COLORS = ["#e63946", "#f4a261", "#f2b531", "#2a9d8f", "#3d7ab8", "#9b5de5", "#f15bb5", "#43aa8b"];

function createRevealGame(collection) {
  const pages = collection.pages;
  let stage = null;
  let wrap = null;
  let box = null;
  let order = [];
  let tiles = [];
  let pageIndex = -1;
  let state = "covered";   // covered → revealed (→ video) → nächstes Bild
  let busy = false;
  let videoLayer = null;

  function nextPicture() {
    pageIndex = (pageIndex + 1) % pages.length;
    const page = pages[pageIndex];

    wrap.innerHTML = "";
    box = document.createElement("div");
    box.className = "reveal-box";
    box.appendChild(makeVisual(page));
    // Das Emoji soll erst beim Aufdecken wippen, nicht verdeckt
    box.querySelectorAll(".wiggle").forEach(el => el.classList.remove("wiggle"));

    const count = Number(settings.tiles) || 6;
    const [cols, rows] = TILE_LAYOUTS[count] || [3, 2];
    const grid = document.createElement("div");
    grid.className = "reveal-tiles";
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    const offset = Math.floor(Math.random() * TILE_COLORS.length);
    tiles = [];
    for (let i = 0; i < cols * rows; i++) {
      const tile = document.createElement("div");
      tile.className = "reveal-tile";
      tile.style.background = TILE_COLORS[(i + offset) % TILE_COLORS.length];
      tile.textContent = "?";
      grid.appendChild(tile);
      tiles.push(tile);
    }
    order = shuffle(tiles.map((_, i) => i));

    box.appendChild(grid);
    wrap.appendChild(box);
    state = "covered";
  }

  function removeTile() {
    const tile = tiles[order.shift()];
    tile.classList.add("gone");
    Sounds.chime();

    if (order.length === 0) {
      state = "revealed";
      busy = true;
      setTimeout(celebrate, 450);
    }
  }

  function celebrate() {
    const page = pages[pageIndex];
    const visual = box.querySelector(".story-visual > span");
    if (visual) {
      visual.classList.remove("wiggle");
      visual.getBoundingClientRect();
      visual.classList.add("wiggle");
    }

    if (page.text) {
      const p = document.createElement("p");
      p.className = "story-text";
      p.textContent = page.text;
      wrap.appendChild(p);
    }

    const c = centerOf(box);
    Fx.confetti(c.x, c.y);
    Sounds.fanfare();

    if (page.video) {
      // Kurz das Bild zeigen, dann das Video als Belohnung
      setTimeout(() => {
        if (state !== "revealed") return;
        videoLayer = document.createElement("div");
        videoLayer.className = "reveal-video";
        const video = makeVideo(page);
        videoLayer.appendChild(video);
        box.appendChild(videoLayer);
        video.play().catch(() => {});
        busy = false;
      }, 900);
    } else {
      setTimeout(() => sayPage(page).then(() => { busy = false; }), 500);
      // Nicht ewig sperren, falls die Sprache hängt
      setTimeout(() => { busy = false; }, 4000);
    }
  }

  function stopVideo() {
    if (videoLayer) {
      videoLayer.querySelector("video").pause();
      videoLayer = null;
    }
  }

  return {
    title: collection.name + " – aufdecken",

    start(stageElement) {
      stage = stageElement;
      wrap = document.createElement("div");
      wrap.className = "reveal-wrap";
      stage.appendChild(wrap);
      nextPicture();
    },

    press() {
      if (busy || pages.length === 0) return;

      if (state === "covered") {
        removeTile();
      } else {
        stopVoice();
        stopVideo();
        nextPicture();
      }
    },

    release() {},

    stop() {
      stopVoice();
      stopVideo();
    }
  };
}
