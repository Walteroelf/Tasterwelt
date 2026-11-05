"""Erzeugt die Texte der mitgelieferten Vorlagen mit der Thorsten-Stimme.

Aufruf (siehe scripts/KLAENGE.md):
    python stimme.py <App-Ordner> <Stimmmodell.onnx> [Sprechtempo]

Sprechtempo: 1.0 = normal, 1.15 = etwas langsamer (Standard), 1.3 = langsam.
Legt stimme/<hash>.m4a und js/voice.js im App-Ordner an.
Benötigt macOS (afconvert) und das Python-Paket piper-tts.
Vorbild: scripts/generate-voice.py aus Bilderwahl2.
"""
import sys, re, json, wave, hashlib, os, subprocess, tempfile
from piper import PiperVoice, SynthesisConfig

app = sys.argv[1]
model = sys.argv[2]
length_scale = float(sys.argv[3]) if len(sys.argv) > 3 else 1.15

src = open(os.path.join(app, "js/content.js"), encoding="utf8").read()

texts = set()
texts.update(re.findall(r'\["\w+", "([^"]+)"(?:, [^\]]*)?\]', src))   # Seiten der Vorlagen (auch mit Geräusch)
texts.update(re.findall(r'^\s+name: "([^"]+)",$', src, re.M))     # Namen der Vorlagen
texts.update(["Ende"])                                             # feste Texte aus js/story.js


def key(text):
    # muss zu voiceKey() in js/sound.js passen
    return re.sub(r"\s+", " ", text).strip().rstrip(".!").strip()


out_dir = os.path.join(app, "stimme")
os.makedirs(out_dir, exist_ok=True)

# Findet Piper seine espeak-Daten nicht, ESPEAK_DATA_DIR auf den Ordner
# espeak-ng-data im installierten Paket setzen (siehe KLAENGE.md)
espeak_dir = os.environ.get("ESPEAK_DATA_DIR")
voice = PiperVoice.load(model, espeak_data_dir=espeak_dir) if espeak_dir else PiperVoice.load(model)
config = SynthesisConfig(length_scale=length_scale)

clips = {}
tmp = tempfile.mkdtemp()
for text in sorted(texts):
    k = key(text)
    name = hashlib.sha1((k + "|" + str(length_scale)).encode("utf8")).hexdigest()[:10]
    clips[k] = name
    target = os.path.join(out_dir, name + ".m4a")
    if os.path.exists(target):
        continue
    wav = os.path.join(tmp, name + ".wav")
    with wave.open(wav, "wb") as w:
        voice.synthesize_wav(text, w, syn_config=config)
    subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "48000", "-c", "1", wav, target], check=True)
    os.remove(wav)
    print(text, "→", name, flush=True)

# nicht mehr benutzte Dateien entfernen
for f in os.listdir(out_dir):
    if f.endswith(".m4a") and f[:-4] not in clips.values():
        os.remove(os.path.join(out_dir, f))

with open(os.path.join(app, "js/voice.js"), "w", encoding="utf8") as f:
    f.write("/*\n  Vorab erzeugte Texte mit der Thorsten-Stimme (Piper).\n"
            "  Erzeugt mit scripts/stimme.py – nicht von Hand bearbeiten.\n"
            "  Schlüssel: Text ohne Schlusspunkt, Wert: Datei in stimme/.\n*/\n\n")
    f.write("const VOICE_CLIPS = " + json.dumps(dict(sorted(clips.items())), ensure_ascii=False, indent=0) + ";\n")

print("fertig:", len(clips), "Texte")
