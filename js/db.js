/*
  Speicherung auf dem Gerät (IndexedDB).

  collections: { id, name, createdAt, pages: [Seite …] }
  Seite:       { id, text, svg, image (Blob | null), audio (Blob | null), video (Blob | null) }

  Alles bleibt lokal im Browser dieses Geräts.
*/

const DB_NAME = "tasterwelt";
const DB_VERSION = 1;

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
