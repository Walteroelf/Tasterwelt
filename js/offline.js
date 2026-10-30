/*
  Offline-Betrieb: Service Worker anmelden (siehe sw.js).
  Die App hat keine Bild- oder Sounddateien zum Nachladen – alles Nötige wird
  beim ersten Öffnen gespeichert. Eigene Inhalte liegen ohnehin auf dem Gerät.
*/

const offlineStatus = document.getElementById("offlineStatus");

if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  navigator.serviceWorker.register("sw.js").catch(error => {
    console.warn("Offline-Betrieb nicht verfügbar:", error);
  });
}

async function updateOfflineStatus() {
  if (!("serviceWorker" in navigator) || !("caches" in window)) {
    offlineStatus.textContent = "Dieser Browser unterstützt keinen Offline-Betrieb.";
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const keys = await caches.keys();
    const ready = registration && registration.active && keys.some(key => key.startsWith("tasterwelt-app-"));

    offlineStatus.textContent = ready
      ? "✓ Die App ist auf diesem Gerät gespeichert und funktioniert auch ohne Internet."
      : "Die App wird beim ersten Öffnen mit Internet gespeichert. Danach funktioniert sie auch offline.";
  } catch (error) {
    offlineStatus.textContent = "Der Offline-Speicher ist in diesem Browser nicht verfügbar (z. B. im privaten Modus).";
  }
}
