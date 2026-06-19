// Per-post Open Graph share card — rendered to a real PNG at build time.
// satori (HTML-ish tree → SVG) + resvg (SVG → PNG). Dark, on-brand: near-black bg,
// the teal→cyan→violet accent line, the masthead wordmark, the post title large,
// and the byline. New posts get a card automatically on the next build — no manual step.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { site } from './site';

const require = createRequire(import.meta.url);
const fontFile = (w: number) =>
  fs.readFileSync(require.resolve(`@fontsource/space-grotesk/files/space-grotesk-latin-${w}-normal.woff`));
const FONT_400 = fontFile(400);
const FONT_700 = fontFile(700);

// satori element helper (avoids JSX in a .ts module). children = string | node[].
const el = (type: string, style: Record<string, any>, children: any) => ({ type, props: { style, children } });

export async function renderOgCard({ title, topic, color }: { title: string; topic?: string; color?: string }): Promise<Buffer> {
  const len = (title || '').length;
  const titleSize = len > 84 ? 46 : len > 56 ? 56 : len > 30 ? 66 : 78;
  const accent = color || '#22d3ee';

  const node = el('div', {
    width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
    justifyContent: 'space-between', backgroundColor: '#04060c',
    padding: '74px 84px', fontFamily: 'Space Grotesk',
  }, [
    // masthead
    el('div', { display: 'flex', flexDirection: 'column' }, [
      el('div', { display: 'flex', width: 210, height: 6, borderRadius: 4, marginBottom: 30,
        background: 'linear-gradient(90deg,#2dd4bf,#22d3ee,#818cf8)' }, ''),
      el('div', { display: 'flex', color: '#8aa0b8', fontSize: 26, fontWeight: 700, letterSpacing: 8 }, site.masthead.toUpperCase()),
    ]),
    // title
    el('div', { display: 'flex', color: '#ffffff', fontSize: titleSize, fontWeight: 700,
      lineHeight: 1.12, letterSpacing: -1 }, title || site.masthead),
    // byline + topic
    el('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }, [
      el('div', { display: 'flex', flexDirection: 'column' }, [
        el('div', { display: 'flex', color: '#e2e8f0', fontSize: 30, fontWeight: 700 }, site.name),
      ]),
      ...(topic ? [el('div', { display: 'flex', color: accent, fontSize: 22, fontWeight: 700, letterSpacing: 3 }, topic.toUpperCase())] : []),
    ]),
  ]);

  const svg = await satori(node, {
    width: 1200, height: 630,
    fonts: [
      { name: 'Space Grotesk', data: FONT_400, weight: 400, style: 'normal' },
      { name: 'Space Grotesk', data: FONT_700, weight: 700, style: 'normal' },
    ],
  });
  return new Resvg(svg, { background: '#04060c', fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
