# Tasterwelt

Ursache-Wirkung-Übungen für das iPad: **Mit jedem Tasterdruck passiert etwas.**
Für Kinder, die mit einem Taster (per Kabel und Adapter oder per Bluetooth, z. B. iSwitch) oder mit dem ganzen Bildschirm als Taster üben.

**App öffnen:** https://walteroelf.github.io/Tasterwelt/

---

## Die vier Bausteine

| Baustein | Was passiert bei jedem Druck | Beispiele |
|---|---|---|
| **1 Geschichte** | Eine Seite weiter: Bild, Text, Sprache oder eigene Aufnahme, ggf. Video. Am Ende „Ende!“ mit Konfetti, dann von vorn. | Auf dem Bauernhof, Fahrzeuge, Guten Morgen |
| **2 Aufdecken** | Ein buntes Teil verschwindet. Ist das Bild frei: Bild wippt, Text wird gesprochen, Konfetti. Hat die Seite ein Video, läuft es als Belohnung. | alle Sammlungen |
| **3 Aufbauen** | Ein Stück weiter – nach einigen Drücken das große Ereignis. | **Ballon** (aufpumpen, bis er platzt), **Turm** (stapeln, bis er umfällt), **Rakete** (tanken, abheben) |
| **4 Effekt** | Sofort ein Effekt. | **Feuerwerk**, **Farbkleckse**, **Musik** (Ton für Ton „Alle meine Entchen“), **Lichter**, **Überraschung** (zufälliges Bild einer Sammlung) |

Jede Sammlung (mitgeliefert oder eigene) lässt sich als Geschichte, zum Aufdecken und als Überraschung spielen.

---

## Taster anschließen

Taster-Adapter melden sich am iPad als **Tastatur** und schicken z. B. Leertaste oder Enter.

1. Adapter anschließen bzw. iSwitch per Bluetooth koppeln (Tastatur-Modus, am besten Leertaste oder Enter).
2. **Wichtig:** Die **Schaltersteuerung** von iPadOS muss **aus** sein
   (Einstellungen → Bedienungshilfen → Schaltersteuerung). Sonst fängt das iPad den Tasterdruck ab.
3. In der App auf der Startseite einmal drücken: Oben erscheint „✓ Taster erkannt: Leertaste“.
   Genauer testen: Zahnrad → Taster → graues Feld „Taster testen“.

Ohne Taster: „Bildschirm antippen zählt auch“ ist eingeschaltet – dann ist der ganze Bildschirm ein großer Taster.

---

## Einstellungen (Zahnrad, mit Zahlen-Code)

**Taster**
- **Jede Taste zählt** (Standard) – oder nur bestimmte Tasten: „Taste lernen“ und den Taster drücken.
- **Bildschirm antippen zählt auch** – an/aus.
- **Auslösen** beim Drücken oder beim Loslassen.
- **Sperrzeit** nach einem Druck (keine bis 5 Sekunden) – gegen Doppeldrücke, z. B. bei Tremor. Gedrückt gehaltene Tasten wiederholen nie.
- **Erinnerung**, wenn eine Weile nicht gedrückt wird: Ein großer roter Taster pulsiert, dazu ein sanfter Ton.
- **Tasterdruck anzeigen**: kleiner Punkt unten rechts – grün = angekommen, grau = in der Sperrzeit.

**Sprache und Ton** – Texte vorlesen (Gerätestimme), Sprechtempo, Geräusche an/aus. Eigene Aufnahmen werden immer abgespielt.

**Aufdecken** – Anzahl der Teile (1 bis 16).

**Aufbauen** – Drücke bis zum großen Ereignis (1 bis 15).

**Effekt: Halten-Modus** – Lichter, Musik und Feuerwerk laufen nur, solange der Taster gedrückt ist (wie ein Spielzeug am PowerLink). Aus: Jeder Druck löst den Effekt einmal aus.

**Ruhiger Modus** – weniger Konfetti und Bewegung, sanftere Übergänge.

**Zahlen-Code** – vor den Einstellungen und vor dem Haus-Knopf (Zurück) müssen vier Zahlen eingetippt werden, die als Wörter angezeigt werden („drei – sieben – eins – vier“). So kommen Kinder nicht versehentlich aus der Übung.

Noch sicherer: **Geführter Zugriff** von iPadOS (Einstellungen → Bedienungshilfen → Geführter Zugriff, dann in der App dreimal die obere Taste drücken).

---

## Eigene Inhalte

Startseite → **Eigene Inhalte** → **+ Neue Sammlung** (oder ein Beispiel „Als Kopie bearbeiten“).

Jede Seite hat:
- **Foto** (oder ein Emoji) – mehrere Fotos auf einmal wählen geht auch, der Dateiname wird zum Text (*Mama winkt.jpg* → „Mama winkt“)
- **Text** – wird vorgelesen
- **🎤 Aufnahme** – eigene Stimme, hat Vorrang vor der Gerätestimme (max. 30 Sekunden)
- **🎬 Video** – in der Geschichte als Seite, beim Aufdecken als Belohnung (gut: kurze Videos von vertrauten Personen)

**Weitergeben:** Sammlung bearbeiten → **Exportieren** → Datei per AirDrop ans andere iPad → dort **Sammlung importieren**.

Fotos, Videos und Aufnahmen bleiben nur auf dem Gerät (im Browser gespeichert). Fotos von Personen bitte nur mit Einverständnis verwenden.

---

## Auf dem iPad installieren und offline nutzen

1. Die App in **Safari** öffnen: https://walteroelf.github.io/Tasterwelt/
2. **Teilen → „Zum Home-Bildschirm“** wählen.
3. Ab dann startet die App vom Home-Bildschirm auch **ohne Internet**.

**Hinweise:**
- Töne gibt es nur, wenn „Stumm“ im Kontrollzentrum aus ist.
- iOS erlaubt Ton erst nach der ersten Berührung – deshalb die Übung durch Antippen starten.

---

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite, Spielfläche, Fenster |
| `css/style.css` | Gestaltung (wie Bilderwahl und Kirmes-Kiosk) |
| `js/switch.js` | Tasterabfrage: Tasten, Bildschirm, Sperrzeit, Taster testen/lernen |
| `js/app.js` | Einstellungen, Startseite, Übung starten/beenden, Erinnerung |
| `js/story.js` | Baustein 1: Geschichte |
| `js/reveal.js` | Baustein 2: Aufdecken |
| `js/build.js` | Baustein 3: Aufbauen (Ballon, Turm, Rakete) |
| `js/effect.js` | Baustein 4: Effekt (Feuerwerk, Farbkleckse, Musik, Lichter, Überraschung) |
| `js/content.js` | Mitgelieferte Sammlungen |
| `js/editor.js` | Eigene Sammlungen, Aufnahme, Export/Import |
| `js/sound.js` | Geräusche (Web Audio, ohne Dateien) und Sprache |
| `js/fx.js` | Konfetti, Feuerwerk, Rauch |
| `js/visual.js` | Bilder und Videos anzeigen |
| `js/db.js` | Speicherung auf dem Gerät (IndexedDB) |
| `js/teacher.js` | Zahlen-Code und Einstellungsfenster |
| `js/offline.js`, `sw.js` | Offline-Nutzung |
| `schriften/` | Andika und Grandstander (SIL Open Font License) |

Neue Version: Die `?v=…`-Nummern in `index.html` und `VERSION` in `sw.js` erhöhen.
