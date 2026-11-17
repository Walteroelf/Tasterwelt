/*
  Schutz vor versehentlichem Verlassen und Verstellen.

  1. Zurück-Wischen (iPad: Wischen vom Rand, Browser: Zurück-Taste) wird abgefangen.
     In einer Übung fragt die App „Übung beenden?“, auf der Startseite „App schließen?“.
     Ein zweites Zurück auf der Startseite schließt die App wirklich.
  2. Das Zahnrad in der Übung öffnet die Einstellungen erst nach 3 Sekunden Halten.
     Ein Ring um das Zahnrad füllt sich und zeigt: gleich ist es so weit.
     (Auf der Startseite genügt ein Tippen. Ist der Zahlen-Code an, kommt er danach noch.)
  3. Der Datenschutzhinweis auf der Startseite.
*/

(function () {
  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function makeButton(label, onClick, className = "") {
    const b = make("button", className, label);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  }

  /* ---------- 1. Zurück-Wischen ---------- */

  const exitScreen = document.getElementById("exitScreen");
  const exitModal = document.getElementById("exitModal");
  let exitMode = null;      // "game" oder "home", solange das Fenster offen ist
  let leaving = false;

  function openExit(mode) {
    exitMode = mode;
    exitModal.innerHTML = "";

    const actions = make("div", "button-row modal-actions");
    if (mode === "game") {
      exitModal.appendChild(make("h2", "", "Übung beenden?"));
      exitModal.appendChild(make("p", "", "Es wurde zurückgewischt. Soll die Übung beendet werden?"));
      actions.appendChild(makeButton("Weiter üben", closeExit, "primary"));
      actions.appendChild(makeButton("Übung beenden", () => {
        closeExit();
        if (settings.codeLock) askForCode(backToHome);
        else backToHome();
      }));
    } else {
      exitModal.appendChild(make("h2", "", "App schließen?"));
      exitModal.appendChild(make("p", "", "Wische noch einmal zurück, um die App zu schließen."));
      actions.appendChild(makeButton("Weiter", closeExit, "primary"));
    }
    exitModal.appendChild(actions);

    exitScreen.classList.remove("hidden");
    if (document.activeElement) document.activeElement.blur();
  }

  function closeExit() {
    exitMode = null;
    exitScreen.classList.add("hidden");
    if (document.activeElement) document.activeElement.blur();
  }

  if (window.history && history.pushState) {
    // Zwei Einträge: Wischen führt auf den ersten zurück, den fangen wir ab und setzen sofort neu
    history.replaceState({ tw: "base" }, "");
    history.pushState({ tw: "app" }, "");

    const stay = () => history.pushState({ tw: "app" }, "");

    window.addEventListener("popstate", () => {
      if (leaving) return;

      // Zweites Zurück auf der Startseite: App verlassen
      if (exitMode === "home") {
        leaving = true;
        history.back();
        // Geht es nirgends zurück (installierte App), wieder bereit machen
        setTimeout(() => {
          leaving = false;
          if (history.state && history.state.tw === "base") {
            stay();
            closeExit();
          }
        }, 400);
        return;
      }

      stay();
      if (anyModalOpen()) return;   // Einstellungen, Zahlen-Code, Editor …: nichts tun
      openExit(activeGame ? "game" : "home");
    });
  }

  /* ---------- 2. Einstellungen in der Übung: 3 Sekunden halten ---------- */

  const HOLD_MS = 3000;
  const gear = document.getElementById("playGearButton");
  const playScreenEl = document.getElementById("playScreen");

  const ring = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  ring.setAttribute("class", "hold-ring");
  ring.setAttribute("viewBox", "0 0 54 54");
  ring.setAttribute("aria-hidden", "true");
  ring.innerHTML = '<circle cx="27" cy="27" r="25"/>';
  gear.appendChild(ring);

  const hint = make("div", "hold-hint", "Zum Öffnen 3 Sekunden gedrückt halten");
  hint.setAttribute("aria-live", "polite");
  playScreenEl.appendChild(hint);

  let holdTimer = null;
  let hintTimer = null;
  let fired = false;

  function startHold(event) {
    event.preventDefault();
    if (holdTimer || anyModalOpen()) return;
    fired = false;
    try { gear.setPointerCapture(event.pointerId); } catch (error) { /* egal */ }

    gear.classList.remove("holding");
    gear.getBoundingClientRect();     // Animation neu starten
    gear.classList.add("holding");

    holdTimer = setTimeout(() => {
      holdTimer = null;
      fired = true;
      gear.classList.remove("holding");
      requestSettings();
    }, HOLD_MS);
  }

  function endHold() {
    if (fired) {
      fired = false;
      return;
    }
    if (!holdTimer) return;

    // Zu früh losgelassen: Ring zurück, kurzer Hinweis
    clearTimeout(holdTimer);
    holdTimer = null;
    gear.classList.remove("holding");
    hint.classList.add("show");
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => hint.classList.remove("show"), 2500);
  }

  gear.addEventListener("pointerdown", startHold);
  ["pointerup", "pointercancel", "lostpointercapture"].forEach(type => gear.addEventListener(type, endHold));
  gear.addEventListener("contextmenu", event => event.preventDefault());
  gear.addEventListener("click", event => event.preventDefault());

  /* ---------- 3. Datenschutz ---------- */

  const privacyScreen = document.getElementById("privacyScreen");

  document.getElementById("privacyLink").addEventListener("click", event => {
    event.preventDefault();
    privacyScreen.classList.remove("hidden");
    privacyScreen.querySelector(".modal").scrollTop = 0;
  });

  document.getElementById("privacyCloseButton").addEventListener("click", () => {
    privacyScreen.classList.add("hidden");
    if (document.activeElement) document.activeElement.blur();
  });
})();
