// check-darkroom — asserts the /darkroom/ page renders correctly against the
// CURRENT Darkroom build (a flat #darkroom-grid of <a.dr-shot> thumbnails plus a
// .darkroom-filter facet bar), and degrades gracefully to the empty state.
//
// It covers BOTH branches of the page deterministically, every run:
//
//   1. Populated path — seed ONE throwaway, EXIF-free fixture image into a real
//      published post's _images/<slug>/ folder, build, and assert the grid +
//      filter render (this also exercises the "no-EXIF graceful path": the photo
//      still appears, its date falling back to the post date). Then remove the
//      fixture and rebuild so the repo's real (empty) state is what dist/ holds.
//   2. Empty-state path — with no images, assert the page builds and shows the
//      "Nothing developed yet." copy and NO grid.
//
// Non-brittle by design: it asserts the structural contract (grid id, the
// .dr-shot / .darkroom-filter classes, the empty-state copy), not exact counts,
// per-post markup, captions, or styling. The owner ships with no _images, so the
// empty-state branch is their live reality; the template ships with photos, so
// the populated branch is theirs — both are verified here.

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const PAGE = 'dist/darkroom/index.html';
const BLOG_DIR = 'src/content/blog';
const IMAGES_DIR = join(BLOG_DIR, '_images');

const fail = (m) => { console.error('FAIL:', m); cleanup(); process.exit(1); };
const has = (html, needle) => html.includes(needle);

// Track what we create so cleanup can always undo it, even on failure.
let fixtureDir = null;

function cleanup() {
  try { if (fixtureDir && existsSync(fixtureDir)) rmSync(fixtureDir, { recursive: true, force: true }); }
  catch {}
}

function build() {
  try { execSync('npm run build', { stdio: 'inherit' }); }
  catch { fail('astro build errored'); }
}

function readPage() {
  try { return readFileSync(PAGE, 'utf8'); }
  catch (e) { fail(`could not read ${PAGE}: ${e.message}`); }
}

// Pick a real, published (non-draft) post slug to host the fixture image, so the
// photo survives the "drop images whose slug has no published post" filter.
// The regex matches ONLY a frontmatter `draft: true` (word-boundary), so values
// like `draft: 1` or `draft: yes` are correctly treated as published, not draft.
function firstPublishedSlug() {
  const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'));
  for (const f of files) {
    const src = readFileSync(join(BLOG_DIR, f), 'utf8');
    const isDraft = /^draft:\s*true\b/im.test(src);
    if (!isDraft) return f.replace(/\.md$/, '');
  }
  return null;
}

const checks = [];
const expect = (cond, msg) => checks.push([!!cond, msg]);

(async () => {
  const slug = firstPublishedSlug();
  if (!slug) fail('no published blog post found to host the fixture image');

  // --- Populated path -------------------------------------------------------
  // A real, EXIF-free PNG (sharp-generated) → Astro can process it, and the lack
  // of EXIF exercises the date-fallback / camera-omitted graceful path.
  fixtureDir = join(IMAGES_DIR, slug);
  const fixtureExisted = existsSync(fixtureDir);
  if (fixtureExisted) fail(`refusing to clobber existing ${fixtureDir}; remove it and re-run`);
  mkdirSync(fixtureDir, { recursive: true });
  const png = await sharp({
    create: { width: 64, height: 48, channels: 3, background: { r: 45, g: 212, b: 191 } },
  }).png().toBuffer();
  writeFileSync(join(fixtureDir, '_check-darkroom-fixture.png'), png);

  build();
  const populated = readPage();
  expect(has(populated, 'Darkroom'), 'darkroom page renders (populated build)');
  expect(has(populated, 'id="darkroom-grid"'), 'grid container renders when photos exist');
  expect(has(populated, 'dr-shot'), 'at least one .dr-shot thumbnail renders');
  expect(has(populated, 'darkroom-filter'), 'the .darkroom-filter facet bar renders');
  expect(!has(populated, 'Nothing developed yet.'), 'no empty-state copy when photos exist');

  // Remove the fixture and rebuild so dist/ reflects the repo's real state.
  cleanup();
  fixtureDir = null;

  // --- Empty-state path -----------------------------------------------------
  build();
  const empty = readPage();
  expect(has(empty, 'Darkroom'), 'darkroom page renders (empty build)');
  expect(has(empty, 'Nothing developed yet.'), 'graceful empty-state copy when no photos');
  expect(!has(empty, 'id="darkroom-grid"'), 'no grid container in the empty state');

  const bad = checks.filter(([ok]) => !ok).map(([, m]) => m);
  if (bad.length) { console.error('FAILED checks:\n - ' + bad.join('\n - ')); process.exit(1); }
  console.log(`✅ check-darkroom passed (${checks.length} assertions: populated grid + graceful empty state)`);
})().catch((e) => fail(e.stack || String(e)));
