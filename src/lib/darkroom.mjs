// Darkroom — pure metadata helpers.
//
// This module is deliberately PURE: it imports nothing from Astro, the
// filesystem, or globs, so the repo's `node --test` runner can import it
// directly (which is why it is `.mjs`, not `.ts`). The Astro-coupled
// assembler (`getDarkroomPhotos`) lives in `darkroom.ts` and consumes these.
//
// Shapes are documented with JSDoc typedefs that mirror the spec's Data model
// (docs/superpowers/specs/2026-06-20-darkroom-phase1-design.md).

/**
 * A single photo record, built at build time.
 * @typedef {Object} DarkroomPhoto
 * @property {string} thumb     ~500px derivative URL (Astro getImage), base-aware — used in the grid.
 * @property {string} full      Full-size processed URL (lightbox), base-aware.
 * @property {number} width     Full-size intrinsic width (PhotoSwipe requires it).
 * @property {number} height    Full-size intrinsic height.
 * @property {string} postSlug
 * @property {string} postTitle
 * @property {Date}   date       EXIF DateTimeOriginal ?? post.data.date.
 * @property {number} year       Derived from `date`.
 * @property {string|null} camera EXIF "Make Model" tidied (e.g. "Fujifilm X-T5"); null if no EXIF.
 * @property {string[]} topics   The post's tags mapped to top-level topic names via topics.json.
 * @property {string[]} tags     OPTIONAL user tags from the sidecar (location, mood, subject, …).
 * @property {string|null} album OPTIONAL album id from the sidecar.
 * @property {string|null} caption OPTIONAL caption from the sidecar.
 */

/**
 * A top-level topic definition from topics.json.
 * @typedef {Object} TopicSub
 * @property {string} name
 * @property {string} tag
 *
 * @typedef {Object} TopicDef
 * @property {string} name
 * @property {string} tag
 * @property {TopicSub[]} [sub]
 */

/**
 * The base photo record before the sidecar's optional fields are merged in.
 * @typedef {Omit<DarkroomPhoto, 'tags'|'album'|'caption'>} DarkroomPhotoBase
 */

/**
 * Optional per-photo metadata from a `meta.json` sidecar entry.
 * @typedef {Object} SidecarEntry
 * @property {string} [caption]
 * @property {string[]} [tags]
 * @property {string} [album]
 */

/** Title-case a single make token: "FUJIFILM" → "Fujifilm", "nikon" → "Nikon". */
function titleCase(s) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/**
 * Tidy an EXIF camera make + model into a single display string.
 * - Title-cases the make ("FUJIFILM" → "Fujifilm").
 * - If the model already contains the make (case-insensitive), the model is
 *   returned as-is to avoid duplication ("Canon" + "Canon EOS R5" → "Canon EOS R5").
 * - Returns the lone non-empty side when only one is present.
 * - Returns null when both are empty/absent.
 *
 * @param {string|null|undefined} make
 * @param {string|null|undefined} model
 * @returns {string|null}
 */
export function tidyCamera(make, model) {
  const m = (make ?? '').trim();
  const mod = (model ?? '').trim();

  if (!m && !mod) return null;
  if (!mod) return titleCase(m);
  if (!m) return mod;

  const lowerMake = m.toLowerCase();
  const lowerModel = mod.toLowerCase();

  // Model already leads with the make (e.g. "Canon EOS R5", "NIKON Z6"): keep
  // the model's tail verbatim but tidy the leading make so casing is consistent.
  if (lowerModel.startsWith(lowerMake)) {
    const rest = mod.slice(m.length).trimStart();
    return rest ? `${titleCase(m)} ${rest}` : titleCase(m);
  }
  // Make appears elsewhere in the model → don't repeat it; leave the model as-is.
  if (lowerModel.includes(lowerMake)) return mod;

  return `${titleCase(m)} ${mod}`;
}

/**
 * Map a list of post tags to their top-level topic names.
 * A tag matches a topic if it equals the topic's own `tag` OR any `sub[].tag`.
 * Unknown tags are dropped; results are de-duplicated; first-seen order is preserved.
 *
 * @param {string[]} tags
 * @param {TopicDef[]} topics
 * @returns {string[]}
 */
export function topicsForTags(tags, topics) {
  // tag → top-level topic name lookup.
  const byTag = new Map();
  for (const topic of topics) {
    byTag.set(topic.tag, topic.name);
    for (const sub of topic.sub ?? []) byTag.set(sub.tag, topic.name);
  }

  const out = [];
  const seen = new Set();
  for (const tag of tags ?? []) {
    const name = byTag.get(tag);
    if (name === undefined || seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}

/**
 * Choose the photo's date: the EXIF DateTimeOriginal if present, else the post date.
 * @param {Date|undefined} exifDate
 * @param {Date} postDate
 * @returns {Date}
 */
export function pickDate(exifDate, postDate) {
  return exifDate ?? postDate;
}

/**
 * Merge an optional sidecar entry onto a base photo record, applying defaults
 * for any field the entry omits (`tags:[]`, `album:null`, `caption:null`).
 *
 * @param {DarkroomPhotoBase} base
 * @param {SidecarEntry} [entry]
 * @returns {DarkroomPhoto}
 */
export function applySidecar(base, entry) {
  const e = entry ?? {};
  return {
    ...base,
    caption: e.caption ?? null,
    tags: e.tags ?? [],
    album: e.album ?? null,
  };
}

/**
 * Sort photos by `date` descending (newest first). Stable for equal dates.
 * Returns a new array; the input is not mutated.
 *
 * @template {{ date: Date }} T
 * @param {T[]} photos
 * @returns {T[]}
 */
export function sortByDateDesc(photos) {
  // Decorate-sort-undecorate keeps the sort stable for equal dates regardless
  // of the engine's Array.sort stability guarantees.
  return photos
    .map((photo, i) => ({ photo, i }))
    .sort((a, b) => b.photo.date - a.photo.date || a.i - b.i)
    .map(({ photo }) => photo);
}
