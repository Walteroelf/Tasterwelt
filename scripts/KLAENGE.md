# Klänge und Stimme neu erzeugen

Die App spielt fertige Audiodateien ab:

- `klang/` – Instrumente und Geräusche (Quellen und Lizenzen in `klang/LIZENZ.md`)
- `stimme/` – Texte der Vorlagen mit der Thorsten-Stimme; `js/voice.js` ordnet Text → Datei zu

Eigene Texte spricht die Gerätestimme – oder eine eigene Aufnahme pro Seite.

## Einrichten (einmal)

```bash
python3 -m venv venv
./venv/bin/pip install piper-tts numpy soundfile
curl -LO https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/high/de_DE-thorsten-high.onnx
curl -LO https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/high/de_DE-thorsten-high.onnx.json
```

## Klänge

```bash
./venv/bin/python scripts/klaenge.py . ./klang-cache
```

Lädt die Aufnahmen (VCSL, Wikimedia Commons), schneidet sie zu und legt sie als `.m4a` in `klang/`.
Andere Aufnahme gewünscht: Eintrag in `CLIPS` in `scripts/klaenge.py` ändern und neu ausführen.

## Stimme

Nötig, wenn Texte in `js/content.js` geändert werden. Vorhandene Dateien werden übersprungen,
nicht mehr benötigte gelöscht.

```bash
./venv/bin/python scripts/stimme.py . de_DE-thorsten-high.onnx 1.15
```

Meldet Piper „Error processing file … phontab“, liegt der Ordner zu tief. Dann die Sprachdaten
an einen kurzen Ort kopieren und angeben:

```bash
cp -R venv/lib/python3.*/site-packages/piper/espeak-ng-data /tmp/
ESPEAK_DATA_DIR=/tmp/espeak-ng-data ./venv/bin/python scripts/stimme.py . de_DE-thorsten-high.onnx 1.15
```

Danach die Versionsnummer erhöhen (`?v=…` in `index.html`, `VERSION` in `sw.js`).
