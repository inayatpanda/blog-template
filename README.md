# Your blog

A dark, fast, static blog with a 3D **Observatory**, interactive **playgrounds**, line-art **figures**, photo **galleries**, multi-part **series**, and footnotes — plus a phone-friendly composer (**the Helm Studio**) that publishes by committing straight to this repo. No CMS, no monthly bills.

**This is a template.** To make it yours, follow **[BUILD-YOUR-OWN.md](BUILD-YOUR-OWN.md)** — copy the repo, add your own keys, set your name and topics, and publish.

## Quick start (local)

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # static output in dist/
npm run check:site   # verifies the site is fully re-brandable
```

## Make it yours

- **Identity** lives in [`src/data/site.json`](src/data/site.json) — your name, masthead, tagline, theme, socials. (See `site.example.json` for the shape.)
- **Sections / topics** live in [`src/data/topics.json`](src/data/topics.json) — rename them in the Studio's **Topics** screen, or edit the file directly. Each section's `tag` stays fixed; you change the `name`, `subtitle`, `color` and `blurb`.
- **About / profile** is [`src/data/profile.json`](src/data/profile.json) (see `profile.example.json`).
- **The sample posts** in `src/content/blog/` exist to show what's possible — interactive playgrounds, a line-art figure, a 3-part series with a photo gallery, and footnotes. Keep any you like as a reference, then delete the rest and write your own. Full walkthrough in **[BUILD-YOUR-OWN.md](BUILD-YOUR-OWN.md) → "Make the rest yours"**.

## Hosting

Deploy free to GitHub Pages, Cloudflare Pages, or Netlify — see the hosting section of [BUILD-YOUR-OWN.md](BUILD-YOUR-OWN.md). Built with [Astro](https://astro.build).
