# Darkroom Phase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Scale the Darkroom to hundreds of photos — EXIF/topic auto-tagging, opt-in custom tags + albums, a faceted filter bar, a masonry thumbnail grid, and a PhotoSwipe lightbox. Full design: `docs/superpowers/specs/2026-06-20-darkroom-phase1-design.md` (read it; it holds the data model, sidecar formats, and edge cases).

**Architecture:** All metadata is derived **at build time** (`exifr` + post data + an optional `meta.json` sidecar) in `src/lib/darkroom.ts`. `src/pages/darkroom.astro` renders a masonry grid of Astro-generated thumbnails carrying `data-*` facets + PhotoSwipe attributes. `src/scripts/darkroom.js` does faceted filtering + PhotoSwipe. Base-path-aware; ships to the owner's site **and** the template.

**Tech Stack:** Astro 4.16; `exifr` (EXIF read, pure-JS); `photoswipe` v5; Astro `getImage` (`astro:assets`) for thumbnails; existing `topics.json` + `astro:content`.

## Global Constraints
- **Dark house style** (`#04060c`, teal→cyan→violet); **British spelling**.
- **Base-path aware**: internal links via `withBase()`; images via Astro asset pipeline (auto-prefixed). Must build correctly at `BASE_PATH=/demo/` (completeness grep empty).
- **No network at build**; **graceful** with no-EXIF and no-sidecar images (date → post date; camera/tags/album simply absent).
- **Reduced-motion** respected. `npm run build` + `npm run check:site` green. Don't break other pages.
- Reuse existing patterns: `.chip` styles, the topic-filter interaction on the Posts page, `withBase`.

---

### Task 1 — Dependencies + pure metadata helpers (+ tests)

**Files:**
- Modify: `package.json` (add `exifr`, `photoswipe`)
- Create: `src/lib/darkroom.ts` (types + pure helpers)
- Test: `src/lib/darkroom.test.mjs` (match the existing runner — see `scripts/flip-scheduled.test.mjs`)

