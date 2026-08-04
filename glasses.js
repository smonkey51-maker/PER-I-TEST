// Illustrazioni SVG minimali (stesso stile line-art del bicchiere decorativo) per la schermata
// risultato. Sfondo sempre trasparente: nessun rettangolo di sfondo viene disegnato.

const GLASS_CONFIG = {
  rocks: {
    outline: "M22,55 L78,55 L73,125 L27,125 Z",
    rim: { x1: 20, y1: 55, x2: 80, y2: 55 },
    liquid: { baseY: 123, maxHeight: 60 },
    fill: 0.62,
    garnishAnchor: { x: 78, y: 50 },
  },
  coupe: {
    outline: "M14,18 C14,42 34,54 50,54 C66,54 86,42 86,18 Z",
    rim: { x1: 12, y1: 18, x2: 88, y2: 18 },
    extra: [{ d: "M50,54 L50,100", cls: "glass-stem" }, { d: "M34,118 L66,118", cls: "glass-base" }],
    liquid: { baseY: 52, maxHeight: 34 },
    fill: 0.82,
    garnishAnchor: { x: 84, y: 16 },
  },
  highball: {
    outline: "M30,18 L70,18 L66,125 L34,125 Z",
    rim: { x1: 28, y1: 18, x2: 72, y2: 18 },
    liquid: { baseY: 123, maxHeight: 95 },
    fill: 0.75,
    garnishAnchor: { x: 76, y: 15 },
  },
  flute: {
    outline: "M42,15 L58,15 L55,78 Q50,84 45,78 Z",
    rim: { x1: 40, y1: 15, x2: 60, y2: 15 },
    extra: [{ d: "M50,82 L50,112", cls: "glass-stem" }, { d: "M36,118 L64,118", cls: "glass-base" }],
    liquid: { baseY: 79, maxHeight: 60 },
    fill: 0.7,
    garnishAnchor: { x: 58, y: 12 },
  },
  mug: {
    outline: "M28,35 L72,35 L67,122 L33,122 Z",
    rim: { x1: 25, y1: 35, x2: 75, y2: 35 },
    extra: [{ d: "M72,52 Q98,58 94,82 Q90,104 68,106", cls: "glass-handle" }],
    liquid: { baseY: 120, maxHeight: 82 },
    fill: 0.72,
    garnishAnchor: { x: 74, y: 32 },
  },
  tiki: {
    outline: "M35,20 Q18,42 24,72 Q28,108 50,122 Q72,108 76,72 Q82,42 65,20 Z",
    rim: { d: "M35,20 Q50,27 65,20" },
    liquid: { baseY: 120, maxHeight: 95 },
    fill: 0.68,
    garnishAnchor: { x: 70, y: 18 },
  },
  wine: {
    outline: "M20,26 Q18,54 50,60 Q82,54 80,26 Q80,14 50,14 Q20,14 20,26 Z",
    extra: [{ d: "M50,60 L50,108", cls: "glass-stem" }, { d: "M35,116 L65,116", cls: "glass-base" }],
    liquid: { baseY: 58, maxHeight: 42 },
    fill: 0.55,
    garnishAnchor: { x: 76, y: 14 },
  },
};

