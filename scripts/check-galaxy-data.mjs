import { readFileSync, readdirSync } from 'node:fs';
import { GLYPHS } from '../src/lib/glyphs/index.js';
import topics from '../src/data/topics.json' with { type: 'json' };

const BROAD = new Set(topics.map((t) => t.tag));
const dir = 'src/content/blog';

for (const f of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
  const src = readFileSync(`${dir}/${f}`, 'utf8');
  const fm = src.split('---')[1] || '';

  const glyph = fm.match(/^glyph:\s*["']?([^"'\n]+?)["']?\s*$/m)?.[1]?.trim();
  if (glyph && glyph !== 'none' && !glyph.startsWith('icon:') && !glyph.startsWith('image:') && !GLYPHS[glyph])
    throw new Error(`${f}: unknown glyph "${glyph}"`);

  // tags: support inline array  tags: ["a", "b"]  AND yaml list (- a)
  let tags = [];
  const inline = fm.match(/^tags:\s*\[([^\]]*)\]/m);
  if (inline) {
    tags = inline[1].split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  } else {
    const block = fm.match(/^tags:\s*\n((?:\s*-\s*.+\n?)+)/m)?.[1] || '';
    tags = [...block.matchAll(/^\s*-\s*["']?([\w-]+)/gm)].map((m) => m[1]);
  }
  if (!tags.some((t) => BROAD.has(t))) throw new Error(`${f}: no broad topic tag (found: ${tags.join(', ') || 'none'})`);
}
console.log('OK: galaxy frontmatter valid');
