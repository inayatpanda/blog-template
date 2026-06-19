# Build your own site

You get your own blog, the 3D Observatory, and the Studio editor — all yours, free.
You bring your own keys (GitHub + AI); nothing is stored on a server.

---

## 1 · Copy the template

On GitHub, open this repository and click **Use this template → Create a new repository**.
Give it any name. Keep it public (required for free GitHub Pages hosting) or private if you use Netlify or Cloudflare Pages.

---

## 2 · Get your keys

### GitHub fine-grained token

1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. **Repository access:** select *your new repo only*.
3. **Permissions → Repository permissions → Contents: Read and write**. Nothing else is needed.
4. Copy the token — you will paste it into the Studio once.

> Keys are entered in your browser and kept in browser storage only. They are never sent to any server you do not control.

### AI key

Get a key from one of:
- [Anthropic](https://console.anthropic.com/) (Claude)
- [OpenAI](https://platform.openai.com/)
- [Google AI Studio](https://aistudio.google.com/) (Gemini)

---

## 3 · Open the Studio

Go to your Studio URL (e.g. `https://studio.your-domain.com` if you are using a hosted version, or `http://127.0.0.1:4800/studio` if running Helm locally).

In the first-run panel fill in:

| Field | Value |
|---|---|
| Owner | your GitHub username |
| Repo | your new repository name |
| Branch | `main` |
| GitHub token | the token from step 2 |
| AI provider | Anthropic / OpenAI / Google |
| AI key | the key from step 2 |

Click **Save**. The Studio connects to your repo.

---

## 4 · Make it yours

Open **Site settings** (nav → Site). Set:

- **Name** — your name or site name.
- **Masthead** — your blog title (shown large at the top).
- **Tagline** — a short strapline.
- **Description** — one sentence for SEO and social cards.
- **Site URL** — `https://your-domain.com` (or your GitHub Pages URL; see step 6).
- **Default theme** — one of: `observatory`, `vista`, `blueprint`, `atlas`, `daybreak`, `dune`, `rivendell`.
- **Socials** — LinkedIn, Instagram, GitHub URLs (leave blank to hide).
- **Contact / Newsletter endpoints** — Formspree form action URLs (free tier available at [formspree.io](https://formspree.io)).

Click **Save site settings**. This commits `src/data/site.json` to your repo.

Field reference: [`src/data/site.example.json`](src/data/site.example.json).

---

## Make the rest yours (clear the starter content)

The template ships with example posts and a placeholder profile so the site looks alive on day one. Before you publish your own, clear out what you don't want — it all lives in plain files in your repo, so nothing here is permanent.

- **Your profile / About page** — edit `src/data/profile.json` (name, role, tagline, bio, stats). Fields you don't need can be left blank. See [`src/data/profile.example.json`](src/data/profile.example.json) for the shape. The other files in `src/data/` (`experience.json`, `publications.json`, `apps.json`, …) also feed the About and Apps pages — edit or empty them to match you.
- **The example posts** — the sample posts in `src/content/blog/` (and their images in `src/content/blog/_images/`) exist to show off the features: interactive playgrounds, line-art figures, photo galleries, multi-part series, and footnotes. Keep any you want as a reference, then delete the rest.
- **Your topics** — rename the sections in `src/data/topics.json`. Change each section's `name`, `subtitle`, `colour` and `blurb` to your own; leave the `tag` values as they are (your posts and the Observatory reference them).

---

## 5 · Write & publish

In the Studio, click **New post** (or use Compose for a social draft). Write, then click **Publish**. The post is committed to `src/content/blog/` and your CI workflow rebuilds the site automatically.

---

## 6 · Put it online

### GitHub Pages

1. In your repo: **Settings → Pages → Source → GitHub Actions**.
2. In `.github/workflows/deploy-pages.yml`, uncomment the `push:` trigger:
   ```yaml
   on:
     push:
       branches: [main]
   ```
3. **Sub-path note:** if your site will serve at `https://username.github.io/your-repo` (a project site, not a custom domain), you must set `base` in `astro.config.mjs`:
   ```js
   export default defineConfig({
     site: 'https://username.github.io/your-repo',
     base: '/your-repo/',
     // ...
   });
   ```
   A **custom domain** (e.g. `https://yourname.com`) or a `username.github.io` user-site (`username/username.github.io`) needs no `base`.

4. Push to `main` — the **Deploy to GitHub Pages** workflow runs and your site is live in ~2 minutes.

### Cloudflare Pages or Netlify

Connect your repo in the Cloudflare Pages / Netlify dashboard:

- **Build command:** `npm run build`
- **Output directory:** `dist`

No workflow changes or `base` setting needed. Deploy on every push to `main` automatically.

---

## Troubleshooting

**Token errors / 403 from Studio**
Check the token has **Contents: Read and write** on *your* repo specifically (not all repos). Regenerate if in doubt.

**Sub-path links broken on GitHub Pages**
You are on a project sub-path. Set `base: '/your-repo/'` in `astro.config.mjs` and update `site:` to the full Pages URL (see step 6).

**Commits not appearing / CI not running**
Check that the branch in the Studio is `main` and matches the branch your Pages workflow deploys from.

**Changes saved in Studio but site not updating**
Check the Actions tab in your repo for CI errors. Common cause: a missing `npm ci` cache or the `pages` environment not yet enabled (Settings → Environments → github-pages).