function garnishSVG(type, anchor) {
  const { x, y } = anchor;
  const g = (inner) => `<g transform="translate(${x},${y})">${inner}</g>`;
  const wheel = (color) => g(
    `<circle r="7" fill="none" stroke="${color}" stroke-width="1.4"/>` +
    `<line x1="-7" y1="0" x2="7" y2="0" stroke="${color}" stroke-width="1"/>` +
    `<line x1="0" y1="-7" x2="0" y2="7" stroke="${color}" stroke-width="1"/>` +
    `<line x1="-5" y1="-5" x2="5" y2="5" stroke="${color}" stroke-width="1"/>` +
    `<line x1="-5" y1="5" x2="5" y2="-5" stroke="${color}" stroke-width="1"/>`
  );
  const twist = (color) => g(
    `<path d="M0,0 C7,-3 7,-11 0,-14 C-7,-11 -7,-3 0,0" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/>`
  );

  switch (type) {
    case "orange-wheel": return wheel("#E8944A");
    case "lime-wheel": return wheel("#8FBF6A");
    case "lemon-wheel": return wheel("#E8D34A");
    case "orange-twist": return twist("#E8944A");
    case "lemon-twist": return twist("#E8D34A");
    case "cherry": return g(
      `<circle cx="-4" cy="4" r="3.2" fill="#B23A3A"/><circle cx="4" cy="6" r="3.2" fill="#B23A3A"/>` +
      `<path d="M-4,1 C-3,-6 3,-8 5,-10" fill="none" stroke="#6E8A6B" stroke-width="1.2"/>` +
      `<path d="M4,3 C4,-4 5,-8 5,-10" fill="none" stroke="#6E8A6B" stroke-width="1.2"/>`
    );
    case "mint": return g(
      `<ellipse cx="-3" cy="0" rx="4" ry="2.2" fill="#6E8A6B" transform="rotate(-20 -3 0)"/>` +
      `<ellipse cx="3" cy="-3" rx="4" ry="2.2" fill="#6E8A6B" transform="rotate(15 3 -3)"/>` +
      `<ellipse cx="0" cy="4" rx="4" ry="2.2" fill="#5B7458" transform="rotate(-5 0 4)"/>`
    );
    case "coffee-beans": return g(
      `<ellipse cx="-3" cy="0" rx="3.4" ry="2.2" fill="#3B2718" transform="rotate(-25 -3 0)"/>` +
      `<line x1="-4.6" y1="0" x2="-1.4" y2="0" stroke="#8C6B4A" stroke-width="0.8" transform="rotate(-25 -3 0)"/>` +
      `<ellipse cx="4" cy="2" rx="3.4" ry="2.2" fill="#3B2718" transform="rotate(20 4 2)"/>` +
      `<line x1="2.4" y1="2" x2="5.6" y2="2" stroke="#8C6B4A" stroke-width="0.8" transform="rotate(20 4 2)"/>`
    );
    case "pineapple": return g(
      `<path d="M-6,7 L0,-8 L6,7 Z" fill="none" stroke="#E0B84A" stroke-width="1.3" stroke-linejoin="round"/>` +
      `<line x1="-3" y1="4" x2="3" y2="-5" stroke="#E0B84A" stroke-width="0.8"/>` +
      `<line x1="3" y1="4" x2="-3" y2="-5" stroke="#E0B84A" stroke-width="0.8"/>`
    );
    case "celery": return g(
      `<line x1="0" y1="6" x2="0" y2="-18" stroke="#8FBF6A" stroke-width="2.2" stroke-linecap="round"/>` +
      `<path d="M-3,-18 L0,-24 L3,-18" fill="none" stroke="#8FBF6A" stroke-width="1.2"/>`
    );
    default: return "";
  }
}

function buildDrinkGlassSVG(drink) {
  const config = GLASS_CONFIG[drink.glass] || GLASS_CONFIG.rocks;
  const { baseY, maxHeight } = config.liquid;
  const h = maxHeight * config.fill;
  const y = baseY - h;

  const rim = config.rim
    ? config.rim.d
      ? `<path class="glass-outline glass-rim" d="${config.rim.d}" />`
      : `<line class="glass-rim" x1="${config.rim.x1}" y1="${config.rim.y1}" x2="${config.rim.x2}" y2="${config.rim.y2}" />`
    : "";

  const extra = (config.extra || [])
    .map((p) => `<path class="glass-outline ${p.cls}" d="${p.d}" fill="none" />`)
    .join("");

  const garnish = garnishSVG(drink.garnish, config.garnishAnchor);
  const clipId = `drinkClip-${drink.name.replace(/[^a-zA-Z0-9]/g, "")}-${Math.random().toString(36).slice(2, 8)}`;

  return `
    <svg viewBox="0 0 100 140" class="drink-glass-svg" role="img" aria-label="${drink.name}">
      <defs>
        <clipPath id="${clipId}">
          <path d="${config.outline}" />
        </clipPath>
      </defs>
      <rect class="drink-liquid" x="0" y="${y}" width="100" height="${h}" clip-path="url(#${clipId})" fill="${drink.color}" />
      <path class="glass-outline" d="${config.outline}" fill="none" />
      ${rim}
      ${extra}
      ${garnish}
    </svg>
  `;
}
