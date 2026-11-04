/*
  Liste der Aufnahmen in klang/ – wird von js/sound.js und vom Service Worker
  (Offline-Speicher) benutzt. Erzeugt werden die Dateien mit scripts/klaenge.py.
*/

/* Tonhöhe (MIDI) jeder Instrumenten-Aufnahme */
const INSTRUMENTS = {
  marimba: { "marimba-c2": 36, "marimba-f3": 53, "marimba-c4": 60, "marimba-f5": 77, "marimba-c6": 84 },
  vibes: { "vibes-f2": 41, "vibes-c3": 48, "vibes-g3": 55, "vibes-d4": 62, "vibes-a4": 69, "vibes-e5": 76 },
  chime: { "chime-a4": 69, "chime-c5": 72, "chime-e5": 76 }
};

const EFFECT_CLIPS = [
  "glocke-c4", "glitzer", "glas-1", "glas-2", "glas-3", "meer",
  "tropfen-1", "tropfen-2", "tropfen-3", "tropfen-4",
  "holz", "klack", "knall", "luft", "rakete", "feuerwerk-1", "feuerwerk-2", "feuerwerk-3"
];

/*
  Geräusche für die Geschichten (Auswahl im Editor). loop = Dauergeräusch,
  das im Hintergrund weiterläuft. Quellen: klang/LIZENZ.md
*/
const GERAEUSCHE = [
  { id: "moewe", name: "Möwe" },
  { id: "schiffshorn", name: "Schiffshorn" },
  { id: "nebelhorn", name: "Nebelhorn" },
  { id: "wellen", name: "Wellen am Strand", loop: true },
  { id: "voegel", name: "Vogelgezwitscher", loop: true },
  { id: "regen", name: "Regen", loop: true },
  { id: "donner", name: "Donner und Regen" },
  { id: "dampfzug", name: "Dampfzug", loop: true },
  { id: "auto", name: "Auto fährt vorbei" },
  { id: "tuer", name: "Tür schließt" },
  { id: "klingel", name: "Türklingel" },
  { id: "katze", name: "Katze miaut" },
  { id: "applaus", name: "Applaus" },
  { id: "kuh", name: "Kuh muht" },
  { id: "eingiessen", name: "Wasser einschenken" },
  { id: "kaffeemaschine", name: "Kaffeemaschine" }
];

EFFECT_CLIPS.push(...GERAEUSCHE.map(g => g.id));
