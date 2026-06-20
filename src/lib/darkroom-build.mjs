// Darkroom — build-time photo assembler.
//
// This module IS Astro/Vite-coupled (it uses import.meta.glob, astro:assets'
// getImage, astro:content's getCollection and the local `exifr` reader). It
// consumes the PURE helpers in ./darkroom.mjs to keep the testable core free of
// these imports. Lives in src/lib/ so the glob roots resolve the same as they
// would from src/pages/ (both are one level under src/).
//
// Flow (all at build time, no network):
//   1. Glob every image under content/blog/_images/<slug>/… → ImageMetadata.
//   2. Read EXIF (date + make/model) from each image's absolute fs path via exifr.
//   3. Glob every meta.json sidecar → per-slug
//      { filename → {caption,tags,album,date?,camera?,gps?} }.
//   4. Join to published posts by slug (postTitle, topics, fallback date);
//      DROP any image whose slug has no published post.
//   5. Resolve date (sidecar ISO > EXIF > post) and camera (sidecar > tidied
//      EXIF) per image, build one DarkroomPhoto, carry gps; sort newest-first.
//
// Sidecar precedence (load-bearing): the Studio uploader resizes photos, which
// STRIPS EXIF, then writes date/camera/gps into meta.json. So for an uploaded
// image the sidecar is the only source; image-EXIF remains the fallback for a
// hand-added original.

import { resolve } from 'node:path';
import exifr from 'exifr';
import { getImage } from 'astro:assets';
import { getCollection } from 'astro:content';

import topics from '../data/topics.json';
import {
  cameraFor,
  topicsForTags,
  pickDate,
  applySidecar,
  sortByDateDesc,
} from './darkroom.mjs';

/** @typedef {import('./darkroom.mjs').DarkroomPhoto} DarkroomPhoto */

// Eagerly globbed at build time. Patterns MUST be static string literals and are
// resolved relative to THIS file (src/lib/), so '../content/...' points at
// src/content/... — the same target the page used from src/pages/.
const IMAGE_GLOB = import.meta.glob(
  '../content/blog/_images/**/*.{jpg,jpeg,png,webp}',
  { eager: true },
);
const META_GLOB = import.meta.glob('../content/blog/_images/**/meta.json', {
  eager: true,
});

/**
 * Pull `<slug>` and `<filename>` out of a glob key of the shape
 * `../content/blog/_images/<slug>/<...>/<filename.ext>`.
 * @param {string} path
 * @returns {{ slug: string, filename: string } | null}
 */
function slugAndFile(path) {
  const parts = path.split('/');
  const idx = parts.indexOf('_images');
  if (idx === -1) return null;
  const slug = parts[idx + 1];
  const filename = parts[parts.length - 1];
  if (!slug || !filename) return null;
  return { slug, filename };
}

/**
 * Build the per-slug sidecar lookup from the meta.json glob:
 *   { '<slug>': { '<filename>': { caption?, tags?, album?, date?, camera?, gps? }, … }, … }
 * @returns {Record<string, Record<string, import('./darkroom.mjs').SidecarEntry>>}
 */
function buildSidecars() {
  /** @type {Record<string, Record<string, import('./darkroom.mjs').SidecarEntry>>} */
  const bySlug = {};
  for (const [path, mod] of Object.entries(META_GLOB)) {
    const info = slugAndFile(path);
    if (!info) continue;
    // JSON modules expose the parsed object as the default export.
    const data = /** @type {any} */ (mod).default ?? mod;
    if (data && typeof data === 'object') bySlug[info.slug] = data;
  }
  return bySlug;
}

/**
 * Resolve a glob key to the source image's absolute filesystem path.
 *
 * NOTE: we deliberately do NOT use `new URL(path, import.meta.url)` — at build
 * time Vite bundles this module to `dist/pages/darkroom.astro.mjs`, so
 * `import.meta.url` points into `dist/` and the resolved path lands at the
 * non-existent `dist/content/...`. The glob keys are `../content/...` relative
 * to `src/lib/`, i.e. `src/content/...` from the project root (`process.cwd()`),
 * which is stable across dev and build.
 * @param {string} key  glob key, e.g. '../content/blog/_images/x/01.jpg'
 * @returns {string}
 */
