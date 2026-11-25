"""Erzeugt die Texte der mitgelieferten Vorlagen mit der Thorsten-Stimme.

Aufruf (siehe scripts/KLAENGE.md):
    python stimme.py <App-Ordner> <Stimmmodell.onnx> [Sprechtempo]

Sprechtempo: 1.0 = normal, 1.15 = etwas langsamer (Standard), 1.3 = langsam.
Legt stimme/<hash>.m4a und js/voice.js im App-Ordner an.
Benötigt macOS (afconvert) und das Python-Paket piper-tts.
Vorbild: scripts/generate-voice.py aus Bilderwahl2.
"""
import sys, re, json, wave, hashlib, os, subprocess, tempfile
from fractions import Fraction
import numpy as np
from scipy.signal import resample_poly
from piper import PiperVoice, SynthesisConfig

app = sys.argv[1]
model = sys.argv[2]
length_scale = float(sys.argv[3]) if len(sys.argv) > 3 else 1.15

src = open(os.path.join(app, "js/content.js"), encoding="utf8").read()

texts = set()
texts.update(re.findall(r'\["\w+", "([^"]+)"(?:, [^\]]*)?\]', src))   # Seiten der Vorlagen (auch mit Geräusch)
texts.update(re.findall(r'^\s+name: "([^"]+)",$', src, re.M))     # Namen der Vorlagen
texts.update(["Ende"])                                             # feste Texte aus js/story.js


# ---------------------------------------------------------------------------
# Sprechstile: Tempo, Betonung und Tonlage nach Inhalt.
#   tempo   Faktor auf das Grundtempo: > 1 langsamer, < 1 schneller
#   pitch   Tonhöhe in Halbtönen (+ höher, – tiefer); das Tempo bleibt dabei gleich
#   var     Betonungs-Variation (noise_scale und noise_w): 1.0 = Grundeinstellung
# Die erste passende Regel gilt. Reine Zitate („…“) sind wörtliche Rede einer Figur,
# gemischte Sätze („…“, sagte X) bleiben beim Erzähler.
# ---------------------------------------------------------------------------
NARRATOR = {"tempo": 1.0, "pitch": 0.0, "var": 1.0}

STYLES = [
    # Mara und die Schneekönigin
    (r"^„(Ich heiße Lilu|Ich heiße Lilu“, flüsterte)|Ich heiße Lilu|^„Nur du kannst ihn befreien", {"tempo": 0.95, "pitch": 3.0, "var": 1.1}),   # Fee Lilu: hell, leicht
    (r"^„(Wer wagt es|Ich bin so allein)|Dann sagte sie leise|Wer wagt es", {"tempo": 1.18, "pitch": -3.0, "var": 0.9}),                          # Schneekönigin: tief, ruhig
    (r"^„Ich bin Mara|Mara trat näher", {"tempo": 1.0, "pitch": 0.5, "var": 1.1}),                                                               # Mara
    (r"^Auf einem Thron aus Eis|^Die Menschen lachten", {"tempo": 1.12, "pitch": -0.5, "var": 1.0}),
    (r"^Da zersprang das Eis|^Plötzlich flackerte", {"tempo": 0.93, "pitch": 0.5, "var": 1.15}),                                                 # Spannung: etwas schneller
    # Der Fischer und seine Frau
    (r"^„(Lieber Fischer|Ich bin kein gewöhnlicher Fisch|Geh nur heim|Sie hat es schon|Geh nur heim\. Sie sitzt)|Der Butt sprach|Was will sie denn|Der Butt kam und fragte", {"tempo": 1.18, "pitch": -3.5, "var": 0.9}),   # Butt: tief, geheimnisvoll
    (r"^„(Und du hast dir nichts|Geh sofort zurück|Das Haus ist zu klein)|Ich will ein Schloss|Seine Frau Ilsebill|Hast du heute nichts", {"tempo": 0.92, "pitch": 2.5, "var": 1.2}),  # Ilsebill: schrill, fordernd
    (r"^„(Doch, einen Butt|Ein sprechender Fisch|Sie möchte ein kleines Haus|Sie will sein)", {"tempo": 1.05, "pitch": -1.0, "var": 1.0}),         # Fischer
    (r"stürmte und donnerte|Himmel war schwarz|Jedes Mal wurde das Meer wilder|Zitternd rief er", {"tempo": 0.93, "pitch": 0.0, "var": 1.2}),   # Sturm: drängend
    (r"^Wer nie genug bekommt|^Dort wohnen die beiden", {"tempo": 1.25, "pitch": -1.0, "var": 0.9}),                                             # Schluss: ruhig, bedeutsam
    # Allgemein: Ausrufe im Zitat etwas lebhafter, Enden ruhiger
    (r"^„[^“]*!“$", {"tempo": 0.95, "pitch": 1.0, "var": 1.15}),
    (r"^Ende$|^Und jetzt: Pause", {"tempo": 1.25, "pitch": -0.5, "var": 0.9}),
]


def style_for(text):
    for pattern, style in STYLES:
        if re.search(pattern, text):
            return {**NARRATOR, **style}
    return NARRATOR


def synth_wav(voice, text, base_length, style, path):
    """Satz erzeugen. Tonhöhe: erst um den gleichen Faktor langsamer sprechen, dann schneller abspielen –
    so ändert sich die Tonhöhe, das Tempo bleibt wie gewünscht."""
    f = 2 ** (style["pitch"] / 12)                      # > 1: höher
    config = SynthesisConfig(length_scale=base_length * style["tempo"] * f,
                             noise_scale=0.8 * style["var"],
                             noise_w_scale=1.0 * style["var"])
    buf = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    buf.close()
    with wave.open(buf.name, "wb") as w:
        voice.synthesize_wav(text, w, syn_config=config)
    if abs(style["pitch"]) < 0.05:
        os.replace(buf.name, path)
        return
    with wave.open(buf.name) as w:
        rate = w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64)
    ratio = Fraction(1 / f).limit_denominator(200)       # weniger Samples = höher abgespielt
    y = resample_poly(x, ratio.numerator, ratio.denominator)
    y = np.clip(y, -32768, 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate)
        w.writeframes(y.tobytes())
    os.remove(buf.name)


def key(text):
    # muss zu voiceKey() in js/sound.js passen
    return re.sub(r"\s+", " ", text).strip().rstrip(".!").strip()


out_dir = os.path.join(app, "stimme")
os.makedirs(out_dir, exist_ok=True)

# Findet Piper seine espeak-Daten nicht, ESPEAK_DATA_DIR auf den Ordner
# espeak-ng-data im installierten Paket setzen (siehe KLAENGE.md)
espeak_dir = os.environ.get("ESPEAK_DATA_DIR")
voice = PiperVoice.load(model, espeak_data_dir=espeak_dir) if espeak_dir else PiperVoice.load(model)

clips = {}
tmp = tempfile.mkdtemp()
for text in sorted(texts):
    k = key(text)
    style = style_for(text)
    name = hashlib.sha1((k + "|" + str(length_scale) + "|" + json.dumps(style, sort_keys=True)).encode("utf8")).hexdigest()[:10]
    clips[k] = name
    target = os.path.join(out_dir, name + ".m4a")
    if os.path.exists(target):
        continue
    wav = os.path.join(tmp, name + ".wav")
    synth_wav(voice, text, length_scale, style, wav)
    subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "56000", "-c", "1", wav, target], check=True)
    os.remove(wav)
    print(f"{style['pitch']:+.1f} Halbtöne, Tempo {style['tempo']:.2f} | {text[:70]} → {name}", flush=True)

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
