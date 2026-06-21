# R2 upload Worker

A tiny Cloudflare Worker that uploads files to your R2 bucket through an **R2 binding**,
so neither Helm nor the Studio ever has to touch the
`https://<account-id>.r2.cloudflarestorage.com` S3 endpoint — which currently fails with
a TLS `handshake_failure` (a Cloudflare account-side cert problem, not your network).

The Worker runs at a normal `*.workers.dev` hostname with a valid cert, so both your laptop
(Helm) and your phone (the hosted Studio) can reach it.

## What it does

- `OPTIONS` → CORS preflight (allows the hosted Studio origin + reflects any other origin,
  methods `GET/PUT/POST/OPTIONS`, headers `Authorization, Content-Type, X-Key`).
- `PUT` / `POST` → requires `Authorization: Bearer <UPLOAD_SECRET>` and an `X-Key` header
  (the object key). The request body is the raw file bytes. Writes to the bound bucket with
  the request's `Content-Type` and returns `{ "ok": true, "key": "<key>" }`.
- `GET /list` → **same** `Authorization: Bearer <UPLOAD_SECRET>` gate. Enumerates the bucket's
  `videos/` prefix via the R2 binding (paging the cursor until exhausted, capped at ~1000) and
  returns `{ "videos": [ { "key", "size", "uploaded" } ] }`, newest first. Keys only — the
  Worker doesn't know the public base, so the Studio builds each URL as `${publicBase}/${key}`.
  This is how the hosted/BYOK Studio (which has no Helm) shows its video library.
- `POST /image` → **same** `Authorization: Bearer <UPLOAD_SECRET>` gate. Body `{ "prompt": "…" }`.
  Runs Cloudflare Workers AI's **free** `@cf/black-forest-labs/flux-1-schnell` text-to-image
  model through the `env.AI` binding and returns `{ "image": "<base64>", "mimeType": "image/png" }`.
  This gives the Studio free image generation (✦ Generate on any image block) in both modes,
  reusing the **same** Worker URL + secret — no AI provider key, no extra config.
- `401` on a bad/missing Bearer secret, `400` on a missing `X-Key`/prompt, `405` on any other
  method, `501` if `/image` is called but the `[ai]` binding isn't deployed yet, `429` when
  Workers AI is rate-limited / out of free quota, `502` on a write/list/image error.

It stores nothing else and has no dependencies.

## Deploy (owner steps)

You need a Cloudflare account with the bucket already created (default name in
`wrangler.toml` is `YOUR-BUCKET-NAME` — edit it if yours differs).

```sh
cd cloudflare/r2-upload-worker

# 1. Deploy the Worker (wrangler will prompt you to log in the first time).
npx wrangler deploy

# 2. Set the shared upload secret (paste a long random string — keep a copy).
npx wrangler secret put UPLOAD_SECRET

# 3. wrangler printed a URL after step 1, e.g.
#      https://r2-upload-worker.<your-subdomain>.workers.dev
#    Copy it — that's your Worker URL.
```

Generate a strong secret with, e.g.: `openssl rand -hex 32`

## Point Helm + the Studio at it

**Helm** — in `config/config.json`, set the media block:

```json
"media": {
  "target": "worker",
  "worker": {
    "url": "https://r2-upload-worker.<your-subdomain>.workers.dev",
    "secret": "<the UPLOAD_SECRET you set above>",
    "publicBase": "https://media.yoursite.com"
  }
}
```

`publicBase` is wherever the bucket serves objects publicly (your R2 custom domain or the
`pub-….r2.dev` URL). The uploaded file's URL becomes `${publicBase}/${key}`.

**Studio** — open **Settings → Video storage** and, under **Use a Worker**, paste the same
**Worker URL** + **secret** (and the public base URL in the R2 fields). The video block's
"Upload to R2" button will then route through the Worker instead of the S3 endpoint,
**Media → Video** lists your bucket's clips via the `GET /list` route (same Worker, no Helm),
and the **✦ Generate** action on any image block makes free images via the `POST /image`
route (same Worker, same secret — see below).

## Free image generation (Workers AI / FLUX) — one-time enable

The `POST /image` route needs the Workers AI binding (`env.AI`). It's already declared in
`wrangler.toml`:

```toml
[ai]
binding = "AI"
```

So enabling it is a single redeploy — your URL + `UPLOAD_SECRET` are unchanged, and the
Studio already has the Worker URL + secret, so **nothing else needs editing**:

```sh
cd cloudflare/r2-upload-worker
npx wrangler deploy
```

Image generation uses Cloudflare's **free** Workers AI daily neuron allowance. If you hit the
cap, `/image` returns `429` with a clear "rate-limited / out of free quota" message — try again
later. To trade speed for a different look, change `IMAGE_MODEL` in `worker.js` to an SDXL id.

## Redeploy after a Worker change

The `/list` and `/image` routes (and the `[ai]` binding) are added by an edit to this folder,
so an already-deployed Worker needs one redeploy to serve them. One command, from this folder —
your URL + `UPLOAD_SECRET` are unchanged, so nothing else needs editing:

```sh
cd cloudflare/r2-upload-worker
npx wrangler deploy
```

## Local check

`wrangler` isn't installed in this repo and is not required for the build/tests. Deploying
needs network access and a Cloudflare login, so run the commands above on the owner's machine.
