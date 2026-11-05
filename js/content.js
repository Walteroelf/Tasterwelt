/*
  Mitgelieferte Inhalte – bewusst altersneutral, damit sie für Kinder,
  Jugendliche und Erwachsene passen. Sie sind als Vorlage gedacht:
  "Als Kopie bearbeiten" und die Grafiken durch eigene Fotos ersetzen.
*/

function builtinPages(list) {
  return list.map(([svg, text, sound, soundBg], index) => ({
    id: "p" + index,
    // Name einer eingebauten Grafik – oder einer Bilddatei in bilder/
    svg: ILL[svg] ? svg : null,
    imageUrl: ILL[svg] ? null : "bilder/" + svg + ".jpg",
    text,
    sound: sound || null,
    soundBg: Boolean(soundBg),
    sfx: null,
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
      ["filter", "Der Kaffee läuft durch.", "kaffeemaschine"],
      ["milch", "Ein Schuss Milch.", "kuh"],
      ["umruehren", "Einmal umrühren."],
      ["pause", "Und jetzt: Pause."]
    ])
  },
  {
    id: "fischer",
    builtin: true,
    storyOnly: true,
    name: "Der Fischer und seine Frau",
    pages: builtinPages([
      ["fischer_angeln", "Es war einmal ein armer Fischer.", "wellen", true],
      ["fischer_angeln", "Er lebte mit seiner Frau in einer alten Hütte am Meer."],
      ["fischer_angeln", "Jeden Tag ging er zum Wasser und angelte.", "moewe"],
      ["fischer_angeln", "Eines Tages saß er wieder am Ufer und wartete."],
      ["fischer_angeln", "Da zuckte seine Angel."],
      ["fischer_angeln", "Er zog kräftig, und an der Angel hing ein riesiger Butt."],

      ["fischer_butt", "Der Butt sprach: „Lieber Fischer, lass mich leben!“"],
      ["fischer_butt", "„Ich bin kein gewöhnlicher Fisch, ich bin ein verzauberter Prinz.“"],
      ["fischer_butt", "Der Fischer erschrak."],
      ["fischer_butt", "„Ein sprechender Fisch! Den muss ich schwimmen lassen.“"],
      ["fischer_butt", "Er setzte den Butt zurück ins Wasser."],
      ["fischer_butt", "Der Butt tauchte tief hinab und war verschwunden."],

      ["fischer_huette", "Der Fischer ging heim zur Hütte."],
      ["fischer_huette", "Seine Frau Ilsebill fragte: „Hast du heute nichts gefangen?“"],
      ["fischer_huette", "„Doch, einen Butt. Aber er konnte sprechen, da habe ich ihn freigelassen.“"],
      ["fischer_huette", "„Und du hast dir nichts gewünscht?“, rief sie."],
      ["fischer_huette", "„Geh sofort zurück und wünsch dir ein kleines Haus!“"],

      ["fischer_strand", "Der Fischer ging ungern zum Meer zurück."],
      ["fischer_strand", "Das Wasser war grün und gelb und nicht mehr so klar."],
      ["fischer_strand", "Er rief: „Butt, Butt in der See, meine Frau, die Ilsebill, will nicht so, wie ich wohl will.“"],
      ["fischer_strand", "Der Butt kam und fragte: „Was will sie denn?“"],
      ["fischer_strand", "„Sie möchte ein kleines Haus“, sagte der Fischer."],
      ["fischer_strand", "„Geh nur heim. Sie hat es schon.“"],
      ["fischer_strand", "Und wirklich: Da stand ein hübsches Häuschen mit einem Garten."],
      ["fischer_strand", "Aber nach ein paar Wochen sagte die Frau: „Das Haus ist zu klein. Ich will ein Schloss!“"],

      ["fischer_sturm", "Der Fischer ging wieder zum Meer.", "regen", true],
      ["fischer_sturm", "Das Wasser war dunkelblau und unruhig."],
      ["fischer_sturm", "Der Butt erfüllte den Wunsch, und die Frau wohnte in einem Schloss."],
      ["fischer_sturm", "Doch bald wollte sie König sein, dann Kaiser, dann sogar Papst."],
      ["fischer_sturm", "Jedes Mal wurde das Meer wilder."],
      ["fischer_sturm", "Am Ende wollte Ilsebill sein wie der liebe Gott."],
      ["fischer_sturm", "Der Fischer lief zum Strand. Es stürmte und donnerte.", "donner"],
      ["fischer_sturm", "Der Himmel war schwarz, und die Wellen waren hoch wie Berge."],
      ["fischer_sturm", "Zitternd rief er: „Butt, Butt in der See, meine Frau, die Ilsebill, will nicht so, wie ich wohl will.“"],
      ["fischer_sturm", "„Was will sie denn?“, fragte der Butt."],
      ["fischer_sturm", "„Sie will sein wie der liebe Gott.“"],
      ["fischer_sturm", "„Geh nur heim. Sie sitzt schon wieder in ihrer alten Hütte.“"],

      ["fischer_huette", "Der Fischer ging heim.", "wellen", true],
      ["fischer_huette", "Da stand die alte Hütte am Meer, und die Frau saß davor."],
      ["fischer_huette", "Dort wohnen die beiden noch heute."],
      ["fischer_huette", "Wer nie genug bekommt, verliert am Ende alles."]
    ])
  },
  {
    id: "meer",
    builtin: true,
    name: "Ein Tag am Meer",
    pages: builtinPages([
      ["auto", "Wir fahren ans Meer.", "auto"],
      ["sonne", "Die Sonne scheint.", "voegel", true],
      ["wellen", "Die Wellen rauschen.", "wellen", true],
      ["schiff", "Ein Schiff fährt vorbei.", "schiffshorn"],
      ["moewe", "Eine Möwe fliegt über das Wasser.", "moewe"],
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
