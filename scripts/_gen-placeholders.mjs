/**
 * Generate tasteful on-brand placeholder gallery images for the travel sampler
 * series. Clearly labelled "sample image — replace with your own" so a newcomer
 * knows to swap them. 3:2 JPGs, tiny (gradient compresses to a few KB).
 * Run: node scripts/_gen-placeholders.mjs
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const base = new URL('../src/content/blog/_images/', import.meta.url).pathname;
const sets = [
  { slug: 'three-cities-one-morning-walk-lisbon', city: 'Lisbon',
    pairs: [['#fb923c', '#fbbf24'], ['#f472b6', '#fb923c'], ['#fbbf24', '#f97316']] },
  { slug: 'three-cities-one-morning-walk-kyoto', city: 'Kyoto',
    pairs: [['#f472b6', '#818cf8'], ['#a78bfa', '#f472b6'], ['#818cf8', '#22d3ee']] },
  { slug: 'three-cities-one-morning-walk-edinburgh', city: 'Edinburgh',
    pairs: [['#22d3ee', '#818cf8'], ['#334155', '#22d3ee'], ['#818cf8', '#2dd4bf']] },
];
const W = 1200, H = 800;

for (const s of sets) {
  const dir = path.join(base, s.slug);
  mkdirSync(dir, { recursive: true });
  for (let i = 0; i < 3; i++) {
    const [a, b] = s.pairs[i];
    const ang = [25, 65, 115][i];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><linearGradient id="g" gradientTransform="rotate(${ang})">
    <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
  </linearGradient></defs>
  <rect width="${W}" height="${H}" fill="#04060c"/>
  <rect width="${W}" height="${H}" fill="url(#g)" opacity="0.82"/>
  <rect width="${W}" height="${H}" fill="#04060c" opacity="0.20"/>
  <text x="60" y="${H - 96}" font-family="Georgia, 'Times New Roman', serif" font-size="80" font-weight="700" fill="#ffffff" opacity="0.96">${s.city}</text>
  <text x="64" y="${H - 48}" font-family="system-ui, sans-serif" font-size="27" fill="#ffffff" opacity="0.72">morning walk &#183; 0${i + 1} / 03</text>
  <text x="${W - 60}" y="66" text-anchor="end" font-family="system-ui, sans-serif" font-size="22" fill="#ffffff" opacity="0.62">sample image &#8212; replace with your own</text>
</svg>`;
    const out = path.join(dir, `0${i + 1}.jpg`);
    await sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toFile(out);
    console.log('wrote', out);
  }
}
console.log('placeholder images done');
