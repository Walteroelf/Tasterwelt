"""Holt die Klänge der App aus freien Quellen und bereitet sie auf.

Aufruf (siehe scripts/KLAENGE.md):
    python klaenge.py <App-Ordner> <Zwischenspeicher-Ordner>

- Instrumente: Versilian Community Sample Library (VCSL), CC0
  https://github.com/sgossner/VCSL
- Raketenstart: NASA (Kennedy Space Center), gemeinfrei, über Wikimedia Commons
- Feuerwerk: Wikimedia Commons, gemeinfrei

Jede Aufnahme wird in Mono umgewandelt, vorne von Stille befreit, gekürzt,
ausgeblendet, in der Lautstärke angeglichen und als AAC (.m4a) nach klang/ gelegt.
Benötigt macOS (afconvert) und die Python-Pakete numpy und soundfile.
"""
import sys, os, hashlib, subprocess, tempfile, urllib.request, urllib.parse
import numpy as np
import soundfile as sf

app = sys.argv[1]
cache = sys.argv[2]
out_dir = os.path.join(app, "klang")
os.makedirs(out_dir, exist_ok=True)
os.makedirs(cache, exist_ok=True)

VCSL = "https://raw.githubusercontent.com/sgossner/VCSL/master/"
COMMONS = "https://commons.wikimedia.org/wiki/Special:FilePath/"

ID = "Idiophones/Struck Idiophones/"

# Name in klang/ → (Quelle, längste Dauer in s, Ausblenden in s, Pegel)
# Pegel: Spitzenwert nach dem Angleichen (1.0 = volle Aussteuerung)
CLIPS = {
    "marimba-c2": (VCSL + ID + "Marimba/Marimba_hit_Outrigger_C2_med_01.wav", 3.0, 1.0, 0.9),
    "marimba-f3": (VCSL + ID + "Marimba/Marimba_hit_Outrigger_F3_med_01.wav", 2.5, 1.0, 0.9),
    "marimba-c4": (VCSL + ID + "Marimba/Marimba_hit_Outrigger_C4_med_01.wav", 2.0, 0.8, 0.9),
    "marimba-f5": (VCSL + ID + "Marimba/Marimba_hit_Outrigger_F5_med_01.wav", 1.6, 0.6, 0.9),
    "marimba-c6": (VCSL + ID + "Marimba/Marimba_hit_Outrigger_C6_med_01.wav", 1.4, 0.6, 0.9),

    "vibes-f2": (VCSL + ID + "Vibraphone/Soft Mallets/Vibes_soft_F2_v2_rr1_Main.wav", 4.5, 1.5, 0.9),
    "vibes-c3": (VCSL + ID + "Vibraphone/Soft Mallets/Vibes_soft_C3_v2_rr1_Main.wav", 4.5, 1.5, 0.9),
    "vibes-g3": (VCSL + ID + "Vibraphone/Soft Mallets/Vibes_soft_G3_v2_rr1_Main.wav", 4.5, 1.5, 0.9),
    "vibes-d4": (VCSL + ID + "Vibraphone/Soft Mallets/Vibes_soft_D4_v2_rr1_Main.wav", 4.0, 1.5, 0.9),
    "vibes-a4": (VCSL + ID + "Vibraphone/Soft Mallets/Vibes_soft_A4_v2_rr1_Main.wav", 4.0, 1.5, 0.9),
    "vibes-e5": (VCSL + ID + "Vibraphone/Soft Mallets/Vibes_soft_E5_v2_rr1_Main.wav", 3.5, 1.2, 0.9),

    "chime-a4": (VCSL + ID + "Hand Chimes/sus_A4_r01_main.wav", 4.0, 1.5, 0.8),
    "chime-c5": (VCSL + ID + "Hand Chimes/sus_C5_r01_main.wav", 4.0, 1.5, 0.8),
    "chime-e5": (VCSL + ID + "Hand Chimes/sus_E5_r01_main.wav", 4.0, 1.5, 0.8),
    "glocke-c4": (VCSL + ID + "Tubular Bells 2/TB_hit_C4_v2_1.wav", 5.0, 2.0, 0.8),
    "glitzer": (VCSL + ID + "Bell Tree/Stroke/BellTree_Stroke_3_Mid.wav", 3.0, 1.0, 0.7),

    "glas-1": (VCSL + "Idiophones/Friction Idiophones/Wine Glasses/Sustains/Slow/glass1_D#4_Slow_1_Main.wav", 7.0, 2.5, 0.8),
    "glas-2": (VCSL + "Idiophones/Friction Idiophones/Wine Glasses/Sustains/Slow/glass2_F#4_Slow_1_Main.wav", 7.0, 2.5, 0.8),
    "glas-3": (VCSL + "Idiophones/Friction Idiophones/Wine Glasses/Sustains/Slow/glass3_A#4_Slow_1_Main.wav", 7.0, 2.5, 0.8),

    "meer": (VCSL + "Membranophones/Other Membranophones/Ocean Drum/OceanDrum_Sus_2_Mid.wav", 4.0, 1.5, 0.7),
    "tropfen-1": (VCSL + "Idiophones/Plucked Idiophones/Kalimba, Tanzania/MBira3_pluck_Main_E5_k25_50_100_rr2.wav", 1.6, 0.8, 0.8),
    "tropfen-2": (VCSL + "Idiophones/Plucked Idiophones/Kalimba, Tanzania/MBira3_pluck_Main_F#5_k1_50_100_rr2.wav", 1.6, 0.8, 0.8),
    "tropfen-3": (VCSL + "Idiophones/Plucked Idiophones/Kalimba, Tanzania/MBira3_pluck_Main_G#5_k26_50_100_rr2.wav", 1.6, 0.8, 0.8),
    "tropfen-4": (VCSL + "Idiophones/Plucked Idiophones/Kalimba, Tanzania/MBira3_pluck_Main_C#6_k27_50_100_rr2.wav", 1.6, 0.8, 0.8),

    "holz": (VCSL + ID + "Woodblock/wood_click3_vl2.wav", 0.6, 0.3, 0.8),
    "klack": (VCSL + ID + "Claves/Claves1_Hit_v2_rr1_Mid.wav", 0.5, 0.25, 0.8),
    "knall": (VCSL + ID + "Slapstick/slapstick_rr2.wav", 0.8, 0.4, 1.0),
    "luft": (VCSL + ID + "Cabasa/Cabasa1_Rub_v1_rr1_Mid.wav", 0.8, 0.3, 0.6),
}

