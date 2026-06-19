// Scheduled-publish flip script (Node built-ins only; run by the GitHub Action).
//
// Scans src/content/blog/*.md. For any post with `draft: true` AND a `publishAt`
// that is due (<= now), it flips draft→false and removes the publishAt line, then
// rewrites the file in place. The Action commits + pushes only if something changed
// (so a run with nothing due is a clean no-op — no empty commit).
//
// Safety: a scheduled post is committed as draft:true, so it stays hidden on the
// live site until THIS script flips it. The script only ever moves a post from
// hidden→visible when its own publishAt has passed; it never publishes early and
// never deletes a post. A malformed/missing publishAt is left untouched.
//
// Exposed as flipScheduled() for unit testing (operates on in-memory text, no fs),
// with a thin fs-backed runner when executed directly.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BLOG_DIR = 'src/content/blog';

/** Extract a single top-level frontmatter scalar line's value (raw, unquoted-ish). */
function fmValue(frontmatter, key) {
  const m = new RegExp(`^${key}:\\s*(.*)$`, 'm').exec(frontmatter);
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : null;
}

/**
 * Decide whether one post's markdown is a due scheduled post and, if so, return the
 * rewritten markdown (draft:false, publishAt removed). Returns null if no change.
 * Pure: takes the file text + a reference `now` (ms), returns text or null.
 */
export function flipOne(md, nowMs) {
  const m = /^---\n([\s\S]*?)\n---/.exec(md);
  if (!m) return null; // no frontmatter → not a managed post
  const fm = m[1];

  // Only act on hidden drafts that carry a publishAt.
  if (fmValue(fm, 'draft') !== 'true') return null;
  const publishAtRaw = fmValue(fm, 'publishAt');
  if (!publishAtRaw) return null;

  const due = Date.parse(publishAtRaw);
  if (Number.isNaN(due)) return null; // unparseable date → leave it alone (never guess)
  if (due > nowMs) return null;       // not due yet → stays hidden

  // Rewrite ONLY the draft + publishAt lines; everything else is preserved byte-for-byte.
  // Flip draft, then drop the publishAt line by matching the line itself (no sentinel
  // marker char + filter — that would also nuke a legit frontmatter line equal to it).
  const newFm = fm
    .replace(/^draft:\s*true\s*$/m, 'draft: false')
    .split('\n')
    .filter((l) => !/^publishAt:/.test(l))
    .join('\n');

  return md.replace(fm, newFm);
}

/** fs-backed runner: walk the blog dir, flip due posts, return the list of changed slugs. */
export function flipScheduled({ dir = BLOG_DIR, now = Date.now() } = {}) {
  const changed = [];
  let files;
  try { files = readdirSync(dir); } catch { return changed; }
  for (const name of files) {
    if (!name.endsWith('.md')) continue;
    const path = join(dir, name);
    const md = readFileSync(path, 'utf8');
    const out = flipOne(md, now);
    if (out && out !== md) {
      writeFileSync(path, out);
      changed.push(name.replace(/\.md$/, ''));
    }
  }
  return changed;
}

// Run when invoked directly (the Action calls `node scripts/flip-scheduled.mjs`).
const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) {
  const changed = flipScheduled();
  if (changed.length) {
    console.log(`Published ${changed.length} scheduled post(s): ${changed.join(', ')}`);
  } else {
    console.log('No scheduled posts are due. Nothing to publish.');
  }
}
