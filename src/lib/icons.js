// Inline a single Tabler icon at build time by reading the committed sprite
// (public/icons-sprite.svg) — so a post page that uses one glyph ships only that
// icon's paths, not the 1.8 MB sprite. No @tabler/icons dependency at build/CI.
import fs from 'node:fs';
import path from 'node:path';

let _sprite = null;
function sprite() {
  if (_sprite == null) {
    try { _sprite = fs.readFileSync(path.resolve('public/icons-sprite.svg'), 'utf8'); }
    catch { _sprite = ''; }
  }
  return _sprite;
}

const _cache = new Map();
/** Inner SVG markup (paths) for a Tabler icon name, or null if unknown. */
export function iconInner(name) {
  if (!name || typeof name !== 'string') return null;
  const clean = name.replace(/[^a-z0-9-]/gi, '');
  if (!clean) return null;
  if (_cache.has(clean)) return _cache.get(clean);
  const m = sprite().match(new RegExp(`<symbol id="ti-${clean}"[^>]*>([\\s\\S]*?)</symbol>`));
  const inner = m ? m[1] : null;
  _cache.set(clean, inner);
  return inner;
}

/** True if the icon exists in the sprite. */
export function hasIcon(name) { return iconInner(name) != null; }