ROCKET = COMMONS + urllib.parse.quote("Artemis II Live Launch Coverage - Pad Camera Site 4 (KSC-20260401-AU-LMM01-0001-Artemis II Live Launch Coverage Pad Camera Site 4).wav")
# "Fireworks piece" von stephan (pdsounds.org), als MP3-Fassung von Commons
FIREWORKS = "https://upload.wikimedia.org/wikipedia/commons/transcoded/2/2b/Fireworks_piece.ogg/Fireworks_piece.ogg.mp3"


def fetch(url):
    name = hashlib.sha1(url.encode()).hexdigest()[:12] + os.path.splitext(urllib.parse.unquote(url))[1]
    path = os.path.join(cache, name)
    if not os.path.exists(path):
        # Leerzeichen, Kommas und # in Dateinamen der Bibliothek kodieren
        url = urllib.parse.quote(url, safe=":/%")
        request = urllib.request.Request(url, headers={"User-Agent": "Tasterwelt-Klaenge/1.0 (Schulprojekt)"})
        with urllib.request.urlopen(request) as response, open(path, "wb") as f:
            f.write(response.read())
    return path


def load(path):
    data, rate = sf.read(path, always_2d=True)
    return data.mean(axis=1).astype(np.float64), rate


def trim_start(x, rate, threshold=0.02):
    peak = np.max(np.abs(x)) or 1
    above = np.nonzero(np.abs(x) > threshold * peak)[0]
    start = max(0, (above[0] if len(above) else 0) - int(0.004 * rate))
    return x[start:]


def shape(x, rate, length, fade, level):
    x = x[: int(length * rate)].copy()
    n = min(len(x), int(fade * rate))
    if n > 0:
        x[-n:] *= np.linspace(1, 0, n) ** 2
    # kurzes Einblenden gegen Knackser
    m = min(len(x), int(0.002 * rate))
    x[:m] *= np.linspace(0, 1, m)
    peak = np.max(np.abs(x)) or 1
    return x / peak * level


def write(name, x, rate):
    tmp = os.path.join(tempfile.mkdtemp(), name + ".wav")
    sf.write(tmp, x.astype(np.float32), rate)
    target = os.path.join(out_dir, name + ".m4a")
    subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "64000", "-c", "1", tmp, target], check=True)
    os.remove(tmp)
    print(f"{name}: {len(x) / rate:.1f} s, {os.path.getsize(target) // 1024} KB", flush=True)


def envelope(x, rate, window=0.02):
    n = max(1, int(window * rate))
    return np.convolve(np.abs(x), np.ones(n) / n, mode="same")


for name, (url, length, fade, level) in CLIPS.items():
    x, rate = load(fetch(url))
    write(name, shape(trim_start(x, rate), rate, length, fade, level), rate)

# Raketenstart: lautester Abschnitt von 6 Sekunden, weich ein- und ausgeblendet
x, rate = load(fetch(ROCKET))
env = envelope(x, rate, 0.5)
center = int(np.argmax(env))
start = max(0, center - int(2.5 * rate))
clip = x[start: start + int(6 * rate)].copy()
clip[: int(0.8 * rate)] *= np.linspace(0, 1, int(0.8 * rate))
write("rakete", shape(clip, rate, 6, 2.5, 0.85), rate)

# Feuerwerk: die drei kräftigsten Knalle (mit Abstand), je 3 Sekunden
x, rate = load(fetch(FIREWORKS))
env = envelope(x, rate, 0.01)
taken = []
for index in np.argsort(env)[::-1]:
    if all(abs(index - t) > 3 * rate for t in taken):
        taken.append(index)
    if len(taken) == 3:
        break
for i, peak in enumerate(sorted(taken)):
    start = max(0, peak - int(0.05 * rate))
    write(f"feuerwerk-{i + 1}", shape(x[start:], rate, 3.0, 2.0, 0.9), rate)

print("fertig")
