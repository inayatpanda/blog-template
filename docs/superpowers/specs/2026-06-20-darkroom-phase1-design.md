# Darkroom — Phase 1 Design

**Date:** 2026-06-20 · **Repo:** `inayatpanda-site` (deploys to inayatpanda.com), then ported to `blog-template` · **Branch:** `feat/darkroom-phase1` (from `main`)

**Owner-approved scope:** make the Darkroom photo gallery scale to *hundreds* of images — auto-tagged, faceted-filterable, masonry grid, PhotoSwipe lightbox — **plus** optional user-defined metadata (custom tags like location / mood) and photo **albums**, both opt-in. GPS auto-geocoding and the Studio writing-UI are explicitly **phase 2**.

## Goal

A visitor opening `/darkroom/` with hundreds of photos sees a fast, justified grid they can narrow by **year, topic, camera** (and, where the owner has added them, **custom tags** and **albums**), and click any photo into a full-screen **PhotoSwipe** lightbox with its caption and a link back to its post. Everything is derived at build time — no backend, no per-build network call.

## Constraints (non-negotiable)

- **Dark house style** (bg `#04060c`, teal→cyan→violet accents); British spelling.
- **Base-path aware** — every link via `withBase()`; images via Astro asset handling (auto-prefixed). Must work at a GitHub Pages **sub-path** (`user.github.io/<repo>/`).
- **No backend, CI-safe build** — metadata from local EXIF + post data + an optional local sidecar. **No network during build** (this is *why* GPS geocoding is deferred).
- **Graceful degradation** — images with no EXIF (the template's gradient placeholders, or photos with stripped EXIF) still appear: `date` falls back to the post date, the `camera` facet just omits them. No sidecar → auto facets only.
- **Reduced-motion** respected (PhotoSwipe config + any reveal).
- Ships to **the owner's site AND the template** (re-seed `blog-template` after); verified at base `/` and `BASE_PATH=/demo/`.
- `npm run build` + `npm run check:site` green; the existing `scripts/check-gallery.mjs` reconciled to the new structure.

## Data model

Each photo becomes one record, built at build time:

```
DarkroomPhoto {
  thumb:     string        // ~500px derivative URL (Astro getImage), base-aware — used in the grid
  full:      string        // full-size processed URL (lightbox), base-aware
  width:     number        // full-size intrinsic dims (PhotoSwipe requires them)
  height:    number
  postSlug:  string
  postTitle: string
  date:      Date          // EXIF DateTimeOriginal ?? post.data.date
  year:      number        // from date
  camera:    string | null // EXIF "Make Model" tidied (e.g. "Fujifilm X-T5"); null if no EXIF
  topics:    string[]      // the post's tags mapped to top-level topic names via topics.json
  tags:      string[]      // OPTIONAL user tags from the sidecar (location, mood, subject, …)
  album:     string | null // OPTIONAL album id from the sidecar
  caption:   string | null // OPTIONAL from the sidecar
}
```

### Sources

- **Auto (always, zero config):** `date` + `camera` from EXIF (`exifr`); `topics` from the post (`post.data.tags` → top-level topic via `topics.json`); `postTitle`; fallback `date`.
- **Optional per-post sidecar (opt-in):** `src/content/blog/_images/<slug>/meta.json` — a map of *filename → optional fields*:
  ```json
  {
    "01.jpg": { "caption": "Dawn over the Kamo river", "tags": ["Kyoto", "calm", "water"], "album": "japan-2026" },
    "02.jpg": { "tags": ["macro"] }
  }
  ```
  Every field optional; a photo with no entry (or no `meta.json` at all) simply has empty `tags` / null `album` / null `caption`. **This is the "optional metadata" the user opts into** to categorise further — hand-editable now, and written by the **Studio uploader in phase 2**.
- **Optional album titles:** `src/data/darkroom-albums.json` — `[{ "id": "japan-2026", "title": "Japan, 2026", "description": "…" }]`. If an album id appears on a photo but isn't defined here, derive a display title from the id (title-cased). File optional.

## Architecture / build flow

1. **`src/lib/darkroom.ts`** (new — the testable core) — `async getDarkroomPhotos(): Promise<DarkroomPhoto[]>`:
   - `import.meta.glob('../content/blog/_images/**/*.{jpg,jpeg,png,webp}', { eager: true })` → entries `[path, { default: ImageMetadata }]`. Use **`mod.default`** (ImageMetadata) for `getImage()` (thumb) + intrinsic `width`/`height` + `full` (`mod.default.src`); use the **path key**, resolved to an absolute fs path, for `await exifr.parse(absPath, { pick: ['DateTimeOriginal','Make','Model'] })` (date + camera).
   - `import.meta.glob('../content/blog/_images/**/meta.json', { eager: true })` → per-slug sidecar maps (caption / tags / album).
   - `getCollection('blog', ({ data }) => !data.draft)` → join by slug for `postTitle`, `topics` (map each post tag to its top-level topic via `topics.json`; dedupe), fallback `date`. **Drop** any image whose slug has no published post (current behaviour).
   - `getImage({ src: mod.default, width: 500 })` → `thumb.src`.
   - Return **sorted by `date` desc**.
   - Pure enough to unit-test against a small fixture folder.
2. **`src/pages/darkroom.astro`** (rewrite, thin) — `const photos = await getDarkroomPhotos();` then compute facet value-sets (`years`, `topics`, `cameras`, `tags`, `albums` actually present). Render: the existing hero; the **filter bar**; the **masonry grid** of `<a>` thumbnails each carrying `data-year / data-topics / data-camera / data-tags / data-album / data-post` (space-joined) for filtering **and** PhotoSwipe attrs (`href={photo.full}`, `data-pswp-width`, `data-pswp-height`, caption). Preserve the empty-state ("Nothing developed yet.").
3. **`src/scripts/darkroom.js`** (new) —
   - **Filter:** facet chip groups (reuse `.chip`). Within a facet = OR; across facets = AND. Toggling shows/hides grid items by their `data-*`. Live count ("84 photos") + a "Clear" reset. Default = all, newest first.
   - **PhotoSwipe:** dynamic-import `photoswipe` + `photoswipe/lightbox`; `new PhotoSwipeLightbox({ gallery: '#darkroom-grid', children: 'a', pswpModule }).init()`. Caption = photo caption ?? post title, plus a "from this post →" link to `withBase('/blog/<slug>/')` rendered into the PhotoSwipe UI (`uiRegister` caption element). Hidden (filtered-out) items are excluded from the active set.
   - Re-init after Astro view transitions (the site re-runs page scripts on navigation).
4. **CSS** in `src/styles/global.css` — `.darkroom-grid` = **CSS `columns` masonry** (responsive column count via `clamp`/breakpoints, `break-inside: avoid` + `margin-bottom` on each item — no JS, no layout-thrash with lazy images), `.darkroom-filter` (the chip bar), and PhotoSwipe **dark-theme** overrides (caption bar, controls tinted to the accent, backdrop near-black). Import PhotoSwipe's base CSS.

## Filter facets

A horizontal **filter bar**: **Year · Topic · Camera** always shown (when a facet has >1 value); **Tags · Album** appear **only if** any photo carries them. **Post** is also a facet (so the old "one post's photos" view is reachable). Multi-select chips; AND across facets / OR within a facet; live total + "Clear". Default = everything, newest-first.

## Albums

Phase 1 treats an album as a **filter facet** (select an album → its photos), keyed on the per-photo `album` id with optional `darkroom-albums.json` titles. A dedicated **album-index page** (album covers → drill-in) and **drag-arrange / reorder** are **phase 2**.

## Lightbox (PhotoSwipe)

PhotoSwipe v5, **dynamically imported** (off the critical path). Grid `<a href={full} data-pswp-width data-pswp-height>` + caption data; dark theme; pinch-zoom/swipe/Esc handled by the lib; **reduced-motion** honoured. Caption shows the photo's caption (or post title) + the "from this post →" link.

## Performance

- Grid uses ~**500px thumbnails** (small payload) with `loading="lazy"`; full-size loads only when the lightbox opens.
- Hundreds of `<a><img loading=lazy>` nodes is fine (images lazy-load on scroll). **Thousands** → DOM pagination / virtualisation is a **phase-2** note (logged here, not silently capped).

## Edge cases

- **No EXIF** → `date` = post date, `camera` = null (template placeholders, stripped photos).
- **No sidecar** → auto facets only; `tags`/`album`/`caption` empty.
- **Image with no published post** → excluded (unchanged).
- **Sub-path build** → `thumb`/`full` via Astro (base-aware); PhotoSwipe receives base-prefixed URLs; post links via `withBase`.
- **GPS present in EXIF** → ignored in phase 1 (no geocoding); coords remain available to read in phase 2.

## Files

- **New:** `src/lib/darkroom.ts`; `src/scripts/darkroom.js`; (optional, may ship empty/example) `src/data/darkroom-albums.json`; a fixture + `src/lib/darkroom.test.ts`.
- **Change:** `src/pages/darkroom.astro` (rewrite); `src/styles/global.css` (grid + filter + PhotoSwipe theme); `package.json` (+`exifr`, +`photoswipe`); `scripts/check-gallery.mjs` (reconcile to the new render).
- **Docs:** document the `meta.json` + `darkroom-albums.json` formats in `CONTENT-GUIDE.md`.
- **Port:** re-seed `blog-template` from the `template` branch after merge.

## Verification

- `npm run build` + `npm run check:site` green; `src/lib/darkroom.ts` unit test passes (fixture: 2 posts; one image with EXIF + sidecar tags + album, one image with no EXIF and no sidecar; asserts date fallback, camera tidy, topic mapping, sidecar merge, sort order).
- **Browser QA:** grid renders thumbnails; each facet narrows correctly with live counts; Tags/Album facets appear only when present; PhotoSwipe opens with caption + "from this post →"; reduced-motion; mobile; **base `/` and `BASE_PATH=/demo/`** both correct (images + links base-aware); the template's placeholder images still appear (no EXIF / no sidecar).

## Out of scope (phase 2)

- **GPS → place auto-geocoding** + a Place facet.
- The **Studio "Darkroom uploader"** (drag-drop batch → auto-resize + EXIF read + bulk-tag → writes `meta.json` / albums).
- **Album-index page** (covers → drill-in) + **drag-arrange / reorder**.
- DOM **virtualisation** for thousands of images.
