# Bone Deep — content guide

Posts are markdown files in `src/content/blog/`. Raw HTML is allowed anywhere in a post,
so every pattern below can be mixed with normal prose.

## Frontmatter

```yaml
---
title: "Post title"
description: "One-sentence summary shown on the card and in meta tags."
date: 2026-06-11
tags: ["shoulder", "technology", "interactive"]   # drives the topic sidebar
accent: "#22d3ee"                                  # card accent colour
draft: false
---
```

Tag with `interactive` to get the glowing Interactive badge.

## Images

Put files in `public/images/` and reference as `/images/...`:

```html
<figure>
  <img src="/images/glenoid-ct.jpg" alt="CT of a B2 glenoid" loading="lazy" />
  <figcaption>B2 glenoid: biconcavity and posterior erosion.</figcaption>
</figure>
```

Plain markdown `![alt](/images/x.jpg)` also works. Add `class="breakout"` for a wider-than-text image.

## Video

```html
<video src="/videos/reduction.mp4" controls preload="metadata" playsinline></video>
```

Self-hosted video published via Helm carries a `poster` still and an absolute CDN
URL (so it is base-path-immune — `withBase` leaves `http(s)://` URLs untouched).
A caption wraps it in a `figure.blk-video`:

```html
<!-- Self-hosted video published via Helm (absolute CDN URL → base-path-immune) -->
<video src="https://inayatpanda.com/media/med-abc-web.mp4"
       poster="https://inayatpanda.com/media/med-abc-poster.jpg"
       controls preload="metadata" playsinline></video>
```

YouTube / Vimeo:

```html
<div class="embed-16x9">
  <iframe src="https://www.youtube-nocookie.com/embed/VIDEO_ID" title="Title"
          loading="lazy" allowfullscreen></iframe>
</div>
```

## Animations & runnable HTML (playgrounds)

Any HTML/SVG/canvas inside a `.playground` panel gets the dark glowing treatment:

```html
<div class="playground">
  <svg viewBox="0 0 400 240"> ... </svg>
  <div class="pg-row">
    <div style="flex:1"><label for="my-slider">Parameter</label>
      <input id="my-slider" type="range" min="0" max="100" value="0" /></div>
    <div class="pg-readout">value <b id="my-out">0</b></div>
  </div>
</div>

<script type="application/pg">
(function () {
  var s = document.getElementById('my-slider');
  // runs on every visit, including after view transitions
})();
</script>
```

Use `type="application/pg"` — NOT a bare `<script>` — so the code re-runs after
client-side navigation. Self-contained third-party demos can be iframed instead:

```html
<iframe src="/demos/my-demo.html" style="height:480px" loading="lazy" title="Demo"></iframe>
```

Static demo files live in `public/demos/`.

## Photo galleries

### Adding images to a post

Place image files in `src/content/blog/_images/<post-slug>/`. The slug is the
filename of the `.md` file without the extension.

Reference them in the post body using standard markdown image syntax,
**one image per line, with no blank lines between them**:

```markdown
![Alt text](./_images/my-post-slug/photo1.jpg)
![Alt text](./_images/my-post-slug/photo2.jpg)
![Alt text](./_images/my-post-slug/photo3.jpg)
```

Two or more consecutive images automatically become a responsive grid with a
dark lightbox (click to enlarge, Esc or click to close). A single image in
isolation stays inline.

### Single images

A lone markdown image:

```markdown
![CT of a B2 glenoid](./_images/my-post-slug/glenoid-ct.jpg)
```

renders as a normal full-width block image. Add `class="breakout"` via raw HTML
if you need it wider than the text column.

### Playgrounds and images

The no-blank-lines and <4-space-indent restriction applies only inside `.playground`
HTML divs. Plain markdown images are not affected. Do not embed `![…](…)` inside a
`.playground` div — keep images in the normal body flow.

### Image sizing

Pre-resize photos to ≤ 2560 px on the longest side before committing. The site
deploys via FTP and large binaries slow every build and deploy.

### Darkroom

The `/darkroom/` page is a single wall of **every** photograph across the blog,
collected automatically. Photos are gathered from
`src/content/blog/_images/<post-slug>/` — exactly the same folders the in-post
galleries use, so adding images to a post adds them to the Darkroom too. No extra
steps are needed: drop images in and they appear the next time the site builds,
newest-first. An image whose folder slug has no published post is ignored. If
there are no photos at all, the page shows "Nothing developed yet."

Each photo can be narrowed by a **filter bar** of facets and clicked into a
full-screen lightbox (caption + a link back to its post).

**Automatic facets (zero config).** Built for every photo with no work from you:

- **Year** — from the photo's EXIF capture date (`DateTimeOriginal`). If the
  image has no EXIF (e.g. screenshots, exported figures, or photos with stripped
  metadata), the year falls back to the **post's `date`**.
- **Camera** — from EXIF make/model, tidied (e.g. "Fujifilm X-T5"). Photos with
  no EXIF simply don't carry a camera and are omitted from that facet.
- **Topic** — the post's `tags` mapped to their top-level topic (via
  `topics.json`), so a photo inherits the topics of the post it lives in.
- **Post** — every photo links back to, and is filterable by, its post.

A facet only appears when it has more than one value, so the bar stays tidy.

**Optional metadata — the `meta.json` sidecar (opt-in).** To add captions, your
own free-form tags (place, mood, subject, …), or group photos into an album, drop
a `meta.json` next to the images, i.e. `src/content/blog/_images/<post-slug>/meta.json`.
It is a map of **filename → optional fields**:

```json
{
  "01.jpg": { "caption": "Dawn over the Kamo river", "tags": ["Kyoto", "calm", "water"], "album": "japan-2026" },
  "02.jpg": { "tags": ["macro"] }
}
```

Every field is optional, and so is the file itself. A photo with no entry (or no
`meta.json`) just has no caption, no custom tags, and no album — the automatic
facets above still apply. When **any** photo carries custom `tags` or an `album`,
the corresponding **Tags** / **Album** facet appears in the filter bar. The
caption (when present) is shown in the lightbox in place of the post title.

**Optional album titles — `src/data/darkroom-albums.json`.** Albums are keyed by
the `album` id you put in a sidecar (e.g. `"japan-2026"`). By default the Album
facet shows a title-cased version of that id ("Japan 2026"). To control the
display name (and record an optional description for later use), add the file —
an array of `{ id, title, description? }`:

```json
[
  { "id": "japan-2026", "title": "Japan, 2026", "description": "Two weeks, mostly on foot." }
]
```

The file is optional: if it's absent, or an album id isn't listed in it, the
title-cased id is used. An empty array `[]` is valid (the default).

> Tip: pre-resize photos to ≤ 2560 px on the longest side before committing — the
> site deploys via FTP and large binaries slow every build and deploy. The grid
> serves small ~500 px thumbnails; the full-size image loads only in the lightbox.

## Publishing

Commit to `main` → GitHub Action builds and FTP-deploys to Hostinger (~2 min).
