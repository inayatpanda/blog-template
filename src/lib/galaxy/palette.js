// Topic colours for the 3D explore scene. Theme-aware: the active site theme
// (<html data-site-theme>) swaps the palette so the Observatory recolours per theme.
// SSR-safe (guards `document`); the scene reads these on the client at build time.

const BASE = {
  marrow: 0x2dd4bf, forge: 0x22d3ee, 'old-bones': 0xfbbf24,
  marginalia: 0xa78bfa, 'after-hours': 0xf472b6, atlas: 0xfb923c,
  nebula: 0xc4b5fd, core: 0xe2e8f0,
};
const BASE_ACCENTS = {
  marrow: 0x5eead4, forge: 0x67e8f9, 'old-bones': 0xfde68a,
  marginalia: 0xc4b5fd, 'after-hours': 0xf9a8d4, atlas: 0xfdba74,
  nebula: 0xe9d5ff, core: 0xffffff,
};

// Atlas theme — anatomical engraving: bone/ivory bodies, oxblood + sepia, on near-black.
const ATLAS = {
  marrow: 0xe7ddc7, forge: 0xb8c6cc, 'old-bones': 0xd8c39a,
  marginalia: 0xc9a36b, 'after-hours': 0x9e3b3b, atlas: 0xb5654d,
  nebula: 0xd9cdb6, core: 0xf3ead6,
};
const ATLAS_ACCENTS = {
  marrow: 0xf3ecdb, forge: 0xd7e2e6, 'old-bones': 0xeeddb6,
  marginalia: 0xe0c79a, 'after-hours': 0xc96a6a, atlas: 0xd6896f,
  nebula: 0xeee4d2, core: 0xffffff,
};

// Vista theme — bioluminescent deep sea: aqua/teal bodies, coral + jelly-violet accents.
const VISTA = {
  marrow: 0x2ee6c8, forge: 0x38bdf8, 'old-bones': 0x7dd3c0,
  marginalia: 0x818cf8, 'after-hours': 0xfb7185, atlas: 0x22d3ee,
  nebula: 0xa5f3eb, core: 0xe0f7fa,
};
const VISTA_ACCENTS = {
  marrow: 0x5eead4, forge: 0x7dd3fc, 'old-bones': 0xa7f3d0,
  marginalia: 0xa5b4fc, 'after-hours': 0xfda4af, atlas: 0x67e8f9,
  nebula: 0xccfbf1, core: 0xffffff,
};

// Blueprint theme — cyanotype: monochrome pale-blue "draughting ink" on dark navy.
const BLUEPRINT = {
  marrow: 0x7fdbff, forge: 0xa9d6ff, 'old-bones': 0xcfe3ff,
  marginalia: 0x9fc4f5, 'after-hours': 0xbfe0ff, atlas: 0x86c5ee,
  nebula: 0xd8ecff, core: 0xeaf4ff,
};
const BLUEPRINT_ACCENTS = {
  marrow: 0xb6ecff, forge: 0xcfe6ff, 'old-bones': 0xe6f2ff,
  marginalia: 0xc4dbfa, 'after-hours': 0xdcefff, atlas: 0xb3ddf6,
  nebula: 0xeaf6ff, core: 0xffffff,
};

// ── Light themes — DARK ink on a light sky/sand/parchment (line-art look) ──
// Daybreak — slate/navy inks with sky + sun tones.
const DAYBREAK = {
  marrow: 0x1f4e79, forge: 0x2f6f9e, 'old-bones': 0x3a5a8c,
  marginalia: 0x5a4e8c, 'after-hours': 0xa85a3c, atlas: 0x1f7a6a,
  nebula: 0x44557c, core: 0x16223c,
};
const DAYBREAK_ACCENTS = {
  marrow: 0x2f6aa0, forge: 0x4a90c0, 'old-bones': 0x5577aa,
  marginalia: 0x7a6eb0, 'after-hours': 0xc47650, atlas: 0x2f9c88,
  nebula: 0x6677a0, core: 0x2a3a5c,
};
// Dune — umber / terracotta / ochre inks.
const DUNE = {
  marrow: 0x6b3f2a, forge: 0x8a5a2c, 'old-bones': 0x5a4326,
  marginalia: 0x7a4a3c, 'after-hours': 0xa8513c, atlas: 0x4a6b3a,
  nebula: 0x6b5a3a, core: 0x3a2a16,
};
const DUNE_ACCENTS = {
  marrow: 0x8a5840, forge: 0xb07a3c, 'old-bones': 0x7a5e38,
  marginalia: 0x9a6450, 'after-hours': 0xc66e50, atlas: 0x638a4e,
  nebula: 0x8a7850, core: 0x53402a,
};
// Rivendell — forest green / brown / gold inks on parchment.
const RIVENDELL = {
  marrow: 0x3f6b4a, forge: 0x5a6b32, 'old-bones': 0x6b4f2a,
  marginalia: 0x7a5a2c, 'after-hours': 0x8a4a3c, atlas: 0x466b3f,
  nebula: 0x5a5a3a, core: 0x2f2a1a,
};
const RIVENDELL_ACCENTS = {
  marrow: 0x568a62, forge: 0x768a48, 'old-bones': 0x8a6a3c, marginalia: 0x9a7638,
  'after-hours': 0xa8634e, atlas: 0x5e8a54, nebula: 0x76764e, core: 0x453e28,
};

const THEMES = {
  atlas: { col: ATLAS, acc: ATLAS_ACCENTS },
  vista: { col: VISTA, acc: VISTA_ACCENTS },
  blueprint: { col: BLUEPRINT, acc: BLUEPRINT_ACCENTS },
  daybreak: { col: DAYBREAK, acc: DAYBREAK_ACCENTS },
  dune: { col: DUNE, acc: DUNE_ACCENTS },
  rivendell: { col: RIVENDELL, acc: RIVENDELL_ACCENTS },
};

function activeTheme() {
  try { return (typeof document !== 'undefined' && document.documentElement.dataset.siteTheme) || ''; }
  catch { return ''; }
}
function pick(base, key) { const t = THEMES[activeTheme()]; return (t && t[key]) || base; }

// Proxies so existing `PALETTE.marrow` reads resolve against the active theme — no caller changes.
export const PALETTE = new Proxy({}, { get: (_, k) => pick(BASE, 'col')[k] });
export const ACCENTS = new Proxy({}, { get: (_, k) => pick(BASE_ACCENTS, 'acc')[k] });
export const hex = (c) => '#' + c.toString(16).padStart(6, '0');
