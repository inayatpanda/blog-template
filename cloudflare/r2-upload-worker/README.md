# R2 upload Worker

A tiny Cloudflare Worker that uploads files to your R2 bucket through an **R2 binding**,
so neither Helm nor the Studio ever has to touch the
`https://<account-id>.r2.cloudflarestorage.com` S3 endpoint — which currently fails with
a TLS `handshake_failure` (a Cloudflare account-side cert problem, not your network).

The Worker runs at a normal `*.workers.dev` hostname with a valid cert, so both your laptop
(Helm) and your phone (the hosted Studio) can reach it.

## What it does

- `OPTIONS` → CORS preflight (allows the hosted Studio origin + reflects any other origin,
  methods `PUT/POST/OPTIONS`, headers `Authorization, Content-Type, X-Key`).
- `PUT` / `POST` → requires `Authorization: Bearer <UPLOAD_SECRET>` and an `X-Key` header
  (the object key). The request body is the raw file bytes. Writes to the bound bucket with
  the request's `Content-Type` and returns `{ "ok": true, "key": "<key>" }`.
- `401` on a bad/missing Bearer secret, `400` on a missing `X-Key`, `502` on a write error.

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
"Upload to R2" button will then route through the Worker instead of the S3 endpoint.

## Local check

`wrangler` isn't installed in this repo and is not required for the build/tests. Deploying
needs network access and a Cloudflare login, so run the commands above on the owner's machine.
