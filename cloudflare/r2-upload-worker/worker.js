// Cloudflare Worker — R2 upload route (module syntax).
//
// Why this exists: the S3-compatible endpoint <account>.r2.cloudflarestorage.com
// is unreachable for the owner (TLS handshake_failure — a Cloudflare account-side
// cert issue, not the network). This Worker uploads to the SAME bucket via an R2
// BINDING (env.BUCKET), so it never touches the broken S3 host. The *.workers.dev
// hostname has a normal, valid cert, so both Helm (server) and the Studio (browser)
// can reach it.
//
// Auth: a single shared secret (env.UPLOAD_SECRET, set via `wrangler secret put`).
// Callers send `Authorization: Bearer <secret>` + `X-Key: <object key>` and the file
// as the raw request body. The Worker writes it to the bucket and returns { ok, key }.
//
// It also serves `GET /list` (same Bearer gate): it enumerates the bucket's `videos/`
// prefix via the R2 binding and returns { videos:[{ key, size, uploaded }] } (newest
// first) so the hosted/BYOK Studio — which has no Helm — can show a video library.
//
// And `POST /image` (same Bearer gate): it runs Cloudflare Workers AI's free FLUX.1-schnell
// text-to-image model via the AI binding (env.AI) and returns { image:<base64>, mimeType }.
// This gives the Studio free image generation in BOTH modes (BYOK + Helm) with no extra
// config — it reuses the SAME Worker URL + secret as upload/list. Needs the [ai] binding
// in wrangler.toml.
//
// Dependency-free. Bindings + secret are configured in wrangler.toml / wrangler secret.

const ALLOW_HEADERS = 'Authorization, Content-Type, X-Key';
const ALLOW_METHODS = 'GET, PUT, POST, OPTIONS';

// Workers AI text-to-image model. FLUX.1-schnell is fast and free-tier-friendly (a few
// steps per image), so it suits a one-tap "generate an image" action. Swap for an SDXL
// model id here if you'd rather trade speed for a different look.
const IMAGE_MODEL = '@cf/black-forest-labs/flux-1-schnell';

// Normalise whatever Workers AI returns for a text-to-image run into a base64 PNG string.
// FLUX-schnell returns JSON `{ image: "<base64>" }`; older/other models return a raw
// ReadableStream/ArrayBuffer of PNG bytes. Handle both so a model swap doesn't break this.
async function aiImageToBase64(out) {
  // Plain object with a base64 `image` field (FLUX-schnell's shape).
  if (out && typeof out === 'object' && typeof out.image === 'string') return out.image;
  // A binary response (stream or buffer) → base64-encode the bytes.
  let buf = null;
  if (out instanceof ReadableStream) buf = await new Response(out).arrayBuffer();
  else if (out instanceof ArrayBuffer) buf = out;
  else if (out && typeof out === 'object' && out.body instanceof ReadableStream) buf = await new Response(out.body).arrayBuffer();
  if (!buf) return '';
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

// CORS: the hosted Studio's fixed origin is always allowed; for any OTHER origin
// (e.g. Helm running on localhost, or a future custom domain) we reflect it back.
// The Bearer secret is the real gate — CORS only decides which browsers may try.
const STUDIO_ORIGIN = 'https://inayat-studio.netlify.app';
function corsHeaders(origin) {
  const allow = origin || STUDIO_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': ALLOW_METHODS,
    'Access-Control-Allow-Headers': ALLOW_HEADERS,
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders(origin) },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);

    // Preflight — answer every OPTIONS with the CORS allowances, no auth needed.
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Auth: constant prefix check on the Bearer token against the configured secret.
    // The SAME gate covers PUT/POST (upload) and GET /list (the video library).
    const auth = request.headers.get('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const authorised = !!env.UPLOAD_SECRET && token === env.UPLOAD_SECRET;

    // GET /list — enumerate the bucket's videos/ prefix and return keys only (the
    // Worker doesn't know the public base; the Studio builds the URL from publicBase).
    if (request.method === 'GET' && url.pathname === '/list') {
      if (!authorised) return json({ ok: false, error: 'unauthorised' }, 401, origin);
      try {
        const videos = [];
        let cursor;
        // Page through the listing (R2 returns ≤1000/call) until the bucket is exhausted
        // or we hit a sane cap, so the library doesn't grow unbounded.
        do {
          const page = await env.BUCKET.list({ prefix: 'videos/', cursor });
          for (const o of page.objects || []) {
            videos.push({ key: o.key, size: o.size, uploaded: o.uploaded ? new Date(o.uploaded).toISOString() : '' });
          }
          cursor = page.truncated ? page.cursor : undefined;
        } while (cursor && videos.length < 1000);
        // Newest first by uploaded timestamp.
        videos.sort((a, b) => (Date.parse(b.uploaded) || 0) - (Date.parse(a.uploaded) || 0));
        return json({ videos }, 200, origin);
      } catch (err) {
        return json({ ok: false, error: 'list failed: ' + (err && err.message ? err.message : String(err)) }, 502, origin);
      }
    }

    // POST /image — free text-to-image via Workers AI (same Bearer gate). Body: { prompt }.
    // Returns { image:<base64>, mimeType:'image/png' }. The Studio inserts this as an image
    // block. Reuses the SAME Worker URL + secret as upload — no extra Studio config.
    if (request.method === 'POST' && url.pathname === '/image') {
      if (!authorised) return json({ ok: false, error: 'unauthorised' }, 401, origin);
      if (!env.AI) {
        return json({ ok: false, error: 'Image generation is not enabled on this Worker. Add the [ai] binding to wrangler.toml and redeploy (npx wrangler deploy).' }, 501, origin);
      }
      let body = {};
      try { body = await request.json(); } catch { /* tolerate empty/invalid → handled below */ }
      const prompt = (body && typeof body.prompt === 'string' ? body.prompt : '').trim();
      if (!prompt) return json({ ok: false, error: 'missing prompt' }, 400, origin);
      try {
        const out = await env.AI.run(IMAGE_MODEL, { prompt });
        const image = await aiImageToBase64(out);
        if (!image) return json({ ok: false, error: 'the image model returned no image data' }, 502, origin);
        return json({ image, mimeType: 'image/png' }, 200, origin);
      } catch (err) {
        const m = (err && err.message ? err.message : String(err));
        // Quota/rate limits surface as 429-ish messages — pass a clear hint through.
        const quota = /quota|rate|limit|capacity|429/i.test(m);
        return json(
          { ok: false, error: (quota ? 'Image generation is rate-limited or out of free quota — try again later. ' : 'Image generation failed: ') + m },
          quota ? 429 : 502,
          origin,
        );
      }
    }

    if (request.method !== 'PUT' && request.method !== 'POST') {
      return json({ ok: false, error: 'method not allowed' }, 405, origin);
    }

    if (!authorised) {
      return json({ ok: false, error: 'unauthorised' }, 401, origin);
    }

    // Object key — required. Strip any leading slashes so the key can't escape the bucket root.
    const key = (request.headers.get('X-Key') || '').replace(/^\/+/, '').trim();
    if (!key) {
      return json({ ok: false, error: 'missing X-Key' }, 400, origin);
    }

    const contentType = request.headers.get('content-type') || 'application/octet-stream';
    try {
      await env.BUCKET.put(key, request.body, { httpMetadata: { contentType } });
    } catch (err) {
      return json({ ok: false, error: 'put failed: ' + (err && err.message ? err.message : String(err)) }, 502, origin);
    }
    return json({ ok: true, key }, 200, origin);
  },
};
