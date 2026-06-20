// Unit tests for the Darkroom pure metadata helpers (Node built-in test runner).
//   node --test src/lib/darkroom.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  tidyCamera,
  cameraFor,
  topicsForTags,
  pickDate,
  applySidecar,
  sortByDateDesc,
} from './darkroom.mjs';

// A small slice of the real topics.json shape: { name, subtitle, tag, color, sub:[{name,tag}] }.
const TOPICS = [
  { name: 'Marrow', subtitle: 'Orthopaedics', tag: 'marrow', color: '#2dd4bf',
    sub: [
      { name: 'Shoulder', tag: 'shoulder' },
      { name: 'Trauma', tag: 'trauma' },
      { name: 'Research', tag: 'research' },
    ] },
  { name: 'The Forge', subtitle: 'Technology', tag: 'forge', color: '#22d3ee',
    sub: [
      { name: 'Building software', tag: 'building-software' },
      { name: 'Interactive', tag: 'interactive' },
    ] },
  { name: 'Atlas', subtitle: 'Travel', tag: 'atlas', color: '#fb923c', sub: [] },
];

// ---- tidyCamera ----------------------------------------------------------

test('tidyCamera tidies make + model, title-casing the make', () => {
  assert.equal(tidyCamera('FUJIFILM', 'X-T5'), 'Fujifilm X-T5');
});

test('tidyCamera does not duplicate the make when the model already contains it', () => {
  // Canon bodies report Make "Canon", Model "Canon EOS R5" → "Canon EOS R5", not "Canon Canon EOS R5".
  assert.equal(tidyCamera('Canon', 'Canon EOS R5'), 'Canon EOS R5');
  // case-insensitive containment
  assert.equal(tidyCamera('NIKON', 'NIKON Z6'), 'Nikon Z6');
});

test('tidyCamera returns the model alone when make is absent', () => {
  assert.equal(tidyCamera(undefined, 'X100V'), 'X100V');
  assert.equal(tidyCamera('', 'X100V'), 'X100V');
});

test('tidyCamera returns the make alone when model is absent', () => {
  assert.equal(tidyCamera('FUJIFILM', undefined), 'Fujifilm');
  assert.equal(tidyCamera('FUJIFILM', ''), 'Fujifilm');
});

test('tidyCamera returns null when both make and model are absent', () => {
  assert.equal(tidyCamera(undefined, undefined), null);
  assert.equal(tidyCamera('', ''), null);
  assert.equal(tidyCamera(null, null), null);
});

// ---- cameraFor -----------------------------------------------------------

test('cameraFor prefers a non-empty sidecar camera over EXIF make/model', () => {
  // The sidecar wins even when EXIF make/model are also present.
  assert.equal(cameraFor('Leica Q3', 'FUJIFILM', 'X-T5'), 'Leica Q3');
});

test('cameraFor falls back to tidyCamera(make, model) when the sidecar camera is empty', () => {
  assert.equal(cameraFor(undefined, 'FUJIFILM', 'X-T5'), 'Fujifilm X-T5');
  assert.equal(cameraFor('', 'Canon', 'Canon EOS R5'), 'Canon EOS R5');
  assert.equal(cameraFor(null, 'NIKON', 'NIKON Z6'), 'Nikon Z6');
});

test('cameraFor treats a whitespace-only sidecar camera as empty', () => {
  assert.equal(cameraFor('   ', 'FUJIFILM', 'X-T5'), 'Fujifilm X-T5');
});

test('cameraFor returns null when both the sidecar camera and EXIF are absent', () => {
  assert.equal(cameraFor(undefined, undefined, undefined), null);
  assert.equal(cameraFor('', '', ''), null);
});

// ---- topicsForTags -------------------------------------------------------

test('topicsForTags maps a top-level tag to its topic name', () => {
  assert.deepEqual(topicsForTags(['atlas'], TOPICS), ['Atlas']);
});

test('topicsForTags maps a sub-tag to its top-level topic name', () => {
  assert.deepEqual(topicsForTags(['shoulder'], TOPICS), ['Marrow']);
  assert.deepEqual(topicsForTags(['interactive'], TOPICS), ['The Forge']);
});

test('topicsForTags drops unknown tags', () => {
  assert.deepEqual(topicsForTags(['nope', 'shoulder', 'unknown'], TOPICS), ['Marrow']);
  assert.deepEqual(topicsForTags(['nope'], TOPICS), []);
});

test('topicsForTags dedupes topics reached via different tags', () => {
  // shoulder + trauma both map to Marrow → one entry.
  assert.deepEqual(topicsForTags(['shoulder', 'trauma'], TOPICS), ['Marrow']);
  // top-level marrow tag + a marrow sub-tag → still one Marrow.
  assert.deepEqual(topicsForTags(['marrow', 'research'], TOPICS), ['Marrow']);
});

test('topicsForTags preserves first-seen order of distinct topics', () => {
  assert.deepEqual(
    topicsForTags(['interactive', 'shoulder', 'atlas'], TOPICS),
    ['The Forge', 'Marrow', 'Atlas'],
  );
  // reversed input → reversed output (order follows the tags, not topics.json)
  assert.deepEqual(
    topicsForTags(['atlas', 'shoulder'], TOPICS),
    ['Atlas', 'Marrow'],
  );
});

