import { GLYPHS, TOPIC_DEFAULTS, resolveGlyph } from '../src/lib/glyphs/index.js';
for (const [k, v] of Object.entries(GLYPHS))
  if (typeof v !== 'function') throw new Error(`glyph ${k} not a function`);
for (const t of Object.keys(TOPIC_DEFAULTS))
  if (TOPIC_DEFAULTS[t] && typeof resolveGlyph(null, t) !== 'function') throw new Error(`no default for ${t}`);
console.log(`OK: ${Object.keys(GLYPHS).length} glyphs, ${Object.keys(TOPIC_DEFAULTS).length} defaults`);
