/*
  Mitgelieferte Inhalte – bewusst altersneutral, damit sie für Kinder,
  Jugendliche und Erwachsene passen. Sie sind als Vorlage gedacht:
  "Als Kopie bearbeiten" und die Grafiken durch eigene Fotos ersetzen.
*/

function builtinPages(list) {
  return list.map(([svg, text], index) => ({
    id: "p" + index,
    svg,
    text,
    image: null,
    audio: null,
    video: null
  }));
}

const BUILTIN_COLLECTIONS = [
  {
    id: "kaffeepause",
    builtin: true,
    name: "Kaffeepause",
    pages: builtinPages([
      ["uhr", "Zeit für einen Kaffee."],
      ["wasserkocher", "Das Wasser kocht."],
      ["filter", "Der Kaffee läuft durch."],
      ["milch", "Ein Schuss Milch."],
      ["umruehren", "Einmal umrühren."],
      ["pause", "Und jetzt: Pause."]
    ])
  },
  {
    id: "meer",
    builtin: true,
    name: "Ein Tag am Meer",
    pages: builtinPages([
      ["auto", "Wir fahren ans Meer."],
      ["sonne", "Die Sonne scheint."],
      ["wellen", "Die Wellen rauschen."],
      ["schiff", "Ein Schiff fährt vorbei."],
      ["moewe", "Eine Möwe fliegt über das Wasser."],
      ["untergang", "Die Sonne geht unter."]
    ])
  }
];

/* Baustein 3: Aufbauen */
const BUILD_VARIANTS = [
  { id: "ballon", svg: "ballon", name: "Ballon", note: "Aufpumpen, bis er platzt" },
  { id: "domino", svg: "domino", name: "Domino", note: "Steine aufstellen – dann fällt die Reihe" },
  { id: "rakete", svg: "rakete", name: "Rakete", note: "Volltanken und abheben" }
];

/* Baustein 4: Effekt */
const EFFECT_VARIANTS = [
  { id: "feuerwerk", svg: "feuerwerk", name: "Feuerwerk", note: "Jeder Druck eine Rakete" },
  { id: "wellen", svg: "wellenkreise", name: "Wellen", note: "Tropfen fallen ins Wasser" },
  { id: "polarlicht", svg: "polarlicht", name: "Polarlicht", note: "Lichtschleier am Himmel" },
  { id: "lava", svg: "lavalampe", name: "Lavalampe", note: "Ruhige Formen kommen in Bewegung" },
  { id: "musik", svg: "musik", name: "Musik", note: "Akkord für Akkord ein ruhiges Stück" }
];
