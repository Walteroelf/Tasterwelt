/*
  Klangwerkstatt: einige Klänge werden beim Start berechnet statt aus Dateien geladen.

  - klein: keine Dateien, nichts zu lizenzieren, auch offline sofort da
  - lebendig: jede Glocke, jeder Tropfen und jede Blase klingt ein klein wenig anders
  - ruhig: weiche Einschwingzeit, kein hartes Abschneiden

  Die Klänge landen in `buffers` (siehe sound.js) unter Namen mit "syn-" und werden
  mit play() wie alle anderen Aufnahmen abgespielt.
    syn-schale       Klangschale (Start- und Endsignal)
    syn-glocke-1..4  Glöckchen in C-Dur-Pentatonik
    syn-tropfen-1..3 Wassertropfen
    syn-plopp-1..3   Seifenblase platzt
*/

function buildSynth(ctx) {
  if (buildSynth.done || !ctx) return;
  buildSynth.done = true;

  const sr = ctx.sampleRate;
  const PI2 = Math.PI * 2;

  function make(seconds, fill) {
    const buffer = ctx.createBuffer(1, Math.ceil(seconds * sr), sr);
    const data = buffer.getChannelData(0);
    fill(data);

    // Spitze auf angenehme Lautstärke, letzte 30 ms ausblenden (kein Knacken)
    let peak = 0;
    for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
    const gain = peak > 0 ? 0.8 / peak : 1;
    const fade = Math.floor(0.03 * sr);
    for (let i = 0; i < data.length; i++) {
      data[i] *= gain;
      const left = data.length - 1 - i;
      if (left < fade) data[i] *= left / fade;
    }
    return buffer;
  }

  /* gedämpfte Sinusschwingung (ein "Oberton") */
  function ring(data, freq, amp, decay, attack = 0.004, delay = 0) {
    const start = Math.floor(delay * sr);
    const step = PI2 * freq / sr;
    let phase = Math.random() * PI2;
    for (let i = 0; start + i < data.length; i++) {
      const t = i / sr;
      const env = Math.exp(-t / decay);
      if (env < 0.0004) break;
      phase += step;
      data[start + i] += Math.sin(phase) * amp * env * Math.min(1, t / attack);
    }
  }

  /* Glöckchen: Grundton plus unharmonische Obertöne, jeder klingt kürzer aus */
  function bell(freq) {
    return make(3.2, data => {
      [[1, 1, 1.5], [2.76, 0.42, 0.9], [5.4, 0.22, 0.5], [8.93, 0.1, 0.28]].forEach(([ratio, amp, decay]) => {
        ring(data, freq * ratio, amp, decay);
        ring(data, freq * ratio * 1.0025, amp * 0.6, decay * 0.9);   // leichtes Schweben
      });
    });
  }

  /* Klangschale: tiefer, weich einsetzend, lang ausklingend, mit langsamem Schweben */
  function bowl(freq) {
    return make(7, data => {
      [[1, 1, 4.2], [2.71, 0.4, 2.6], [5.15, 0.16, 1.4]].forEach(([ratio, amp, decay]) => {
        ring(data, freq * ratio, amp, decay, 0.06);
        ring(data, freq * ratio + 0.6 + ratio * 0.15, amp * 0.8, decay, 0.06);
      });
    });
  }

  /* Sinus, dessen Tonhöhe schnell steigt: Tropfen und Blase */
  function chirp(f0, f1, rise, decay, seconds, click = 0) {
    return make(seconds, data => {
      let phase = 0;
      for (let i = 0; i < data.length; i++) {
        const t = i / sr;
        const f = f0 + (f1 - f0) * Math.min(1, t / rise);
        phase += PI2 * f / sr;
        data[i] = Math.sin(phase) * Math.exp(-t / decay);
        if (click && t < 0.004) data[i] += (Math.random() * 2 - 1) * click * (1 - t / 0.004);
      }
    });
  }

  buffers["syn-schale"] = bowl(196);
  [523.25, 587.33, 659.25, 783.99].forEach((f, i) => { buffers["syn-glocke-" + (i + 1)] = bell(f); });
  [[700, 1500], [560, 1250], [820, 1700]].forEach(([a, b], i) => {
    buffers["syn-tropfen-" + (i + 1)] = chirp(a, b, 0.07, 0.09, 0.6);
  });
  [[330, 900], [280, 760], [380, 1050]].forEach(([a, b], i) => {
    buffers["syn-plopp-" + (i + 1)] = chirp(a, b, 0.045, 0.05, 0.4, 0.5);
  });
}
