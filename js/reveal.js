/*
  Baustein 2: Aufdecken.

  Das Bild liegt unter Feldern in der Hauptfarbe. Jeder Druck nimmt ein Feld
  weg (zufällige Reihenfolge, Marimba-Ton steigt). Ist alles weg: Glockenklang,
  ein paar Funken, Text wird gesprochen – und hat die Seite ein Video, läuft
  es als Belohnung. Der nächste Druck bringt das nächste Bild.
  Seiten ohne Bild werden übersprungen.
*/

const TILE_LAYOUTS = { 1: [1, 1], 2: [2, 1], 4: [2, 2], 6: [3, 2], 9: [3, 3], 12: [4, 3], 16: [4, 4] };

function createRevealGame(collection) {
  const pages = collection.pages.filter(p => hasPicture(p) || p.video);
  let wrap = null;
  let box = null;
  let order = [];
  let tiles = [];
  let removed = 0;
  let pageIndex = -1;
  let state = "covered";   // covered → revealed → nächstes Bild
  let busy = false;
  let videoLayer = null;
  const timers = [];

  function later(fn, ms) {
    timers.push(setTimeout(fn, ms));
  }

  function nextPicture() {
    pageIndex = (pageIndex + 1) % pages.length;
    const page = pages[pageIndex];

    wrap.innerHTML = "";
    box = document.createElement("div");
    box.className = "reveal-box";
    const visual = makeVisual(page);
    if (visual) box.appendChild(visual);

    const count = Number(settings.tiles) || 6;
    const [cols, rows] = TILE_LAYOUTS[count] || [3, 2];
    const grid = document.createElement("div");
    grid.className = "reveal-tiles";
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    tiles = [];
    for (let i = 0; i < cols * rows; i++) {
      const tile = document.createElement("div");
      tile.className = "reveal-tile";
      grid.appendChild(tile);
      tiles.push(tile);
    }
    order = shuffle(tiles.map((_, i) => i));
    removed = 0;

    box.appendChild(grid);
    wrap.appendChild(box);
    state = "covered";
  }

  function removeTile() {
    tiles[order.shift()].classList.add("gone");
    Sounds.tick(removed++);

    if (order.length === 0) {
      state = "revealed";
      busy = true;
      later(celebrate, 500);
    }
  }

  function celebrate() {
    const page = pages[pageIndex];

    if (page.text && settings.showText) wrap.appendChild(textElement(page.text));

    const c = centerOf(box);
    Fx.burst(c.x, c.y, 40);
    Sounds.revealed();

    if (page.video) {
      later(() => {
        videoLayer = document.createElement("div");
        videoLayer.className = "reveal-video";
        const video = makeVideo(page);
        videoLayer.appendChild(video);
        box.appendChild(videoLayer);
        video.play().catch(() => {});
        busy = false;
      }, 1000);
    } else {
      later(() => sayPage(page).then(() => { busy = false; }), 600);
      // Nicht ewig sperren, falls die Sprache hängt
      later(() => { busy = false; }, 4000);
    }
  }

  function stopVideo() {
    if (videoLayer) {
      videoLayer.querySelector("video").pause();
      videoLayer = null;
    }
  }

  return {
    start(stageElement) {
      wrap = document.createElement("div");
      wrap.className = "reveal-wrap";
      stageElement.appendChild(wrap);
      if (pages.length === 0) {
        wrap.appendChild(textElement("In dieser Sammlung ist noch kein Bild.", true));
        return;
      }
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
      timers.forEach(clearTimeout);
      stopVoice();
      stopVideo();
    }
  };
}
