// Generates public/og-default.png — a simple on-brand 1200x630 share image.
// No image deps: we hand-build a 24-bit RGB PNG with node:zlib (deflate).
// Dark bg (#04060c), a teal->cyan->violet accent bar, a teal corner glow,
// and a blocky placeholder wordmark drawn from a tiny built-in font.
//
// Run: node scripts/make-og-default.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'og-default.png');

const W = 1200;
const H = 630;

// --- canvas (RGB) ---
const px = new Uint8Array(W * H * 3);
const set = (x, y, r, g, b) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = r; px[i + 1] = g; px[i + 2] = b;
};
const blend = (x, y, r, g, b, a) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = Math.round(px[i] * (1 - a) + r * a);
  px[i + 1] = Math.round(px[i + 1] * (1 - a) + g * a);
  px[i + 2] = Math.round(px[i + 2] * (1 - a) + b * a);
};

// Background: near-black #04060c.
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) set(x, y, 0x04, 0x06, 0x0c);

// Soft teal corner glow (top-left) + violet glow (bottom-right).
const glow = (cx, cy, radius, r, g, b, maxA) => {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot(x - cx, y - cy) / radius;
    if (d < 1) blend(x, y, r, g, b, maxA * (1 - d) * (1 - d));
  }
};
glow(120, 90, 620, 0x2d, 0xd4, 0xbf, 0.28);  // teal
glow(W - 80, H - 40, 560, 0x81, 0x8c, 0xf8, 0.22); // violet

// Accent bar (teal -> cyan -> violet) high on the canvas.
const barY = 150, barH = 8, barX0 = 90, barX1 = 540;
const lerp = (a, b, t) => Math.round(a + (b - a) * t);
for (let x = barX0; x < barX1; x++) {
  const t = (x - barX0) / (barX1 - barX0);
  let r, g, b;
  if (t < 0.5) { const u = t / 0.5; r = lerp(0x2d, 0x22, u); g = lerp(0xd4, 0xd3, u); b = lerp(0xbf, 0xee, u); }
  else { const u = (t - 0.5) / 0.5; r = lerp(0x22, 0x81, u); g = lerp(0xd3, 0x8c, u); b = lerp(0xee, 0xf8, u); }
  for (let y = barY; y < barY + barH; y++) set(x, y, r, g, b);
}

// --- tiny 5x7 pixel font for the wordmark ---
const FONT = {
  A: ['01110','10001','10001','11111','10001','10001','10001'],
  B: ['11110','10001','10001','11110','10001','10001','11110'],
  C: ['01110','10001','10000','10000','10000','10001','01110'],
  D: ['11110','10001','10001','10001','10001','10001','11110'],
  E: ['11111','10000','10000','11110','10000','10000','11111'],
  G: ['01110','10001','10000','10111','10001','10001','01111'],
  H: ['10001','10001','10001','11111','10001','10001','10001'],
  I: ['11111','00100','00100','00100','00100','00100','11111'],
  N: ['10001','11001','10101','10011','10001','10001','10001'],
  O: ['01110','10001','10001','10001','10001','10001','01110'],
  P: ['11110','10001','10001','11110','10000','10000','10000'],
  R: ['11110','10001','10001','11110','10100','10010','10001'],
  S: ['01111','10000','10000','01110','00001','00001','11110'],
  T: ['11111','00100','00100','00100','00100','00100','00100'],
  U: ['10001','10001','10001','10001','10001','10001','01110'],
  Y: ['10001','10001','01010','00100','00100','00100','00100'],
  ' ': ['00000','00000','00000','00000','00000','00000','00000'],
};
function drawText(text, x0, y0, scale, r, g, b) {
  let cx = x0;
  for (const ch of text) {
    const rows = FONT[ch] || FONT[' '];
    for (let ry = 0; ry < 7; ry++) for (let rx = 0; rx < 5; rx++) {
      if (rows[ry][rx] === '1') {
        for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
          set(cx + rx * scale + dx, y0 + ry * scale + dy, r, g, b);
        }
      }
    }
    cx += 6 * scale; // 5px glyph + 1px gap
  }
}

// Placeholder wordmark. NOTE: the tiny built-in font only has A-Z minus
// F,J,K,L,M,Q,V,W,X,Z — keep replacement text within that set, or extend FONT.
drawText('YOUR STORY', 90, 250, 11, 0xff, 0xff, 0xff);
// Subline in teal.
drawText('START HERE', 92, 410, 6, 0x2d, 0xd4, 0xbf);

// --- encode PNG ---
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body) >>> 0, 0);
  return Buffer.concat([len, body, crc]);
}
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return ~c;
}
const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; // 8-bit, RGB
// raw scanlines, filter byte 0 per row
const raw = Buffer.alloc((W * 3 + 1) * H);
for (let y = 0; y < H; y++) {
  raw[y * (W * 3 + 1)] = 0;
  px.subarray(y * W * 3, (y + 1) * W * 3)
    .forEach((v, i) => { raw[y * (W * 3 + 1) + 1 + i] = v; });
}
const idat = deflateSync(raw, { level: 9 });
const png = Buffer.concat([
  sig,
  chunk('IHDR', ihdr),
  chunk('IDAT', idat),
  chunk('IEND', Buffer.alloc(0)),
]);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, png);
console.log(`Wrote ${OUT} (${png.length} bytes, ${W}x${H})`);