**Interfaces — Produces (pure, exported, no Astro imports):**
- `type DarkroomPhoto` (exactly the shape in the spec's Data model).
- `tidyCamera(make?: string, model?: string): string | null` — `("FUJIFILM","X-T5")→"Fujifilm X-T5"`; if `model` already contains `make`, don't duplicate; title-case the make; `null` when both absent.
- `topicsForTags(tags: string[], topics: TopicDef[]): string[]` — map each post tag to its **top-level topic `name`** (a tag matches a topic's `tag` or any `sub[].tag`); dedupe; drop unknown tags; preserve first-seen order.
- `pickDate(exifDate: Date | undefined, postDate: Date): Date` — `exifDate ?? postDate`.
- `applySidecar(base: Omit<DarkroomPhoto,'tags'|'album'|'caption'>, entry?: { caption?: string; tags?: string[]; album?: string }): DarkroomPhoto` — merge; defaults `tags:[]`, `album:null`, `caption:null`.
- `sortByDateDesc(photos: DarkroomPhoto[]): DarkroomPhoto[]`.

**Steps:**
- [ ] Write `darkroom.test.mjs`: `tidyCamera` (tidy + make-in-model dedupe + both-null); `topicsForTags` (top-level + sub-tag match + unknown dropped + dedupe); `pickDate` fallback; `applySidecar` (present + absent); `sortByDateDesc`.
- [ ] Run the test — expect FAIL (helpers undefined).
- [ ] `npm install exifr photoswipe`.
- [ ] Implement the helpers in `src/lib/darkroom.ts`.
- [ ] Run the test — expect PASS.
- [ ] Commit.

**Acceptance:** tests pass; helpers import no Astro modules.

---

### Task 2 — `getDarkroomPhotos()` assembly + `darkroom.astro` rewrite

**Files:**
- Modify: `src/lib/darkroom.ts` (add the Astro-coupled assembler)
- Modify: `src/pages/darkroom.astro` (rewrite render)

**Interfaces — Consumes Task 1 helpers. Produces:** `async getDarkroomPhotos(): Promise<DarkroomPhoto[]>`.

**`getDarkroomPhotos`:** glob `../content/blog/_images/**/*.{jpg,jpeg,png,webp}` eager → `[path, {default: ImageMetadata}]`. For each: `exifr.parse(<abs path resolved from the key>, { pick:['DateTimeOriginal','Make','Model'] })` → date/camera; `getImage({ src: mod.default, width: 500 })` → `thumb.src`; `full = mod.default.src`, `width/height = mod.default.{width,height}`. Glob `**/meta.json` eager for sidecars. `getCollection('blog', ({data})=>!data.draft)` → join by slug (postTitle, `topicsForTags(post.tags, topics)`, fallback date); **drop images whose slug has no published post**. `applySidecar` with the per-slug `meta.json[filename]`. `sortByDateDesc`.

**`darkroom.astro`:** `const photos = await getDarkroomPhotos();` compute present-value sets: `years, topics, cameras, tags, albums, posts`. Render: existing hero; `<div class="darkroom-filter">` with a chip group per facet **only when it has >1 value** — and Tags/Album groups **only when non-empty** (each chip `data-facet="year|topic|camera|tag|album|post" data-value="…"`); a `<div id="darkroom-grid" class="darkroom-grid">` of:
```
<a class="dr-shot" href={withBase(photo.full)} data-pswp-width={photo.width} data-pswp-height={photo.height}
   data-year={photo.year} data-topics={photo.topics.join(' ')} data-camera={photo.camera ?? ''}
   data-tags={photo.tags.join(' ')} data-album={photo.album ?? ''} data-post={photo.postSlug}
   data-caption={photo.caption ?? ''} data-posttitle={photo.postTitle} data-postslug={photo.postSlug}>
  <img src={photo.thumb} loading="lazy" alt={photo.caption ?? ''} width={…} height={…} />
</a>
```
(Note: `full`/`thumb` from `getImage`/ImageMetadata are already base-aware — do NOT double-`withBase` Astro asset URLs; only `withBase` the post link used later.) Keep the empty-state.

**Steps:**
- [ ] Implement `getDarkroomPhotos` + rewrite `darkroom.astro`.
- [ ] `npm run build` — expect PASS; confirm `dist/darkroom/index.html` has `#darkroom-grid`, `data-year`, `data-camera`, and thumbnail `src="/_astro/…"`.
- [ ] `BASE_PATH=/demo/ npm run build`; confirm grid img src + post links are `/demo/`-prefixed and the completeness grep (`grep -rhoE 'href="/[a-z][^"]*"' dist | grep -vE '^href="/demo/'`) is empty.
- [ ] Commit.

**Acceptance:** build green at `/` and `/demo/`; grid + facet data present; template's no-EXIF placeholders still render.

---

### Task 3 — Faceted filter + PhotoSwipe lightbox + CSS

**Files:**
- Create: `src/scripts/darkroom.js`
- Modify: `src/styles/global.css` (grid + filter + PhotoSwipe theme); `src/pages/darkroom.astro` (wire the `<script>`, a live count element, a Clear button, import PhotoSwipe css)

**`darkroom.js`:**
- **Filter:** collect chip groups by `data-facet`; track a selected `Set` per facet; an `<a.dr-shot>` is visible iff, for **every** facet that has ≥1 selection, the item matches **one** of that facet's selected values (AND across facets, OR within) — match against the item's space-split `data-<facet>`. Toggle `.is-hidden`. Update active-chip styling, per-chip counts (optional), and a total count ("84 photos"). "Clear" empties all sets.
- **PhotoSwipe:** `const { default: PhotoSwipeLightbox } = await import('photoswipe/lightbox')`; init with `{ gallery:'#darkroom-grid', children:'a.dr-shot:not(.is-hidden)', pswpModule:()=>import('photoswipe') }`; re-`init()` (destroy+recreate) whenever the filter changes so the lightbox set tracks the visible set. Register a caption UI element showing `data-caption || data-posttitle` + an anchor "from this post →" to `withBase('/blog/'+slug+'/')` (compute base from a `<body data-base>` or an injected global; do NOT hardcode `/`). `prefers-reduced-motion` → `showHideAnimationType:'none'`.
- Run on load **and** on `astro:page-load`.

**CSS (`global.css`):** `.darkroom-grid{ columns: 1 / responsive up to ~4 via breakpoints; column-gap }`; `.dr-shot{ break-inside:avoid; display:block; margin-bottom; border-radius; overflow:hidden }` + hover lift; `.dr-shot img{ width:100%; height:auto; display:block }`; `.is-hidden{ display:none !important }`; `.darkroom-filter` chip bar (reuse `.chip`; active = accent border/glow); PhotoSwipe dark overrides (`--pswp-bg` near-black; caption bar legible; controls tinted teal). Import `photoswipe/style.css` (in the script via side-effect import, or in the page).

**Steps:**
- [ ] Implement the script + CSS + wire-up.
- [ ] `npm run build` green.
- [ ] **Browser QA (controller step):** thumbnails render; toggling each facet narrows correctly with counts; Tags/Album chips present only when used; PhotoSwipe opens, swipe/arrows/Esc, caption + "from this post →"; reduced-motion; mobile; base `/` + `/demo/`.
- [ ] Commit.

**Acceptance:** filter + lightbox work in-browser; no console errors; base/sub-path both correct.

---

### Task 4 — Album titles + check-gallery + docs + sample sidecar

**Files:**
- Create: `src/data/darkroom-albums.json` (example/empty array, with a comment-free schema `[{id,title,description?}]`)
- Modify: `scripts/check-gallery.mjs` (reconcile to the new render); `CONTENT-GUIDE.md` (document `meta.json` + `darkroom-albums.json`); **template-only** sample `src/content/blog/_images/<a three-cities slug>/meta.json` (tag those photos with e.g. a place + album `three-cities`) — added on the `template` branch during the port, NOT to the owner's content here.

**Steps:**
- [ ] Album facet labels resolve id→title from `darkroom-albums.json`, falling back to a title-cased id; load the file optionally (absent = fine).
- [ ] Update `scripts/check-gallery.mjs` so `npm run check:site`/its own check passes against the new structure (assert the grid renders + the no-EXIF graceful path; drop assertions about the old per-post-only markup).
- [ ] Document the `meta.json` (`{ "01.jpg": { caption, tags[], album } }`) + `darkroom-albums.json` formats + the auto facets in `CONTENT-GUIDE.md`.
- [ ] `npm run build` + `npm run check:site` (+ check-gallery) green.
- [ ] Commit.

**Acceptance:** check-gallery green; album titles display; docs updated.

---

## After the tasks
- Final whole-branch review (Opus) → fix Critical/Important.
- Merge `feat/darkroom-phase1` → `main`; verify build; **deploy to inayatpanda.com** (owner-authorised).
- Port to the `template` branch (add the sample `meta.json`), re-seed `blog-template`, re-verify Darkroom on the test blog (filter + lightbox at the sub-path).
