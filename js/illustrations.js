/*
  Eigene Illustrationen – flache Formen, gezeichnet für dunklen Grund.
  Farben kommen über Klassen aus der Farbwelt (siehe css: .ill .a/.b/.c/.k):
  a = Hauptfarbe, b/c = Begleitfarben, k = Hintergrund; sa/sb/sc/sk = Linien.
  Alle Bilder haben das Format 200 × 150.
*/

function ill(inner) {
  return `<svg class="ill" viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;
}

const ILL = {
  /* ---------- Kaffeepause ---------- */
  uhr: ill(`
    <circle class="a" cx="100" cy="75" r="56"/>
    <circle class="sk" cx="100" cy="75" r="46" stroke-width="2" stroke-dasharray="2 22.08"/>
    <rect class="k" x="97" y="38" width="6" height="40" rx="3"/>
    <rect class="k" x="97" y="72" width="34" height="6" rx="3"/>
    <circle class="b" cx="100" cy="75" r="6"/>`),

  wasserkocher: ill(`
    <path class="sb" d="M80 40 q0 -10 6 -14 M100 36 q0 -12 6 -18 M120 40 q0 -10 6 -14" stroke-width="5"/>
    <path class="a" d="M58 132 L68 62 Q100 50 132 62 L142 132 Z"/>
    <path class="sa" d="M138 76 Q170 78 162 112" stroke-width="9"/>
    <path class="a" d="M60 74 L34 58 L38 52 L64 64 Z"/>
    <rect class="c" x="58" y="128" width="84" height="10" rx="3"/>`),

  filter: ill(`
    <path class="b" d="M58 22 L142 22 L114 66 L86 66 Z"/>
    <circle class="c" cx="100" cy="80" r="4"/>
    <circle class="c" cx="100" cy="94" r="4"/>
    <rect class="a" x="62" y="104" width="76" height="40" rx="10"/>
    <path class="sa" d="M138 112 q20 0 20 12 q0 12 -20 12" stroke-width="7"/>`),

  milch: ill(`
    <g transform="rotate(-38 70 58)">
      <rect class="b" x="46" y="34" width="48" height="68" rx="4"/>
      <path class="b" d="M46 36 L70 14 L94 36 Z"/>
      <rect class="k" x="56" y="58" width="28" height="18" rx="3"/>
    </g>
    <path class="sb" d="M98 56 Q112 84 106 108" stroke-width="6"/>
    <rect class="a" x="70" y="106" width="76" height="38" rx="10"/>
    <path class="sa" d="M146 114 q20 0 20 12 q0 12 -20 12" stroke-width="7"/>`),

  umruehren: ill(`
    <rect class="b" x="106" y="6" width="8" height="64" rx="4" transform="rotate(22 110 40)"/>
    <path class="a" d="M48 62 L152 62 L142 132 Q100 144 58 132 Z"/>
    <ellipse class="k" cx="100" cy="64" rx="50" ry="8"/>
    <ellipse class="sc" cx="100" cy="64" rx="28" ry="4" stroke-width="3"/>
    <path class="sa" d="M150 78 q30 2 26 26 q-4 18 -32 18" stroke-width="8"/>`),

  pause: ill(`
    <path class="sb" d="M82 46 q-8 -12 0 -22 q8 -10 0 -20 M104 46 q-8 -12 0 -22 q8 -10 0 -20 M126 46 q-8 -12 0 -22 q8 -10 0 -20" stroke-width="5"/>
    <ellipse class="c" cx="104" cy="134" rx="74" ry="10"/>
    <path class="a" d="M56 58 L152 58 L142 128 Q104 140 66 128 Z"/>
    <path class="sa" d="M150 72 q28 2 24 24 q-4 16 -30 16" stroke-width="8"/>`),

  /* ---------- Ein Tag am Meer ---------- */
  auto: ill(`
    <rect class="c" x="0" y="128" width="200" height="4" rx="2"/>
    <path class="a" d="M66 84 L82 56 L130 56 L148 84 Z"/>
    <rect class="a" x="34" y="80" width="134" height="34" rx="12"/>
    <path class="k" d="M88 62 L104 62 L104 80 L78 80 Z M112 62 L126 62 L138 80 L112 80 Z"/>
    <circle class="k" cx="68" cy="116" r="15"/><circle class="b" cx="68" cy="116" r="7"/>
    <circle class="k" cx="138" cy="116" r="15"/><circle class="b" cx="138" cy="116" r="7"/>`),

  sonne: ill(`
    <circle class="a" cx="100" cy="75" r="34"/>
    <g class="sb" stroke-width="7">
      <path d="M100 18 V30 M100 120 V132 M43 75 H55 M145 75 H157 M60 35 L68 43 M132 107 L140 115 M140 35 L132 43 M68 107 L60 115"/>
    </g>`),

  wellen: ill(`
    <path class="sa" d="M14 62 q22 -18 43 0 t43 0 t43 0 t43 0" stroke-width="9"/>
    <path class="sb" d="M14 90 q22 -18 43 0 t43 0 t43 0 t43 0" stroke-width="9"/>
    <path class="sc" d="M14 118 q22 -18 43 0 t43 0 t43 0 t43 0" stroke-width="9"/>`),

  schiff: ill(`
    <rect class="c" x="98" y="20" width="5" height="84" rx="2"/>
    <path class="b" d="M106 24 L150 96 L106 96 Z"/>
    <path class="b" d="M95 40 L62 96 L95 96 Z"/>
    <path class="a" d="M40 104 L164 104 L148 126 L56 126 Z"/>
    <path class="sb" d="M20 138 q18 -10 36 0 t36 0 t36 0 t36 0 t36 0" stroke-width="4"/>`),

  moewe: ill(`
    <circle class="a" cx="160" cy="32" r="16"/>
    <path class="sb" d="M40 78 Q70 44 100 78 Q130 44 160 78" stroke-width="9"/>
    <path class="sc" d="M20 130 q20 -12 40 0 t40 0 t40 0 t40 0" stroke-width="5"/>`),

  untergang: ill(`
    <circle class="a" cx="100" cy="98" r="48"/>
    <rect class="k" x="0" y="98" width="200" height="52"/>
    <rect class="b" x="30" y="104" width="140" height="5" rx="2.5"/>
    <rect class="a" x="58" y="116" width="84" height="5" rx="2.5"/>
    <rect class="c" x="80" y="128" width="40" height="5" rx="2.5"/>`),

  /* ---------- Vorschaubilder der Bausteine ---------- */
  ballon: ill(`
    <path class="sb" d="M100 108 C94 124 106 132 100 148" stroke-width="2.5"/>
    <ellipse class="a" cx="100" cy="62" rx="38" ry="46"/>
    <path class="a" d="M94 110 L106 110 L100 102 Z"/>
    <ellipse class="k" cx="86" cy="44" rx="6" ry="12" transform="rotate(25 86 44)" opacity=".35"/>`),

  domino: ill(`
    <rect class="c" x="0" y="128" width="200" height="4" rx="2"/>
    <rect class="a" x="22" y="58" width="22" height="70" rx="3"/>
    <rect class="a" x="62" y="58" width="22" height="70" rx="3"/>
    <rect class="a" x="102" y="58" width="22" height="70" rx="3"/>
    <rect class="b" x="148" y="58" width="22" height="70" rx="3" transform="rotate(28 170 128)"/>`),

  rakete: ill(`
    <circle class="b" cx="30" cy="30" r="2"/><circle class="b" cx="170" cy="20" r="2"/><circle class="b" cx="150" cy="70" r="1.5"/><circle class="b" cx="40" cy="90" r="1.5"/>
    <path class="c" d="M88 112 Q100 146 112 112 Z"/>
    <path class="a" d="M100 8 C122 30 126 76 118 108 L82 108 C74 76 78 30 100 8 Z"/>
    <circle class="k" cx="100" cy="52" r="11"/><circle class="b" cx="100" cy="52" r="6"/>
    <path class="c" d="M82 82 L66 112 L84 106 Z M118 82 L134 112 L116 106 Z"/>`),

  feuerwerk: ill(`
    <g class="sa" stroke-width="4">
      <path d="M70 60 L70 34 M70 60 L94 50 M70 60 L94 72 M70 60 L70 86 M70 60 L46 72 M70 60 L46 50"/>
    </g>
    <g class="sb" stroke-width="3">
      <path d="M140 46 L140 28 M140 46 L156 40 M140 46 L156 54 M140 46 L140 64 M140 46 L124 54 M140 46 L124 40"/>
    </g>
    <circle class="c" cx="120" cy="104" r="4"/><circle class="c" cx="132" cy="96" r="3"/><circle class="c" cx="108" cy="96" r="3"/>
    <path class="sc" d="M120 148 L120 118" stroke-width="2" stroke-dasharray="4 6"/>`),

  wellenkreise: ill(`
    <circle class="a" cx="100" cy="75" r="8"/>
    <circle class="sa" cx="100" cy="75" r="24" stroke-width="4"/>
    <circle class="sb" cx="100" cy="75" r="44" stroke-width="3" opacity=".8"/>
    <circle class="sc" cx="100" cy="75" r="64" stroke-width="2" opacity=".6"/>`),

  polarlicht: ill(`
    <path class="sb" d="M0 60 C40 20 70 90 110 46 S170 30 200 50" stroke-width="16" opacity=".85"/>
    <path class="sa" d="M0 86 C50 50 80 110 120 74 S180 64 200 80" stroke-width="10" opacity=".9"/>
    <path class="sc" d="M0 108 C40 90 90 126 130 100 S180 96 200 106" stroke-width="6" opacity=".8"/>`),

  lavalampe: ill(`
    <circle class="a" cx="78" cy="56" r="30"/>
    <circle class="c" cx="128" cy="96" r="24"/>
    <circle class="b" cx="140" cy="44" r="14"/>
    <circle class="a" cx="70" cy="114" r="12"/>`),

  musik: ill(`
    <rect class="a" x="34" y="70" width="14" height="40" rx="7"/>
    <rect class="b" x="60" y="44" width="14" height="66" rx="7"/>
    <rect class="a" x="86" y="24" width="14" height="86" rx="7"/>
    <rect class="c" x="112" y="52" width="14" height="58" rx="7"/>
    <rect class="b" x="138" y="78" width="14" height="32" rx="7"/>
    <rect class="a" x="164" y="62" width="14" height="48" rx="7" opacity=".7"/>`),

  ueberraschung: ill(`
    <path class="a" d="M100 30 L110 64 L146 64 L117 84 L128 118 L100 98 L72 118 L83 84 L54 64 L90 64 Z"/>
    <circle class="b" cx="44" cy="40" r="5"/><circle class="c" cx="160" cy="112" r="6"/><circle class="b" cx="158" cy="34" r="3"/>`)
};
