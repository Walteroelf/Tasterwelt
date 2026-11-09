/*
  Speicherung auf dem Gerät (IndexedDB).

  collections: { id, name, createdAt, pages: [Seite …] }
  Seite:       { id, text, svg, image (Blob | null), audio (Blob | null), video (Blob | null), kern }
  kids:        { id, name, createdAt }
  logs:        { id, kidId, at, title, kind, presses, seconds, tags[], rating, note }

  Alles bleibt lokal im Browser dieses Geräts.
*/

const DB_NAME = "tasterwelt";
const DB_VERSION = 2;

let dbPromise = null;

function openDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains("collections")) {
        db.createObjectStore("collections", { keyPath: "id" });
      }

      // Ab Version 2: Kinder und ihre Beobachtungen (kinder.js)
      if (!db.objectStoreNames.contains("kids")) {
        db.createObjectStore("kids", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("logs")) {
        db.createObjectStore("logs", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function getOwnCollections() {
  try {
    const db = await openDatabase();
    const all = await requestToPromise(db.transaction("collections").objectStore("collections").getAll());
    return all.sort((a, b) => a.createdAt - b.createdAt);
  } catch (error) {
    console.warn("Eigene Sammlungen konnten nicht geladen werden:", error);
    return [];
  }
}

async function saveCollection(collection) {
  const db = await openDatabase();
  const transaction = db.transaction("collections", "readwrite");
  transaction.objectStore("collections").put(collection);

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

async function deleteCollection(id) {
  const db = await openDatabase();
  return requestToPromise(db.transaction("collections", "readwrite").objectStore("collections").delete(id));
}

/* ---------- Kinder und Beobachtungen ---------- */

async function getKids() {
  try {
    const db = await openDatabase();
    const all = await requestToPromise(db.transaction("kids").objectStore("kids").getAll());
    return all.sort((a, b) => a.createdAt - b.createdAt);
  } catch (error) {
    console.warn("Kinder konnten nicht geladen werden:", error);
    return [];
  }
}

async function saveKid(kid) {
  const db = await openDatabase();
  return requestToPromise(db.transaction("kids", "readwrite").objectStore("kids").put(kid));
}

async function getLogs(kidId) {
  try {
    const db = await openDatabase();
    const all = await requestToPromise(db.transaction("logs").objectStore("logs").getAll());
    return all.filter(log => !kidId || log.kidId === kidId).sort((a, b) => b.at - a.at);
  } catch (error) {
    console.warn("Beobachtungen konnten nicht geladen werden:", error);
    return [];
  }
}

async function saveLog(log) {
  const db = await openDatabase();
  return requestToPromise(db.transaction("logs", "readwrite").objectStore("logs").put(log));
}

async function deleteLog(id) {
  const db = await openDatabase();
  return requestToPromise(db.transaction("logs", "readwrite").objectStore("logs").delete(id));
}

/* Kind samt allen Beobachtungen löschen */
async function deleteKid(id) {
  const db = await openDatabase();
  const logs = await getLogs(id);
  await Promise.all(logs.map(log => deleteLog(log.id)));
  return requestToPromise(db.transaction("kids", "readwrite").objectStore("kids").delete(id));
}
