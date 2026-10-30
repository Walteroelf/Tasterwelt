/*
  Mitgelieferte Inhalte.

  Die Beispiel-Sammlungen benutzen Emojis als Bilder – die sehen auf dem iPad
  schön aus und brauchen keine Bilddateien. Über "Als Kopie bearbeiten" lassen
  sie sich mit eigenen Fotos und Aufnahmen umbauen.
*/

const PASTELS = ["#fde2e4", "#e2f0cb", "#cde7f0", "#fff1c1", "#e9dcf5", "#ffd9b8", "#d4f1e4"];

function builtinPages(list) {
  return list.map(([emoji, text], index) => ({
    id: "p" + index,
    emoji,
    text,
    bg: PASTELS[index % PASTELS.length],
    image: null,
    audio: null,
    video: null
  }));
}

const BUILTIN_COLLECTIONS = [
  {
    id: "bauernhof",
    builtin: true,
    name: "Auf dem Bauernhof",
    pages: builtinPages([
      ["🐄", "Die Kuh macht Muuuh!"],
      ["🐷", "Das Schwein macht Oink oink!"],
      ["🐑", "Das Schaf macht Mäh!"],
      ["🐓", "Der Hahn ruft Kikeriki!"],
      ["🐴", "Das Pferd wiehert."],
      ["🐶", "Der Hund bellt: Wau wau!"],
      ["🐱", "Die Katze macht Miau!"]
    ])
  },
  {
    id: "fahrzeuge",
    builtin: true,
    name: "Fahrzeuge",
    pages: builtinPages([
      ["🚗", "Das Auto fährt. Brumm brumm!"],
      ["🚌", "Der Bus hält. Alle einsteigen!"],
      ["🚒", "Die Feuerwehr kommt. Tatü tata!"],
      ["🚜", "Der Traktor tuckert über das Feld."],
      ["🚂", "Der Zug fährt. Tschu tschu!"],
      ["✈️", "Das Flugzeug fliegt hoch in den Himmel."]
    ])
  },
  {
    id: "morgen",
    builtin: true,
    name: "Guten Morgen",
    pages: builtinPages([
      ["😴", "Ich schlafe noch."],
      ["⏰", "Der Wecker klingelt!"],
      ["🪥", "Ich putze die Zähne."],
      ["👕", "Ich ziehe mich an."],
      ["🥣", "Ich esse Frühstück."],
      ["🚌", "Ich fahre zur Schule."],
      ["👋", "Hallo! Guten Morgen!"]
    ])
  }
];

/* Baustein 3: Aufbauen */
const BUILD_VARIANTS = [
  { id: "ballon", emoji: "🎈", name: "Ballon", note: "aufpumpen, bis er platzt" },
  { id: "turm", emoji: "🧱", name: "Turm", note: "Steine stapeln, bis er umfällt" },
  { id: "rakete", emoji: "🚀", name: "Rakete", note: "volltanken und abheben" }
];

/* Baustein 4: Effekt */
const EFFECT_VARIANTS = [
  { id: "feuerwerk", emoji: "🎆", name: "Feuerwerk", note: "jeder Druck eine Rakete" },
  { id: "kleckse", emoji: "🎨", name: "Farbkleckse", note: "bunte Kleckse füllen das Bild" },
  { id: "musik", emoji: "🎵", name: "Musik", note: "Ton für Ton: Alle meine Entchen" },
  { id: "licht", emoji: "💡", name: "Lichter", note: "bunte Lichter gehen an" }
];
