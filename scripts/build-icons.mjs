// Generate committed icon artifacts from the @tabler/icons devDependency:
//   public/icons-sprite.svg     — one <symbol> per outline icon (id="ti-<name>"), themeable
//   src/data/icons-manifest.json — [{ n:name, c:category, t:"space tags" }] for gallery search
// Run: npm run build:icons   (re-run when bumping @tabler/icons). Nothing at build/CI time
// needs @tabler/icons — the resolver reads the committed sprite.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SRC = path.join(ROOT, 'node_modules/@tabler/icons/icons/outline');
const META = path.join(ROOT, 'node_modules/@tabler/icons/icons.json');

if (!fs.existsSync(SRC)) { console.error('Run `npm i -D @tabler/icons` first.'); process.exit(1); }

const meta = JSON.parse(fs.readFileSync(META, 'utf8'));
const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.svg')).sort();

const symbols = [];
const manifest = [];
for (const file of files) {
  const name = file.replace(/\.svg$/, '');
  let svg = fs.readFileSync(path.join(SRC, file), 'utf8');
  // inner content between the opening <svg ...> and </svg>, minus the transparent bg rect
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
    .replace(/<path stroke="none"[^>]*\/>\s*/g, '').trim();
  symbols.push(`<symbol id="ti-${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</symbol>`);
  const m = meta[name] || {};
  const tags = Array.isArray(m.tags) ? m.tags.map(String).join(' ') : '';
  manifest.push({ n: name, c: m.category || '', t: tags.toLowerCase() });
}

const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">\n${symbols.join('\n')}\n</svg>\n`;
fs.writeFileSync(path.join(ROOT, 'public/icons-sprite.svg'), sprite);
fs.writeFileSync(path.join(ROOT, 'public/icons-manifest.json'), JSON.stringify(manifest));

console.log(`icons: ${files.length} symbols → public/icons-sprite.svg (${(sprite.length / 1024 / 1024).toFixed(2)} MB)`);
console.log(`manifest → public/icons-manifest.json (${(JSON.stringify(manifest).length / 1024).toFixed(0)} KB)`);