test('topicsForTags returns [] for an empty tag list', () => {
  assert.deepEqual(topicsForTags([], TOPICS), []);
});

// ---- pickDate ------------------------------------------------------------

test('pickDate prefers the EXIF date when present', () => {
  const exif = new Date('2024-03-01T08:00:00.000Z');
  const post = new Date('2026-06-01T00:00:00.000Z');
  assert.equal(pickDate(exif, post), exif);
});

test('pickDate falls back to the post date when EXIF is absent', () => {
  const post = new Date('2026-06-01T00:00:00.000Z');
  assert.equal(pickDate(undefined, post), post);
});

test('pickDate prefers a sidecar date over both the EXIF date and the post date', () => {
  // Resized uploads have no EXIF, so the sidecar ISO date must win.
  const sidecar = new Date('2025-09-09T12:00:00.000Z');
  const exif = new Date('2024-03-01T08:00:00.000Z');
  const post = new Date('2026-06-01T00:00:00.000Z');
  assert.equal(pickDate(exif, post, sidecar), sidecar);
});

test('pickDate falls back to EXIF then post date when no sidecar date is given', () => {
  const exif = new Date('2024-03-01T08:00:00.000Z');
  const post = new Date('2026-06-01T00:00:00.000Z');
  // Sidecar absent → EXIF wins over post.
  assert.equal(pickDate(exif, post, undefined), exif);
  // Sidecar and EXIF absent → post date.
  assert.equal(pickDate(undefined, post, undefined), post);
});

// ---- applySidecar --------------------------------------------------------

const basePhoto = () => ({
  thumb: '/_astro/x.webp',
  full: '/_astro/x-full.webp',
  width: 4000,
  height: 3000,
  postSlug: 'a-post',
  postTitle: 'A Post',
  date: new Date('2024-03-01T08:00:00.000Z'),
  year: 2024,
  camera: 'Fujifilm X-T5',
  topics: ['Atlas'],
});

test('applySidecar merges all sidecar fields onto the base record', () => {
  const out = applySidecar(basePhoto(), {
    caption: 'Dawn over the Kamo river',
    tags: ['Kyoto', 'calm'],
    album: 'japan-2026',
  });
  assert.equal(out.caption, 'Dawn over the Kamo river');
  assert.deepEqual(out.tags, ['Kyoto', 'calm']);
  assert.equal(out.album, 'japan-2026');
  // base fields preserved
  assert.equal(out.postSlug, 'a-post');
  assert.equal(out.camera, 'Fujifilm X-T5');
  assert.deepEqual(out.topics, ['Atlas']);
});

test('applySidecar applies defaults when no entry is supplied', () => {
  const out = applySidecar(basePhoto());
  assert.deepEqual(out.tags, []);
  assert.equal(out.album, null);
  assert.equal(out.caption, null);
});

test('applySidecar fills only the missing optional fields from a partial entry', () => {
  const out = applySidecar(basePhoto(), { tags: ['macro'] });
  assert.deepEqual(out.tags, ['macro']);
  assert.equal(out.album, null);
  assert.equal(out.caption, null);
});

test('applySidecar passes a sidecar gps coordinate through to the photo', () => {
  const out = applySidecar(basePhoto(), { gps: [35.0116, 135.7681] });
  assert.deepEqual(out.gps, [35.0116, 135.7681]);
});

test('applySidecar defaults gps to null when the entry omits it', () => {
  assert.equal(applySidecar(basePhoto(), { tags: ['macro'] }).gps, null);
  assert.equal(applySidecar(basePhoto()).gps, null);
});

test('applySidecar preserves the base date and camera (resolved by the build)', () => {
  // date/camera are resolved upstream (sidecar-wins) and carried on the base;
  // applySidecar must not clobber them.
  const base = basePhoto();
  const out = applySidecar(base, { gps: [1, 2] });
  assert.equal(out.date, base.date);
  assert.equal(out.camera, base.camera);
});

// ---- sortByDateDesc ------------------------------------------------------

test('sortByDateDesc orders newest first', () => {
  const mk = (slug, iso) => ({ postSlug: slug, date: new Date(iso) });
  const out = sortByDateDesc([
    mk('old', '2020-01-01T00:00:00.000Z'),
    mk('new', '2026-06-01T00:00:00.000Z'),
    mk('mid', '2023-03-03T00:00:00.000Z'),
  ]);
  assert.deepEqual(out.map((p) => p.postSlug), ['new', 'mid', 'old']);
});

test('sortByDateDesc is stable for equal dates (input order preserved)', () => {
  const d = '2024-03-01T08:00:00.000Z';
  const mk = (slug) => ({ postSlug: slug, date: new Date(d) });
  const out = sortByDateDesc([mk('a'), mk('b'), mk('c')]);
  assert.deepEqual(out.map((p) => p.postSlug), ['a', 'b', 'c']);
});
