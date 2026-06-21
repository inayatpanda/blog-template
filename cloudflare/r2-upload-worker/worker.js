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
// Dependency-free. Binding + secret are configured in wrangler.toml / wrangler secret.

const ALLOW_HEADERS = 'Authorization, Content-Type, X-Key';
const ALLOW_METHODS = 'PUT, POST, OPTIONS';

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

    // Preflight — answer every OPTIONS with the CORS allowances, no auth needed.
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'PUT' && request.method !== 'POST') {
      return json({ ok: false, error: 'method not allowed' }, 405, origin);
    }

    // Auth: constant prefix check on the Bearer token against the configured secret.
    const auth = request.headers.get('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!env.UPLOAD_SECRET || token !== env.UPLOAD_SECRET) {
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