function sourcePath(key) {
  // '../content/...' (from src/lib/) → 'src/content/...' (from project root).
  return resolve(process.cwd(), key.replace(/^\.\.\//, 'src/'));
}

/**
 * Read the raw EXIF date + make/model from an image's absolute filesystem path.
 * Returns the raw make/model (not a tidied camera) so the caller can apply the
 * sidecar-camera precedence via `cameraFor`. Degrades silently (returns `{}`) on
 * any failure or when no EXIF is present — resized uploads (EXIF stripped),
 * hand-added photos without EXIF, and the template's gradient placeholders all
 * take this path.
 * @param {string} path  the glob key (e.g. '../content/blog/_images/x/01.jpg')
 * @returns {Promise<{ date?: Date, make?: string, model?: string }>}
 */
async function readExif(path) {
  try {
    const absPath = sourcePath(path);
    const exif = await exifr.parse(absPath, {
      pick: ['DateTimeOriginal', 'Make', 'Model'],
    });
    if (!exif) return {};
    const date =
      exif.DateTimeOriginal instanceof Date ? exif.DateTimeOriginal : undefined;
    return { date, make: exif.Make, model: exif.Model };
  } catch {
    return {};
  }
}

/**
 * Parse a sidecar `date` (an ISO 8601 string) into a Date, or undefined when
 * absent/blank/unparseable — so a malformed sidecar date falls back to EXIF/post
 * rather than poisoning the record with an Invalid Date.
 * @param {unknown} value
 * @returns {Date | undefined}
 */
function parseSidecarDate(value) {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * Assemble every Darkroom photo at build time.
 * @returns {Promise<DarkroomPhoto[]>}
 */
export async function getDarkroomPhotos() {
  // Published posts → slug-keyed lookup of title + fallback date + topics.
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const byPostSlug = new Map(
    posts.map((p) => [
      p.slug,
      {
        title: p.data.title,
        date: p.data.date,
        topics: topicsForTags(p.data.tags ?? [], topics),
      },
    ]),
  );

  const sidecars = buildSidecars();

  let exifDateCount = 0;
  let fallbackDateCount = 0;

  /** @type {DarkroomPhoto[]} */
  const photos = [];

  for (const [path, mod] of Object.entries(IMAGE_GLOB)) {
    const info = slugAndFile(path);
    if (!info) continue;
    const post = byPostSlug.get(info.slug);
    // Drop images whose slug has no published post (unchanged behaviour).
    if (!post) continue;

    // Astro processes src/ images → default export is ImageMetadata.
    const meta = /** @type {import('astro').ImageMetadata} */ (
      /** @type {any} */ (mod).default
    );

    const entry = sidecars[info.slug]?.[info.filename];

    const { date: exifDate, make, model } = await readExif(path);
    const sidecarDate = parseSidecarDate(entry?.date);
    // Sidecar ISO date wins (resized uploads have no EXIF), then EXIF, then post.
    const date = pickDate(exifDate, post.date, sidecarDate);
    if (sidecarDate || exifDate) exifDateCount += 1;
    else fallbackDateCount += 1;

    // Sidecar camera wins; otherwise tidy the image's own EXIF make/model.
    const camera = cameraFor(entry?.camera, make, model);

    // ~500px derivative for the grid; full-size URL + intrinsic dims for the lightbox.
    const thumb = await getImage({ src: meta, width: 500 });

    const base = {
      thumb: thumb.src,
      full: meta.src,
      width: meta.width,
      height: meta.height,
      postSlug: info.slug,
      postTitle: post.title,
      date,
      year: date.getFullYear(),
      camera,
      topics: post.topics,
    };

    photos.push(applySidecar(base, entry));
  }

  // Build-time visibility: how many photos got a real date (sidecar or EXIF) vs.
  // the post-date fallback.
  console.log(
    `[darkroom] ${photos.length} photo(s): ${exifDateCount} with a sidecar/EXIF date, ${fallbackDateCount} via post-date fallback.`,
  );

  return sortByDateDesc(photos);
}
