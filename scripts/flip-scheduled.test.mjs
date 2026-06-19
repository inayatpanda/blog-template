// Unit tests for the scheduled-publish flip logic (Node built-in test runner).
//   node --test scripts/flip-scheduled.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { flipOne, flipScheduled } from './flip-scheduled.mjs';
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const NOW = Date.parse('2026-06-18T12:00:00.000Z');

const post = ({ draft, publishAt, extra = '' }) => [
  '---',
  'title: "A scheduled post"',
  'description: "desc"',
  'date: 2026-06-01',
  'tags: ["shoulder"]',
  'accent: "#2dd4bf"',
  ...(draft ? ['draft: true'] : []),
  ...(publishAt ? [`publishAt: ${publishAt}`] : []),
  extra,
  '---',
  '',
  'Body text.',
].filter((l) => l !== '').join('\n');

test('flips a due draft → draft:false and removes publishAt', () => {
  const md = post({ draft: true, publishAt: '2026-06-18T09:00:00.000Z' }); // past
  const out = flipOne(md, NOW);
  assert.ok(out, 'a due post is rewritten');
  assert.match(out, /^draft: false$/m, 'draft flipped to false');
  assert.ok(!/publishAt/.test(out), 'publishAt line removed');
  assert.match(out, /title: "A scheduled post"/, 'other frontmatter preserved');
  assert.match(out, /tags: \["shoulder"\]/, 'tags preserved');
  assert.match(out, /Body text\./, 'body preserved');
});

test('leaves a future-dated draft untouched (never publishes early)', () => {
  const md = post({ draft: true, publishAt: '2026-12-25T09:00:00.000Z' }); // future
  assert.equal(flipOne(md, NOW), null, 'a not-yet-due post is not changed');
});

test('a date-only publishAt is honoured (midnight UTC)', () => {
  assert.ok(flipOne(post({ draft: true, publishAt: '2026-06-17' }), NOW), 'yesterday (date-only) is due');
  assert.equal(flipOne(post({ draft: true, publishAt: '2026-06-19' }), NOW), null, 'tomorrow (date-only) is not due');
});

test('ignores a draft with no publishAt (plain draft stays hidden)', () => {
  assert.equal(flipOne(post({ draft: true }), NOW), null);
});

test('ignores a live post that somehow carries publishAt (only flips drafts)', () => {
  assert.equal(flipOne(post({ draft: false, publishAt: '2026-06-01T00:00:00Z' }), NOW), null);
});

test('ignores a post with no frontmatter', () => {
  assert.equal(flipOne('Just a body, no frontmatter.', NOW), null);
});

test('leaves an unparseable publishAt alone (never guesses)', () => {
  assert.equal(flipOne(post({ draft: true, publishAt: 'whenever' }), NOW), null);
});

// Removing publishAt must not collateral-damage another frontmatter line that
// happens to equal the sentinel the old code used to mark publishAt for removal.
// (The old impl replaced publishAt with a marker char then filtered every line
// equal to that marker — so a legit line equal to the marker was dropped too.)
const SENTINELS = { 'single space': ' ', 'NUL char': String.fromCharCode(0) };
for (const [label, ch] of Object.entries(SENTINELS)) {
  test(`removing publishAt preserves a pre-existing frontmatter line that is exactly a ${label}`, () => {
    // Build frontmatter where one line (between accent and draft) is exactly `ch`.
    const md = [
      '---',
      'title: "A scheduled post"',
      'description: "desc"',
      'date: 2026-06-01',
      'tags: ["shoulder"]',
      'accent: "#2dd4bf"',
      ch,                                  // a legit line equal to the old sentinel
      'draft: true',
      'publishAt: 2026-06-18T09:00:00.000Z', // due
      '---',
      '',
      'Body text.',
    ].join('\n');
    const out = flipOne(md, NOW);
    assert.ok(out, 'a due post is rewritten');
    assert.match(out, /^draft: false$/m, 'draft flipped to false');
    assert.ok(!/publishAt/.test(out), 'publishAt line removed');
    const fm = /^---\n([\s\S]*?)\n---/.exec(out)[1];
    assert.ok(fm.split('\n').includes(ch), `the ${label} frontmatter line must be preserved: ` + JSON.stringify(fm.split('\n')));
    // Adjacent normal lines stay intact, byte-for-byte.
    assert.match(out, /tags: \["shoulder"\]/, 'tags preserved');
    assert.match(out, /accent: "#2dd4bf"/, 'accent preserved');
  });
}

test('removing publishAt leaves all other frontmatter lines byte-for-byte', () => {
  const md = post({ draft: true, publishAt: '2026-06-18T09:00:00.000Z' });
  const out = flipOne(md, NOW);
  const before = /^---\n([\s\S]*?)\n---/.exec(md)[1].split('\n')
    .filter((l) => !/^publishAt:/.test(l))
    .map((l) => (l === 'draft: true' ? 'draft: false' : l));
  const after = /^---\n([\s\S]*?)\n---/.exec(out)[1].split('\n');
  assert.deepEqual(after, before, 'only draft flips + publishAt removed; nothing else changes');
});

test('flipScheduled flips only the due post across a directory', () => {
  const dir = mkdtempSync(join(tmpdir(), 'flip-'));
  try {
    writeFileSync(join(dir, 'due.md'), post({ draft: true, publishAt: '2026-06-10T00:00:00Z' }));
    writeFileSync(join(dir, 'future.md'), post({ draft: true, publishAt: '2026-12-01T00:00:00Z' }));
    writeFileSync(join(dir, 'plain-draft.md'), post({ draft: true }));
    writeFileSync(join(dir, 'live.md'), post({ draft: false }));
    const changed = flipScheduled({ dir, now: NOW });
    assert.deepEqual(changed, ['due'], 'only the due post is flipped');
    assert.match(readFileSync(join(dir, 'due.md'), 'utf8'), /^draft: false$/m);
    assert.match(readFileSync(join(dir, 'future.md'), 'utf8'), /^draft: true$/m, 'future post untouched');
    assert.match(readFileSync(join(dir, 'plain-draft.md'), 'utf8'), /^draft: true$/m, 'plain draft untouched');
    // a no-op run leaves everything (the now-live due post no longer matches) → no further change
    assert.deepEqual(flipScheduled({ dir, now: NOW }), [], 'second run is a clean no-op');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
