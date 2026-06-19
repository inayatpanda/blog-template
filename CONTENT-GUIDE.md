# Content guide

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

The `/darkroom/` page aggregates every gallery automatically. No extra steps are
needed — add images to `_images/<slug>/` and they appear in Darkroom the next
time the site builds. Posts are sorted newest-first. If no galleries exist yet,
the page shows "Nothing developed yet."

## Publishing

Commit to `main` → your CI workflow builds and deploys the site (GitHub Pages, Netlify, or Cloudflare Pages).
