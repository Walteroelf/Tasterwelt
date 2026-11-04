"""Holt die Geräusche für die Geschichten aus Wikimedia Commons und bereitet sie auf.

Aufruf (siehe scripts/KLAENGE.md):
    python geraeusche.py <App-Ordner> <Zwischenspeicher-Ordner>

Es werden nur Aufnahmen verwendet, die gemeinfrei (Public domain) oder CC0 sind.
Jede Aufnahme wird in Mono umgewandelt, auf den gewünschten Ausschnitt gekürzt,
in der Lautstärke angeglichen und als AAC (.m4a) nach klang/ gelegt.
Dauergeräusche (loop=True) werden mit einer Überblendung nahtlos wiederholbar gemacht.
Benötigt macOS (afconvert) und die Python-Pakete numpy, soundfile und av.
"""
import sys, os, subprocess, tempfile, time, urllib.request, urllib.parse
import numpy as np
import soundfile as sf
import av

app, cache = sys.argv[1], sys.argv[2]
out_dir = os.path.join(app, "klang")
os.makedirs(out_dir, exist_ok=True)
os.makedirs(cache, exist_ok=True)

COMMONS = "https://commons.wikimedia.org/wiki/Special:FilePath/"

# id: (Datei bei Commons, Start s, Länge s, Ausblenden s, Pegel, Dauergeräusch)
# Start None = lautester Abschnitt der angegebenen Länge
CLIPS = {
    "moewe":          ("XC707075 - European Herring Gull - Larus argentatus.mp3", None, 4.0, 0.8, 0.9, False),
    "schiffshorn":    ("Cruise ship Albatros ship horn.ogg", 0.8, 5.5, 1.5, 0.9, False),
    "nebelhorn":      ("Fog signal Bremerhaven.ogg", None, 6.0, 1.5, 0.9, False),
    "wellen":         ("On a pebble beach.ogg", 16.0, 14.0, 2.0, 0.7, True),
    "voegel":         ("Bird singing.ogg", 0.0, 12.0, 1.5, 0.8, True),
    "regen":          ("Rain (1).ogg", 8.0, 14.0, 2.0, 0.55, True),
    "donner":         ("Rain and thunder.ogg", 1.5, 8.0, 2.5, 0.95, False),
    "tuer":           ("Closing an old door.ogg", 0.0, 3.5, 0.5, 0.85, False),
    "klingel":        ("Doorbell-classic-dingdong.ogg", 0.0, 4.0, 1.0, 0.85, False),
    "katze":          ("Meow of a pleading cat.oga", 0.0, 3.5, 0.4, 0.9, False),
    "applaus":        ("277021 sandermotions applause-2.wav", 0.0, 6.0, 1.5, 0.8, False),
    "kuh":            ("Cow in Antefasy.wav", 0.0, 1.8, 0.3, 0.9, False),
    "eingiessen":     ("Boiling water being poured into a mug for tea.ogg", 1.0, 8.0, 1.5, 0.85, False),
    "kaffeemaschine": ("Drip coffee maker dripping.ogg", None, 7.0, 1.5, 0.85, False),
    "dampfzug":       ("Steam engine.ogg", 5.0, 12.0, 2.0, 0.7, True),
    "auto":           ("Cars passing over bridge.ogg", None, 7.0, 1.5, 0.85, False),
}


def fetch(name):
    path = os.path.join(cache, name.replace("/", "_"))
    if not os.path.exists(path):
        time.sleep(3)  # Wikimedia bittet um Zurückhaltung
        url = COMMONS + urllib.parse.quote(name)
        request = urllib.request.Request(url, headers={"User-Agent": "Tasterwelt-Klaenge/1.0 (Schulprojekt)"})
        with urllib.request.urlopen(request, timeout=90) as response, open(path, "wb") as f:
            f.write(response.read())
    return path


def load(path):
    """Liest auch Ogg-Dateien mit Skeleton-Stream (libsndfile kann das nicht)."""
    container = av.open(path)
    stream = container.streams.audio[0]
    parts = []
    for frame in container.decode(stream):
        a = frame.to_ndarray().astype(np.float32)
        channels = len(frame.layout.channels)
        parts.append(a.reshape(channels, -1) if a.shape[0] == channels else a.reshape(-1, channels).T)
    return np.concatenate(parts, axis=1).mean(axis=0).astype(np.float64), stream.rate


def loudest(x, rate, length):
    n = int(length * rate)
    if len(x) <= n:
        return 0
    # gleitender Mittelwert der Energie über eine Summentabelle (schnell auch bei langen Dateien)
    total = np.concatenate([[0], np.cumsum(x * x)])
    power = (total[n:] - total[:-n]) / n
    step = rate // 10
    return int(np.argmax(power[::step])) * step


def make_loop(x, n):
    """Ende klingt in den Anfang hinein, damit die Wiederholung nicht hörbar springt."""
    ramp = np.linspace(0, 1, n)
    joined = x[-n:] * (1 - ramp) + x[:n] * ramp
    return np.concatenate([joined, x[n:-n]])


def write(name, x, rate):
    tmp = os.path.join(tempfile.mkdtemp(), name + ".wav")
    sf.write(tmp, x.astype(np.float32), rate)
    target = os.path.join(out_dir, name + ".m4a")
    subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "56000", "-c", "1", tmp, target], check=True)
    os.remove(tmp)
    print(f"{name}: {len(x) / rate:.1f} s, {os.path.getsize(target) // 1024} KB", flush=True)


for name, (file, start, length, fade, level, loop) in CLIPS.items():
    x, rate = load(fetch(file))
    if rate < 16000:
        # AAC kennt keine 8 kHz: auf 24 kHz hochrechnen
        x = np.interp(np.arange(0, len(x) * 24000 / rate) * rate / 24000, np.arange(len(x)), x)
        rate = 24000
    x = x - np.mean(x)  # Gleichspannung entfernen
    begin = int(start * rate) if start is not None else loudest(x, rate, length)
    x = x[begin: begin + int(length * rate)].copy()

    if loop:
        x = make_loop(x, int(min(fade, length / 3) * rate))
    else:
        n = min(len(x), int(fade * rate))
        x[-n:] *= np.linspace(1, 0, n) ** 2
        m = min(len(x), int(0.004 * rate))
        x[:m] *= np.linspace(0, 1, m)

    # Pegel nach 99,5-%-Perzentil statt Spitzenwert, damit einzelne Spitzen nicht alles leise machen
    ref = np.percentile(np.abs(x), 99.5) or 1
    x = np.clip(x / ref * (level * 0.8), -level, level)
    write(name, x, rate)

print("fertig")
