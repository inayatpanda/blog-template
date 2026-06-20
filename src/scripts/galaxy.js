/**
 * Galaxy engine — renders the site's drifting icon field in two modes:
 *   mode 'hero'   : a small dispersed field behind the masthead.
 *   mode 'system' : a full-viewport dispersed field (/observatory).
 *
 * A small, static, non-interactive Sun monogram sits at the centre as a logo.
 * Topic posts drift through the scene as a parallax field of glow-stars: each
 * is a glowing point-of-light (tinted to its topic) that resolves into its
 * wireframe glyph only as it nears the camera. A bounded cast is on screen at
 * once and streams the full post pool over time, so the scene scales to a
 * large archive.
 *
 * initGalaxy({ canvas, overlay, mode, data, prefersReducedMotion }) → { dispose, focusPlanet }
 *   data = { items: [{title,url,topic,type,ref,date}], planets: [{slug,name,subtitle,color,url,count}] }
 *
 * The engine owns its label/card DOM + CSS (injected once) so the Astro
 * components only need a <canvas> and an empty overlay element.
 */
import * as THREE from 'three';
import { PALETTE, ACCENTS, hex } from '../lib/galaxy/palette.js';
import { resolveGlyph, resolveThemeGlyph } from '../lib/glyphs/index.js';
import { sunMonogram } from '../lib/galaxy/bodies.js';
import { glowTexture } from '../lib/galaxy/wire.js';
import site from '../data/site.json';

const SUN_SPEC = {
  kind: 'sun', name: site.name, col: PALETTE.core,
  title: site.name,
};

const CSS = `
.gx-label{position:absolute;z-index:6;pointer-events:none;display:none;will-change:transform}
.gx-label .gx-leader{position:absolute;left:0;bottom:0;width:34px;height:1px;transform-origin:left bottom;transform:rotate(-35deg);background:linear-gradient(90deg,rgba(226,232,240,.9),rgba(226,232,240,.1))}
.gx-label .gx-text{position:absolute;left:32px;bottom:22px;white-space:nowrap;color:#fff;font-size:12px;letter-spacing:.22em;text-transform:uppercase}
.gx-label .gx-sub{margin-left:.55em;letter-spacing:.18em}
.gx-card{position:absolute;z-index:13;display:none;width:280px;background:rgba(7,11,20,.92);border:1px solid rgba(148,163,184,.25);border-radius:14px;padding:18px 20px;backdrop-filter:blur(10px);box-shadow:0 14px 50px rgba(0,0,0,.6);cursor:pointer;transition:border-color .15s,transform .15s}
.gx-card:hover{border-color:rgba(34,211,238,.55);transform:translateY(-2px)}
.gx-card .gx-const{font-size:11px;letter-spacing:.24em;text-transform:uppercase}
.gx-card h3{color:#fff;margin:.45em 0 .4em;font-size:16px;font-weight:650;line-height:1.25}
.gx-card:hover h3{text-decoration:underline;text-decoration-color:rgba(255,255,255,.35);text-underline-offset:3px}
.gx-card p{color:#9fb3c8;margin:0 0 .8em;font-size:13px;line-height:1.5}
.gx-card .gx-go{display:block;color:#fff;font-size:13px;font-weight:650;letter-spacing:.02em;margin-bottom:.55em}
.gx-card:hover .gx-go{color:#22d3ee}
.gx-card .gx-link{color:#9fb3c8;font-size:12px;text-decoration:none;letter-spacing:.04em;cursor:pointer}
.gx-card .gx-link:hover{color:#22d3ee}
.gx-card .gx-close{position:absolute;top:8px;right:12px;color:#5b6b80;cursor:pointer;font-size:15px;line-height:1}
@media (prefers-reduced-motion: reduce){.gx-label{transition:none}}
/* LIGHT themes: dark hover label + a light pop-up card, so they read on light backgrounds */
:is([data-site-theme="daybreak"],[data-site-theme="dune"],[data-site-theme="rivendell"]) .gx-label .gx-leader{background:linear-gradient(90deg,rgba(40,50,70,.85),rgba(40,50,70,.05))}
:is([data-site-theme="daybreak"],[data-site-theme="dune"],[data-site-theme="rivendell"]) .gx-label .gx-text{color:#1b2438;text-shadow:0 1px 7px rgba(255,255,255,.95),0 0 2px rgba(255,255,255,.9)}
:is([data-site-theme="daybreak"],[data-site-theme="dune"],[data-site-theme="rivendell"]) .gx-card{background:rgba(255,255,255,.94);border-color:rgba(60,80,110,.28);box-shadow:0 14px 46px rgba(50,60,80,.28)}
:is([data-site-theme="daybreak"],[data-site-theme="dune"],[data-site-theme="rivendell"]) .gx-card h3{color:#16223c}
:is([data-site-theme="daybreak"],[data-site-theme="dune"],[data-site-theme="rivendell"]) .gx-card p{color:#4c5d73}
:is([data-site-theme="daybreak"],[data-site-theme="dune"],[data-site-theme="rivendell"]) .gx-card .gx-go{color:#16223c}
:is([data-site-theme="daybreak"],[data-site-theme="dune"],[data-site-theme="rivendell"]) .gx-card .gx-link{color:#4c5d73}
:is([data-site-theme="daybreak"],[data-site-theme="dune"],[data-site-theme="rivendell"]) .gx-card .gx-close{color:#8090a0}
/* light-theme landscape: a full-width, bottom-anchored layer (no visible edges) that parallaxes */
.gx-landscape{position:absolute;left:-10%;right:-10%;bottom:-9%;height:56%;background-repeat:no-repeat;background-position:bottom center;background-size:100% auto;pointer-events:none;z-index:1;will-change:transform}
`;

function ensureStyle() {
  if (document.getElementById('gx-style')) return;
  const s = document.createElement('style');
  s.id = 'gx-style';
  s.textContent = CSS;
  document.head.appendChild(s);
}

function smoothstep(x) { x = Math.min(Math.max(x, 0), 1); return x * x * (3 - 2 * x); }

// Vertical gradient background texture — e.g. a sunlit water column for the Vista
// (underwater) theme: light filtering from the surface above into the dark deep.
function gradientTexture(THREE, top, bottom) {
  const cv = document.createElement('canvas'); cv.width = 8; cv.height = 256;
  const g = cv.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, top); grd.addColorStop(1, bottom);
  g.fillStyle = grd; g.fillRect(0, 0, 8, 256);
  const tex = new THREE.CanvasTexture(cv);
  if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// A landscape silhouette on a TRANSPARENT sky, returned as a CANVAS (used as a bottom-anchored
// full-width CSS layer so it has no visible edges). 'dunes' / 'forest' / 'horizon'.
function landscapeCanvas(kind) {
  const W = 1024, H = 320, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');                       // transparent above the silhouette
  if (kind === 'dunes') {
    [['#d8bb80', 0.4], ['#c9a868', 0.58], ['#b2914f', 0.78]].forEach(([col, base], i) => {
      g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W; x += 6) g.lineTo(x, H * base + Math.sin(x * 0.006 + i * 1.7) * 26 + Math.sin(x * 0.017 + i) * 10);
      g.lineTo(W, H); g.closePath(); g.fill();
    });
  } else if (kind === 'forest') {
    g.fillStyle = '#bdb487'; g.beginPath(); g.moveTo(0, H);                 // distant hills
    for (let x = 0; x <= W; x += 8) g.lineTo(x, H * 0.42 + Math.sin(x * 0.005) * 24);
    g.lineTo(W, H); g.closePath(); g.fill();
    const wf = g.createLinearGradient(0, H * 0.36, 0, H);                   // waterfall
    wf.addColorStop(0, 'rgba(226,239,243,0)'); wf.addColorStop(0.3, 'rgba(226,239,243,0.8)'); wf.addColorStop(1, 'rgba(205,228,237,0.95)');
    g.fillStyle = wf; g.fillRect(W * 0.475, H * 0.36, W * 0.05, H * 0.64);
    g.fillStyle = 'rgba(150,185,170,0.6)'; g.fillRect(0, H * 0.9, W, H * 0.1);  // pool
    g.fillStyle = '#4d6a3c';                                                 // fir tree-line
    for (let x = -12; x < W + 12; x += 17) {
      const h = 40 + ((x * 7) % 26);
      g.beginPath(); g.moveTo(x, H * 0.84); g.lineTo(x + 8.5, H * 0.84 - h); g.lineTo(x + 17, H * 0.84); g.closePath(); g.fill();
    }
  } else if (kind === 'horizon') {                                           // Daybreak — distant cloud-bank + soft hills
    const hz = g.createLinearGradient(0, H * 0.5, 0, H);
    hz.addColorStop(0, 'rgba(255,255,255,0)'); hz.addColorStop(0.6, 'rgba(247,251,255,0.55)'); hz.addColorStop(1, 'rgba(236,245,253,0.82)');
    g.fillStyle = hz; g.fillRect(0, H * 0.5, W, H * 0.5);
    g.fillStyle = 'rgba(176,203,230,0.5)'; g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 12) g.lineTo(x, H * 0.74 + Math.sin(x * 0.006) * 20 + Math.sin(x * 0.018) * 8);
    g.lineTo(W, H); g.closePath(); g.fill();
  }
  return cv;
}

// Soft-edged vertical light-shaft texture (bright at the surface → fading into the deep)
// for Vista's god rays. Vertical brightness fade × horizontal soft edges.
function shaftTexture(THREE) {
  const w = 64, h = 256;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  const vg = g.createLinearGradient(0, 0, 0, h);
  vg.addColorStop(0, 'rgba(255,255,255,0.9)');
  vg.addColorStop(0.5, 'rgba(255,255,255,0.32)');
  vg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = vg; g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'destination-in';      // soften the left/right edges
  const hg = g.createLinearGradient(0, 0, w, 0);
  hg.addColorStop(0, 'rgba(0,0,0,0)'); hg.addColorStop(0.5, 'rgba(0,0,0,1)'); hg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = hg; g.fillRect(0, 0, w, h);
  const tex = new THREE.CanvasTexture(cv);
  if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Themed ambient-mote sprite textures (white on transparent; tinted per-point by vertex colour).
function markTexture(THREE) {            // Blueprint — draughting crosshair "+"
  const s = 64, cv = document.createElement('canvas'); cv.width = cv.height = s;
  const g = cv.getContext('2d');
  g.strokeStyle = 'rgba(255,255,255,0.96)'; g.lineWidth = 4; g.lineCap = 'round';
  g.beginPath(); g.moveTo(s / 2, 11); g.lineTo(s / 2, s - 11); g.moveTo(11, s / 2); g.lineTo(s - 11, s / 2); g.stroke();
  const t = new THREE.CanvasTexture(cv); if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace; return t;
}
function squareTexture(THREE) {          // Blueprint — hollow node square
  const s = 64, cv = document.createElement('canvas'); cv.width = cv.height = s;
  const g = cv.getContext('2d');
  g.strokeStyle = 'rgba(255,255,255,0.96)'; g.lineWidth = 5; g.strokeRect(15, 15, s - 30, s - 30);
  const t = new THREE.CanvasTexture(cv); if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace; return t;
}
function ringTexture(THREE) {            // Atlas — cell / corpuscle (ring + faint fill)
  const s = 64, cv = document.createElement('canvas'); cv.width = cv.height = s;
  const g = cv.getContext('2d');
  g.fillStyle = 'rgba(255,255,255,0.16)'; g.beginPath(); g.arc(s / 2, s / 2, s / 2 - 12, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.92)'; g.lineWidth = 5; g.beginPath(); g.arc(s / 2, s / 2, s / 2 - 10, 0, Math.PI * 2); g.stroke();
  const t = new THREE.CanvasTexture(cv); if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace; return t;
}

function cloudTexture(THREE) {            // Daybreak — soft fluffy cloud puff
  const s = 96, cv = document.createElement('canvas'); cv.width = cv.height = s;
  const g = cv.getContext('2d');
  const blob = (x, y, r, a) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  };
  blob(38, 56, 26, 0.95); blob(60, 52, 30, 0.95); blob(48, 44, 24, 0.9); blob(72, 60, 20, 0.85); blob(26, 58, 18, 0.85);
  const t = new THREE.CanvasTexture(cv); if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace; return t;
}
function leafTexture(THREE) {             // Rivendell — drifting leaf
  const s = 64, cv = document.createElement('canvas'); cv.width = cv.height = s;
  const g = cv.getContext('2d');
  g.fillStyle = 'rgba(255,255,255,0.95)';
  g.beginPath(); g.moveTo(s * 0.5, 7); g.quadraticCurveTo(s - 7, s * 0.5, s * 0.5, s - 7);
  g.quadraticCurveTo(7, s * 0.5, s * 0.5, 7); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.28)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(s * 0.5, 11); g.lineTo(s * 0.5, s - 11); g.stroke();
  const t = new THREE.CanvasTexture(cv); if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace; return t;
}

// Per-theme 3D "environment": backdrop + ambient field + extras. Each site theme renders a
// distinct world — its own backdrop AND its own drifting ambient (not just a recolour). The
// LIGHT themes (light:true) flip the 3D to dark-ink-on-light (glows become soft dark dots).
function themeEnv(theme) {
  switch (theme) {
    case 'vista':     return { grad: ['#0a4a5e', '#01060e'], ambient: 'bubbles', ambientPal: [0xbdf2ff, 0xe3fbff, 0x7fe0ef, 0xffffff, 0xa6ecfb], rays: true, rayColor: 0xbdf2ff };
    case 'blueprint': return { bg: 0x061320, ambient: 'marks', ambientPal: [0x9fd2ff, 0xcfe6ff, 0x7fb8e6, 0xeaf4ff, 0xb6ecff], grid: true, gridColor: 0x4a90c0 };
    case 'atlas':     return { bg: 0x0b0a08, ambient: 'cells', ambientPal: [0xe7ddc7, 0xd8c39a, 0xc9a36b, 0xf3ead6, 0xb5654d] };
    case 'daybreak':  return { light: true, grad: ['#9fccef', '#eaf5fd'], ambient: 'clouds', ambientPal: [0xffffff, 0xf3f9ff, 0xe9f2fc], landscape: 'horizon', sun: { color: 0xfff1c8, pos: [2, 13, -36], size: 15, opacity: 0.5 } };
    case 'dune':      return { light: true, grad: ['#f2e6cb', '#e6cf9f'], ambient: 'sand',   ambientPal: [0x9a7a47, 0xb5945c, 0x6b4f2a], landscape: 'dunes', sun: { color: 0xffd9a0, pos: [4, 4, -40], size: 24, opacity: 0.45 } };
    case 'rivendell': return { light: true, grad: ['#efe8d3', '#dfd2b0'], ambient: 'leaves', ambientPal: [0x5a7b3c, 0x8a7330, 0x7a5a2a, 0x466b3f], landscape: 'forest', sun: { color: 0xffe6ac, pos: [-14, 11, -36], size: 16, opacity: 0.5 } };
    default:          return { bg: 0x04060c, ambient: 'stars', ambientPal: null };
  }
}

export function initGalaxy({ canvas, overlay, mode = 'hero', data, prefersReducedMotion = false, offset }) {
  const reduced = !!prefersReducedMotion;
  const isSystem = mode === 'system';
  // Theme-aware recolour: when a non-default site theme is active, derive every topic
  // colour from the active theme's palette (PALETTE is theme-aware) instead of the posts'
  // baked `accent` / topics.json hex — so the whole scene reskins per theme, not just the
  // sun + starfield. Default (observatory) theme keeps the hand-picked per-post accents.
  const themed = !!(typeof document !== 'undefined' && document.documentElement.dataset.siteTheme);
  const items = ((data && data.items) || []).map((it) => (themed ? { ...it, accent: null } : it));
  const planetsData = ((data && data.planets) || []).map((p) =>
    (themed ? { ...p, color: hex(PALETTE[p.slug] || PALETTE.forge) } : p));
  // …and recolour the SSR-baked legend dots (desktop + mobile) to match.
  if (themed && typeof document !== 'undefined') {
    document.querySelectorAll('[data-slug] .legend-dot').forEach((dot) => {
      const slug = dot.closest('[data-slug]')?.dataset.slug;
      const c = slug && hex(PALETTE[slug] || PALETTE.forge);
      if (c) { dot.style.background = c; dot.style.boxShadow = `0 0 8px ${c}55`; }
    });
  }
  const mobile = window.matchMedia('(max-width: 640px)').matches;
  // scene centre. The hero shifts the whole system into the open right area so
  // it never collides with the left-aligned masthead; /galaxy keeps it centred.
  // hero shifts the system clear of the masthead: right on desktop, up into the
  // empty top third on mobile (narrow screens have no open side column).
  const off = offset || (mode === 'hero' ? { x: mobile ? 0 : 3.4, y: mobile ? 5.2 : 0.4 } : { x: 0, y: 0 });
  const core = new THREE.Vector3(off.x, 0.1 + off.y, -2);

  ensureStyle();

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const themeId = (typeof document !== 'undefined' && document.documentElement.dataset.siteTheme) || '';
  const env = themeEnv(themeId);
  scene.background = env.grad
    ? gradientTexture(THREE, env.grad[0], env.grad[1])
    : new THREE.Color(env.bg);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 120);
  camera.position.z = 14;

  const halfH = (z) => Math.tan(THREE.MathUtils.degToRad(25)) * (14 - z);
  const halfW = (z) => halfH(z) * camera.aspect;

  // ---- orbit camera (system/observatory only): drag to look around the centre
  // logo across a bounded ~270° arc. The pivot is the Sun, so the logo stays put
  // in the middle of the frame however far you swing the view. Hero mode keeps its
  // gentle pointer-parallax instead (no drag behind the masthead). ----
  const PIVOT = core.clone();
  const ORBIT_R = camera.position.distanceTo(PIVOT);          // ~16
  const AZ_MAX = THREE.MathUtils.degToRad(135);               // ±135° ⇒ 270° total
  const POL_MAX = THREE.MathUtils.degToRad(34);
  const clampN = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  // az/pol = rendered angle; taz/tpol = drag target; vaz/vpol = release inertia.
  const orbit = { az: 0, pol: 0, taz: 0, tpol: 0, vaz: 0, vpol: 0, dragging: false };
  let lastInteract = -10;
  let highlightTopic = null;   // active topic focus (declared early — respawn() uses it during init)
  function placeOrbitCamera(t) {
    const idle = orbit.dragging || (t - lastInteract) < 1.6 ? 0 : Math.sin(t * 0.05) * 0.08;
    const az = orbit.az + idle, cp = Math.cos(orbit.pol), sp = Math.sin(orbit.pol);
    camera.position.set(
      PIVOT.x + ORBIT_R * Math.sin(az) * cp,
      PIVOT.y + ORBIT_R * sp,
      PIVOT.z + ORBIT_R * Math.cos(az) * cp);
    camera.lookAt(PIVOT);
  }

  // ---- label + card DOM (engine-owned) ----
  const label = document.createElement('div');
  label.className = 'gx-label';
  label.innerHTML = '<span class="gx-leader"></span><span class="gx-text"><span class="gx-name"></span><span class="gx-sub"></span></span>';
  const labelName = label.querySelector('.gx-name');
  const labelSub = label.querySelector('.gx-sub');

  const card = document.createElement('div');
  card.className = 'gx-card';
  card.innerHTML = '<span class="gx-close">✕</span><div class="gx-const"></div><h3></h3><p></p><span class="gx-go">Read this post →</span><a class="gx-link"></a>';
  const cardConst = card.querySelector('.gx-const');
  const cardTitle = card.querySelector('h3');
  const cardLine = card.querySelector('p');
  const cardLink = card.querySelector('.gx-link');
  overlay.appendChild(label);
  overlay.appendChild(card);

  let cardSpec = null;
  const closeCard = () => { card.style.display = 'none'; cardSpec = null; };
  // card body / title → the actual POST; the link → the topic page ("more in this constellation").
  const goPost = () => { if (cardSpec && cardSpec.postUrl) window.location.href = cardSpec.postUrl; };
  const goTopic = () => { if (cardSpec && cardSpec.topicUrl) window.location.href = cardSpec.topicUrl; };
  card.querySelector('.gx-close').addEventListener('click', (e) => { e.stopPropagation(); closeCard(); });
  cardLink.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); goTopic(); });
  card.addEventListener('click', (e) => { if (e.target.closest('.gx-close') || e.target.closest('.gx-link')) return; goPost(); });

  // Let the page (constellation guide) react when focus changes from inside the canvas.
  const emitFocus = () => overlay.dispatchEvent(new CustomEvent('gx-focuschange', { detail: { topic: highlightTopic } }));
  const clearFocus = () => { if (highlightTopic) { highlightTopic = null; emitFocus(); } };

  // shared radial-gradient glow texture (white→transparent) — icon-field stars + bubbles
  const starGlowTex = glowTexture(THREE);

  // ---- ambient field(s): per-theme backdrop motes. Default = drifting stars; Vista = rising
  // bubbles in three size buckets on a gentle current; Atlas = slow sepia dust. ----
  const ambientPal = (env.ambientPal || [PALETTE.marrow, PALETTE.forge, PALETTE.marginalia,
    PALETTE['old-bones'], PALETTE['after-hours'], PALETTE.core, 0xe2e8f0, 0x8aa0b8]).map((c) => new THREE.Color(c));
  const ambientFields = [];   // [{ points, rise }] — rise set ⇒ bubbles (rise+sway), else slow spin
  function makeMotes({ count, size, opacity, map = null, blend = THREE.NormalBlending, rise = null, drift = null }) {
    if (count <= 0) return;
    const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
    const riseArr = rise ? new Float32Array(count) : null;
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 70;
      pos[i * 3 + 1] = (Math.random() - 0.5) * (rise ? 50 : 40);
      pos[i * 3 + 2] = (Math.random() - 0.5) * 34 - 8;
      const c = ambientPal[(Math.random() * ambientPal.length) | 0];
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      if (riseArr) riseArr[i] = rise[0] + Math.random() * (rise[1] - rise[0]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.PointsMaterial({ size, map, vertexColors: true, transparent: true, depthWrite: false, opacity, blending: blend });
    const pts = new THREE.Points(g, m);
    pts.name = 'stars';
    scene.add(pts);
    ambientFields.push({ points: pts, rise: riseArr, drift });
  }
  {
    const k = mobile ? 0.55 : 1, ADD = THREE.AdditiveBlending;
    if (env.ambient === 'bubbles') {              // Vista — rising bubbles, three size buckets
      const b = starGlowTex;
      makeMotes({ count: (420 * k) | 0, size: 0.10, opacity: 0.42, map: b, blend: ADD, rise: [0.7, 1.6] });
      makeMotes({ count: (210 * k) | 0, size: 0.22, opacity: 0.46, map: b, blend: ADD, rise: [1.3, 2.6] });
      makeMotes({ count: (60 * k) | 0,  size: 0.42, opacity: 0.40, map: b, blend: ADD, rise: [2.0, 3.8] });
    } else if (env.ambient === 'marks') {         // Blueprint — drifting draughting crosshairs + node squares
      makeMotes({ count: (240 * k) | 0, size: 0.28, opacity: 0.5, map: markTexture(THREE) });
      makeMotes({ count: (150 * k) | 0, size: 0.18, opacity: 0.42, map: squareTexture(THREE) });
    } else if (env.ambient === 'cells') {         // Atlas — drifting corpuscles (rings) + fine stipple
      makeMotes({ count: (200 * k) | 0, size: 0.34, opacity: 0.42, map: ringTexture(THREE) });
      makeMotes({ count: (320 * k) | 0, size: 0.085, opacity: 0.5 });
    } else if (env.ambient === 'clouds') {        // Daybreak — clouds drifting across the sky
      const c = cloudTexture(THREE);
      makeMotes({ count: (22 * k) | 0, size: 3.4, opacity: 0.55, map: c, drift: { vx: 0.55, vy: 0, sway: 0 } });
      makeMotes({ count: (34 * k) | 0, size: 1.6, opacity: 0.45, map: c, drift: { vx: 0.85, vy: 0, sway: 0 } });
    } else if (env.ambient === 'sand') {          // Dune — blowing sand specks
      makeMotes({ count: (760 * k) | 0, size: 0.07, opacity: 0.5, drift: { vx: 1.7, vy: -0.2, sway: 0.3 } });
    } else if (env.ambient === 'leaves') {        // Rivendell — leaves drifting down
      makeMotes({ count: (120 * k) | 0, size: 0.55, opacity: 0.6, map: leafTexture(THREE), drift: { vx: -0.45, vy: -0.75, sway: 0.5 } });
    } else {                                      // Observatory default — tiny square star points
      makeMotes({ count: (1000 * k) | 0, size: 0.09, opacity: 0.8 });
    }
  }

  // ---- light shafts (Vista): sunlight streaming down through the surface ----
  let rayGroup = null;
  if (env.rays) {
    rayGroup = new THREE.Group();
    const rayTex = shaftTexture(THREE);
    const RAYS = mobile ? 3 : 6;
    for (let i = 0; i < RAYS; i++) {
      const w = 2.4 + Math.random() * 3.8;
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(w, 52),
        new THREE.MeshBasicMaterial({
          map: rayTex, color: new THREE.Color(env.rayColor || 0xaef0ff),
          transparent: true, opacity: 0.1 + Math.random() * 0.08,
          blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
        }));
      mesh.position.set((Math.random() - 0.5) * 64, 12, -16 - Math.random() * 10);
      mesh.rotation.z = (Math.random() - 0.5) * 0.55;
      mesh.userData = { phase: Math.random() * 6.28, baseOp: mesh.material.opacity };
      rayGroup.add(mesh);
    }
    scene.add(rayGroup);
  }

  // ---- landscape backdrop (Dune/Rivendell): a 3D plane sitting low + far in the WORLD, so it
  // parallaxes when the Observatory view is dragged (it used to be a screen-fixed background). ----
  // Landscape (Observatory only): a full-width, bottom-anchored CSS LAYER in the overlay — it can
  // never show edges (unlike a finite 3D billboard) and it parallaxes via transform (no zoom).
  const _lf = new THREE.Vector3(), _lr = new THREE.Vector3();
  let sunSprite = null;
  let landDiv = null;
  if (env.landscape && isSystem) {
    landDiv = document.createElement('div');
    landDiv.className = 'gx-landscape';
    landDiv.setAttribute('aria-hidden', 'true');
    landDiv.style.backgroundImage = `url(${landscapeCanvas(env.landscape).toDataURL()})`;
    overlay.appendChild(landDiv);
  }

  // ---- light-theme sun: a soft warm glow in the sky (additive reads as a sun on a light bg) ----
  if (env.sun) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: starGlowTex, color: new THREE.Color(env.sun.color), transparent: true, opacity: env.sun.opacity ?? 0.6,
      blending: THREE.AdditiveBlending, depthWrite: false }));
    s.scale.setScalar(env.sun.size);
    s.position.set(env.sun.pos[0], env.sun.pos[1], env.sun.pos[2]);
    s.renderOrder = -3;
    scene.add(s);
    sunSprite = s;
  }

  // ---- draughting grid (Blueprint): faint graph backdrop + a receding floor for depth ----
  if (env.grid) {
    const gc = new THREE.Color(env.gridColor || 0x3f7fb0);
    const backdrop = new THREE.GridHelper(140, 70, gc, gc);
    backdrop.material.transparent = true; backdrop.material.opacity = 0.12; backdrop.material.depthWrite = false;
    backdrop.rotation.x = Math.PI / 2; backdrop.position.z = -24;
    scene.add(backdrop);
    const floor = new THREE.GridHelper(140, 70, gc, gc);
    floor.material.transparent = true; floor.material.opacity = 0.07; floor.material.depthWrite = false;
    floor.position.set(0, -16, -6);
    scene.add(floor);
  }

  const pickables = [];
  let sun = null, glowSprite = null;

  // ---- Sun: a small, static, non-interactive logo at the centre ----
  // It is NOT pushed into `pickables` — no hover label, no card, no navigation.
  {
    // Light themes: a bold dark-ink "I" with a coloured heart + very faint glow (high contrast on
    // the light backdrop); a touch bigger. Dark themes keep the near-white glowing monogram.
    sun = sunMonogram(THREE, env.light
      ? { tint: PALETTE.core, heart: PALETTE.marrow, glowColor: PALETTE.forge, lineOpacity: 2.2, glowOpacity: 0.1 }
      : {});
    sun.position.copy(core);
    sun.userData = { spec: SUN_SPEC, kind: 'sun', hover: 0, phase: 0, spawn: 0.3, baseScale: env.light ? 0.64 : 0.5, vis: 1 };
    sun.scale.setScalar(0.0001);
    sun.traverse((o) => { if (o.isSprite && !glowSprite) glowSprite = o; });
    scene.add(sun);
  }

  // ---- drifting icon field (bounded cast streaming the pool) ----
  const exclude = mode === 'hero' ? overlay.querySelector('[data-galaxy-exclude]') : null;

  function excludeNDC() {
    // returns {x0,x1,y0,y1} in NDC for the hero text region, padded; or null
    if (!exclude) return null;
    const cr = canvas.getBoundingClientRect();
    const er = exclude.getBoundingClientRect();
    if (!cr.width || !cr.height) return null;
    const pad = 0.12;
    const x0 = ((er.left - cr.left) / cr.width) * 2 - 1 - pad;
    const x1 = ((er.right - cr.left) / cr.width) * 2 - 1 + pad;
    const y1 = -(((er.top - cr.top) / cr.height) * 2 - 1) + pad;
    const y0 = -(((er.bottom - cr.top) / cr.height) * 2 - 1) - pad;
    return { x0, x1, y0: Math.min(y0, y1), y1: Math.max(y0, y1) };
  }

  const _v = new THREE.Vector3();
  function inExclusion(x, y, z) {
    const ex = excludeNDC();
    if (!ex) return false;
    _v.set(x, y, z).project(camera);
    return _v.x > ex.x0 && _v.x < ex.x1 && _v.y > ex.y0 && _v.y < ex.y1;
  }

  // Depth band. On desktop it's wide (deep parallax field); on mobile it's
  // COMPRESSED so even the farthest icon stays a legible star on a ~390px screen
  // rather than projecting to a sub-pixel point and vanishing for minutes.
  //   near ~-1 (large, line-glyph resolves) → far (tiny but still-visible star).
  const Z_NEAR = -1.5, Z_FAR = mobile ? -24 : -55;
  // glyph-reveal ramp: 0 (pure glow star) far → 1 (wireframe resolved) near.
  // Kept consistent with the band so a glyph still resolves as an icon approaches:
  // onset near the far edge, full by the near third.
  const NEAR_A = mobile ? -16 : -24;   // z at which nearness begins to rise
  const NEAR_SPAN = mobile ? 12 : 15;  // ramp width
  const nearnessOf = (z) => smoothstep((z - NEAR_A) / NEAR_SPAN);
  // far-edge visibility fade-in width (units from Z_FAR). Smaller on mobile so a
  // freshly-spawned far icon reaches full brightness quickly inside the short band.
  const VIS_SPAN = mobile ? 5 : 8;
  const visOf = (z) => smoothstep((z - Z_FAR) / VIS_SPAN) * (1 - smoothstep((z - 1) / 2.5));

  // Glow star sizing. GLOW_SCALE is the sprite's world quad size (perspective
  // shrinks far ones). GLOW_MIN is a floor in *screen pixels* applied per-frame so
  // the farthest icon never collapses to a sub-pixel speck on a small phone.
  const GLOW_SCALE = mobile ? 2.6 : 1.6;
  // min apparent glow diameter (px). Desktop now has a small floor too, so a far icon
  // stays a visible, *hoverable* dot (not a sub-pixel speck) and can grow on hover.
  const GLOW_MIN_PX = mobile ? 26 : 9;

  // Span of the active depth band (positive number of world units).
  const Z_SPAN = Z_NEAR - Z_FAR;
  // Recycle ceiling: how far past Z_FAR an icon may sit before it's pulled back.
  const Z_RECYCLE_FAR = Z_FAR - (mobile ? 2 : 4);
  // Global pace multiplier. The Observatory runs ~3× the hero so icons move and
  // recycle briskly — present far more often than absent (owner's request).
  const SPEED = isSystem ? 3 : 1;

  // Per-icon lifespan (seconds): each icon fades in, drifts, fades out, then
  // respawns elsewhere as (usually) a different post. Short fades + a moderate
  // life keep every icon visible ~85% of its cycle — visible ≫ disappeared.
  function newLife() { return (isSystem ? 7 : 9) + Math.random() * (isSystem ? 8 : 6); }
  // fade envelope over a life: in over FADE s, out over the last FADE s. Longer = gentler.
  const FADE = 1.3;
  function lifeFade(age, life) {
    return smoothstep(age / FADE) * (1 - smoothstep((age - (life - FADE)) / FADE));
  }

  function respawn(u, initial = false) {
    // Pace spread. Few near-still hoverers; most clearly moving. Mobile a touch livelier.
    const hoverer = Math.random() < (mobile ? 0.06 : 0.16);
    const dir = Math.random() < 0.5 ? 1 : -1;
    const sp = hoverer
      ? (mobile ? 0.05 : 0.02) + Math.random() * (mobile ? 0.05 : 0.03)
      : (mobile ? 0.12 : 0.05) + Math.random() * (mobile ? 0.4 : 0.26);
    const zdir = Math.random() < 0.5 ? 1 : -1;
    const zsp = (mobile ? (0.6 + Math.random() * 1.2) : (0.05 + Math.random() * 0.42)) * zdir;
    u.rotSpeed = (0.04 + Math.random() * 0.22) * (Math.random() < 0.5 ? -1 : 1);
    u.orbW = (0.006 + Math.random() * 0.024) * (Math.random() < 0.4 ? -1 : 1);
    u.wobAmp = 0.18 + Math.random() * 0.55;
    u.phase = Math.random() * Math.PI * 2;
    u.life = newLife();
    // initial: desync ages so they don't all fade together; recycle: start fresh.
    u.age = initial ? Math.random() * u.life * 0.7 : 0;
    for (let tries = 0; tries < 6; tries++) {
      // Spawn ANYWHERE across the frame at a varied depth — biased toward near/mid
      // (pow>1) so icons appear spread over the whole viewport, never bunched at the
      // far vanishing point. screen position (sx,sy) → world coords at depth z.
      const fz = Math.pow(Math.random(), 1.7);
      const z = Z_NEAR - (0.05 + fz * 0.9) * Z_SPAN;
      let sx, sy;
      if (highlightTopic && u.spec && u.spec.topic === highlightTopic) {
        sx = (Math.random() * 2 - 1) * 0.42;          // focused topic respawns central, then gathers + hovers
        sy = (Math.random() * 2 - 1) * 0.42;
      } else {
        sx = (Math.random() * 2 - 1) * 0.94;          // everything else flows as normal
        sy = (Math.random() * 2 - 1) * 0.94;
      }
      u.lin.set(sx * halfW(z), sy * halfH(z), z);
      // some drift toward the camera, some recede — a live near↔far mix everywhere.
      const zToward = Math.random() < 0.5 ? Math.abs(zsp) : zsp;
      u.vel.set(dir * sp, (Math.random() - 0.5) * sp, zToward);
      if (!inExclusion(u.lin.x, u.lin.y, u.lin.z)) break;
    }
  }

  // pool streaming: keep on-screen comets showing distinct posts
  const activeIdx = new Set();
  let cursor = 0;
  function takeNextIndex(prev) {
    if (typeof prev === 'number') activeIdx.delete(prev);
    if (items.length === 0) return -1;
    for (let n = 0; n < items.length; n++) {
      const idx = (cursor + n) % items.length;
      if (!activeIdx.has(idx)) { cursor = (idx + 1) % items.length; activeIdx.add(idx); return idx; }
    }
    return prev ?? 0; // pool smaller than cast — allow repeat
  }

  // a post icon leads to its TOPIC page (/c/<topic>/), not the individual post.
  // p.url is already base-prefixed (built in lib/galaxy/data.js); the fallback
  // base-prefixes too so a Pages sub-path deploy navigates correctly.
  function topicUrl(slug) {
    const p = planetsData.find((x) => x.slug === slug);
    if (p && p.url) return p.url;
    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    return base + '/c/' + slug + '/';
  }
  function postSpec(item) {
    const topic = item.topic;
    return {
      kind: 'post', name: item.title, sub: planetName(topic), col: PALETTE[topic] || PALETTE.forge,
      title: item.title, line: null, link: 'More in ' + planetName(topic) + ' →',
      postUrl: item.url, topicUrl: topicUrl(topic), topic,
    };
  }
  function planetName(slug) {
    const p = planetsData.find((x) => x.slug === slug);
    return p ? p.name : slug;
  }

  // Per-post icon colour: start from the post's accent (or its topic colour), then
  // apply a small DETERMINISTIC hue/lightness jitter from the title — so repeated
  // glyph shapes still read as distinct stars (owner asked for more colour variety).
  // Returns a hex number (matches PALETTE/ACCENTS so glyph builders + sprites accept it).
  function iconColor(item) {
    const c = new THREE.Color(item.accent || PALETTE[item.topic] || PALETTE.forge);
    const s = item.title || ''; let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    const hsl = { h: 0, s: 0, l: 0 }; c.getHSL(hsl);
    hsl.h = (hsl.h + (((h % 1000) / 1000) - 0.5) * 0.14 + 1) % 1;                          // ±0.07 hue
    hsl.l = Math.min(0.82, Math.max(0.42, hsl.l + ((((h >>> 10) % 1000) / 1000) - 0.5) * 0.2));
    c.setHSL(hsl.h, hsl.s, hsl.l);
    return c.getHex();
  }

  function buildGlyphFor(item) {
    const topic = item.topic;
    const c1 = iconColor(item);
    const c2 = ACCENTS[topic] || ACCENTS.forge;
    if (item.type !== 'model') {
      // icon/image renderers not yet implemented — fall back to topic-default model.
      // (No current post uses these types; data layer validates them.)
      // eslint-disable-next-line no-console
      if (typeof console !== 'undefined') console.info(`[galaxy] ${item.type} object type falls back to model glyph for "${item.title}"`);
    }
    // A non-default theme overrides the post's content glyph with its themed silhouette
    // for the topic (sea life / anatomy / drawing-office parts); default keeps the post glyph.
    const builder = (themeId && resolveThemeGlyph(themeId, topic))
      || resolveGlyph(item.type === 'model' ? item.ref : null, topic);
    return builder ? builder(THREE, c1, c2) : null;
  }

  // each icon = a topic-tinted glow Sprite (always a star) + a wireframe glyph
  // child that only resolves as the icon nears the camera.
  function makeGlowSprite(item) {
    // Light themes: a soft DARK dot (normal blend) instead of an additive glow (which vanishes
    // on light). Dark themes keep the additive glow-star.
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: starGlowTex, color: iconColor(item), transparent: true, opacity: env.light ? 0.7 : 0.95,
      blending: env.light ? THREE.NormalBlending : THREE.AdditiveBlending, depthWrite: false }));
    // a modest fixed world scale — perspective makes far ones tiny points and
    // near ones a slightly bigger glow, but it never reads as a slab.
    // World scale of the glow quad. Bigger on mobile so the farthest icon in the
    // compressed band still renders as a clearly-visible star (not a sub-pixel
    // point) on a ~390px @2-3x screen — see GLOW_MIN floor in step().
    sprite.scale.setScalar(GLOW_SCALE * (env.light ? 1.3 : 1));   // light: a slightly bigger soft DARK backing dot → gives the thin dark-ink glyph weight
    sprite.name = 'gx-glow';
    return sprite;
  }

  const comets = [];
  if (items.length > 0) {
    const cap = mode === 'hero' ? (mobile ? 3 : 6) : (mobile ? 14 : 26);
    const cast = Math.min(cap, items.length);
    for (let i = 0; i < cast; i++) {
      const idx = takeNextIndex(undefined);
      const item = items[idx];
      const glyph = buildGlyphFor(item);
      if (!glyph) { activeIdx.delete(idx); continue; }
      glyph.name = 'gx-glyph';
      const comet = new THREE.Group(); // container spins; glyph child keeps its base tilt
      comet.add(glyph);
      const glow = makeGlowSprite(item);
      comet.add(glow);
      comet.userData = {
        spec: postSpec(item), kind: 'post', hover: 0, spawn: (isSystem ? 1.6 : 0.6) + i * 0.18,
        baseScale: (isSystem ? 0.5 : 0.6) * (env.light ? 1.2 : 1), lin: new THREE.Vector3(), vel: new THREE.Vector3(),
        vis: 1, rotSpeed: 0.1, orbW: 0.02, wobAmp: 0.3, phase: 0, itemIndex: idx,
        glyph, glow, nearness: 0, spawnIdx: i, castN: cast,
      };
      respawn(comet.userData, true);
      comet.position.copy(comet.userData.lin);
      comet.scale.setScalar(0.0001);
      scene.add(comet);
      pickables.push(comet);
      comets.push(comet);
    }
  }

  function recycleComet(obj) {
    const u = obj.userData;
    const nextIdx = takeNextIndex(u.itemIndex);
    if (nextIdx >= 0 && nextIdx !== u.itemIndex) {
      const item = items[nextIdx];
      // swap ONLY the glyph child (keep + retint the persistent glow sprite)
      if (u.glyph) {
        obj.remove(u.glyph);
        u.glyph.traverse?.((o) => { o.geometry?.dispose?.(); if (o.material) disposeMat(o.material); });
      }
      const fresh = buildGlyphFor(item);
      if (fresh) { fresh.name = 'gx-glyph'; obj.add(fresh); }
      u.glyph = fresh || null;
      if (u.glow) u.glow.material.color.setHex(iconColor(item));
      u.spec = postSpec(item);
      u.itemIndex = nextIdx;
    }
    respawn(u, false);
  }

  // ---- interaction ----
  const ray = new THREE.Raycaster();
  ray.params.Points.threshold = 0.4;
  const pointer = new THREE.Vector2(0, 0);
  let hovered = null;
  let pointerInside = false;
  const touch = window.matchMedia('(hover: none)').matches;

  function setPointerFromEvent(e) {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    return inside;
  }

  function pick() {
    ray.setFromCamera(pointer, camera);
    const hits = ray.intersectObjects(pickables, true);
    let hit = null;
    if (hits.length) { hit = hits[0].object; while (hit.parent && !hit.userData.spec) hit = hit.parent; }
    return hit && hit.userData && hit.userData.spec ? hit : null;
  }

  function onPointerMove(e) {
    pointerInside = setPointerFromEvent(e);
    if (touch) return; // hover only for fine pointers
    if (reduced) { hovered = pointerInside ? pick() : null; updateLabel(); renderOnce(); }
  }

  function showCardAt(obj, clientX, clientY) {
    const s = obj.userData.spec;
    cardSpec = s;
    cardConst.textContent = s.sub; // topic name (context for the post title below)
    cardConst.style.color = hex(s.col);
    cardTitle.textContent = s.title;
    if (s.line) { cardLine.textContent = s.line; cardLine.style.display = ''; } else { cardLine.style.display = 'none'; }
    if (s.link) { cardLink.textContent = s.link; cardLink.style.display = ''; } else { cardLink.style.display = 'none'; }
    card.style.display = 'block';
    const r = canvas.getBoundingClientRect();
    const x = clientX != null ? clientX - r.left : (r.width / 2);
    const y = clientY != null ? clientY - r.top : (r.height / 2);
    // Open the card AWAY from the icon and away from the top-right legend: if the
    // icon is in the right ~45% (where the legend lives on desktop), open leftward;
    // otherwise rightward. Clamp to the canvas. Card is 280px wide; ~210px tall.
    const cw = 280, ch = card.offsetHeight || 210;
    const openLeft = x > r.width * 0.55;
    const left = openLeft ? (x - cw - 18) : (x + 18);
    card.style.left = Math.min(Math.max(left, 8), r.width - cw - 8) + 'px';
    card.style.top = Math.min(Math.max(y - 20, 8), Math.max(8, r.height - ch - 8)) + 'px';
  }

  function onClick(e) {
    if (isSystem && dMoved > 7) { dMoved = 0; return; } // was a drag-to-orbit, not a tap
    const t = e.target;
    if (t && typeof t.closest === 'function') {
      if (t.closest('.gx-card')) return;
      // never hijack clicks on real UI sitting over the canvas (CTAs, nav, links)
      if (t.closest('a, button')) return;
    }
    const inside = setPointerFromEvent(e);
    if (!inside) { closeCard(); clearFocus(); return; }
    const hit = pick();
    if (hit) {
      if (touch) hovered = hit; // touch: tap also drives the label
      showCardAt(hit, e.clientX, e.clientY);
      if (reduced) { updateLabel(); renderOnce(); }
    } else {
      // tap on empty space: dismiss the card AND release any constellation focus
      closeCard();
      clearFocus();
      if (touch) { hovered = null; if (reduced) { updateLabel(); renderOnce(); } }
    }
  }

  canvas.style.cursor = 'default';
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('click', onClick);

  // ---- drag to orbit (system / Observatory only; not in reduced motion) ----
  // touch-action:pan-y lets the page scroll vertically natively while we own the
  // horizontal gesture for azimuth. Mouse drag also tilts (polar). A drag past a
  // few px suppresses the subsequent click so orbiting never navigates.
  const DRAG_K = 0.005;
  let dragId = null, dStartX = 0, dStartY = 0, dLastX = 0, dLastY = 0, dDecided = false, dActive = false, dMoved = 0;
  function onDragStart(e) {
    if (e.target && e.target.closest && e.target.closest('.gx-card, a, button')) return;
    dragId = e.pointerId; dStartX = dLastX = e.clientX; dStartY = dLastY = e.clientY;
    dDecided = false; dActive = false; dMoved = 0;
    if (e.pointerType === 'mouse') { dDecided = true; dActive = true; }
  }
  function onDragMove(e) {
    if (dragId === null || e.pointerId !== dragId) return;
    const tdx = e.clientX - dStartX, tdy = e.clientY - dStartY;
    dMoved = Math.max(dMoved, Math.hypot(tdx, tdy));
    if (!dDecided) {
      if (dMoved < 7) return;
      // horizontal-dominant → orbit; otherwise let the page scroll (pan-y)
      if (Math.abs(tdx) > Math.abs(tdy)) { dDecided = true; dActive = true; }
      else { dDecided = true; dActive = false; dragId = null; return; }
    }
    if (!dActive) return;
    const dx = e.clientX - dLastX, dy = e.clientY - dLastY;
    orbit.taz = clampN(orbit.taz - dx * DRAG_K, -AZ_MAX, AZ_MAX);
    if (e.pointerType === 'mouse') orbit.tpol = clampN(orbit.tpol + dy * DRAG_K, -POL_MAX, POL_MAX);
    orbit.vaz = -dx * DRAG_K; orbit.vpol = e.pointerType === 'mouse' ? dy * DRAG_K : 0;
    orbit.dragging = true;
    dLastX = e.clientX; dLastY = e.clientY;
    lastInteract = clock.elapsedTime;
    if (e.cancelable && e.pointerType === 'mouse') e.preventDefault();
  }
  function onDragEnd(e) {
    if (dragId !== null && e.pointerId === dragId) { dragId = null; orbit.dragging = false; }
  }
  if (isSystem && !reduced) {
    canvas.style.touchAction = 'pan-y';
    canvas.style.cursor = 'grab';
    canvas.addEventListener('pointerdown', onDragStart);
    window.addEventListener('pointermove', onDragMove, { passive: true });
    window.addEventListener('pointerup', onDragEnd, { passive: true });
    window.addEventListener('pointercancel', onDragEnd, { passive: true });
  }

  function updateLabel() {
    if (hovered) {
      const r = canvas.getBoundingClientRect();
      const v = hovered.position.clone().project(camera);
      label.style.display = 'block';
      label.style.left = ((v.x * 0.5 + 0.5) * r.width + 14) + 'px';
      label.style.top = ((-v.y * 0.5 + 0.5) * r.height - 14) + 'px';
      labelName.textContent = hovered.userData.spec.name;
      labelSub.textContent = '· ' + hovered.userData.spec.sub;
      labelSub.style.color = hex(hovered.userData.spec.col);
    } else {
      label.style.display = 'none';
    }
  }

  // ---- resize ----
  function resize() {
    const w = canvas.clientWidth || canvas.offsetWidth || window.innerWidth;
    const h = canvas.clientHeight || canvas.offsetHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (reduced) renderOnce();
  }
  // Coalesce resize work to one run per frame — iOS address-bar show/hide
  // during scroll fires ResizeObserver rapidly.
  let resizeRaf = 0;
  const ro = new ResizeObserver(() => {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => { resizeRaf = 0; resize(); });
  });
  ro.observe(canvas);

  // ---- focus (legend → briefly highlight that topic's drifting icons) ----
  // Planets are gone, so there's no body to fly to; instead we flag a topic and
  // the per-frame loop gives its icons a brightness + slight scale boost.
  // Persistent topic focus (toggle): the chosen topic's icons brighten and drift toward
  // the centre as they recycle, while the rest dim and move to the periphery. Returns the
  // new active topic (or null) so the guide can mark the active row.
  function focusPlanet(slug) {
    highlightTopic = (highlightTopic === slug) ? null : slug;
    return highlightTopic;
  }

  // Min-apparent-size floor for glow stars. The sprite's own scale is GLOW_SCALE;
  // the parent group scale (cScale) + perspective shrink it with depth. If the
  // projected diameter would drop below GLOW_MIN_PX we bump the sprite's local
  // scale to compensate, so the farthest icon never collapses to a sub-pixel speck.
  function applyGlowFloor(glow, cScale, z, hover) {
    const hb = 1 + (hover || 0) * 0.8;                // grow the glow on hover too
    if (!GLOW_MIN_PX) { const t = GLOW_SCALE * hb; if (Math.abs(glow.scale.x - t) > 1e-3) glow.scale.setScalar(t); return; }
    const H = canvas.clientHeight || canvas.offsetHeight || window.innerHeight || 800;
    const worldPerPx = (2 * halfH(z)) / H;          // world units per screen pixel at depth z
    const minWorld = GLOW_MIN_PX * worldPerPx;        // min glow diameter in world units
    const denom = Math.max(cScale, 1e-4);
    const need = minWorld / denom;                    // sprite local scale to hit the floor
    const s = Math.max(GLOW_SCALE, need) * hb;
    if (Math.abs(glow.scale.x - s) > 1e-3) glow.scale.setScalar(s);
  }

  // ---- animation ----
  const clock = new THREE.Clock();
  const rot = new THREE.Matrix4();
  let elapsed = 0;
  let raf = 0;
  let running = false;

  function step() {
    const dt = Math.min(clock.getDelta(), 0.1);
    elapsed += dt;
    const tReal = clock.elapsedTime;

    if (!touch && pointerInside) { hovered = pick(); }
    canvas.style.cursor = hovered ? 'pointer' : (isSystem ? (orbit.dragging ? 'grabbing' : 'grab') : 'default');

    // Sun: a static logo with a gentle rotation + born ramp + breath (not picked).
    if (sun) {
      const su = sun.userData;
      const sBorn = smoothstep((tReal - su.spawn) / 1.2);
      const sBreath = 1 + Math.sin(elapsed * 0.9 + su.phase) * 0.04;
      sun.scale.setScalar(su.baseScale * sBorn * sBreath);
      sun.rotation.y += dt * 0.1;
    }

    const highlightActive = !!highlightTopic;

    pickables.forEach((obj) => {
      const u = obj.userData; // pickables are all posts now
      const born = smoothstep((tReal - u.spawn) / 1.2);
      const freeze = 1 - u.hover;

      // lifespan: age, then fade out + respawn elsewhere (brisk turnover). Hover pauses ageing.
      u.age += dt * freeze;
      if (u.age >= u.life) { recycleComet(obj); return; }
      const lf = lifeFade(u.age, u.life);

      // Focus: the chosen topic's posts gather near the core and HOVER there (drift &
      // spin nearly stilled, eased toward a central anchor); every other icon keeps
      // flowing exactly as before. No dimming.
      const matchTopic = highlightActive && u.spec.topic === highlightTopic;
      const driftK = matchTopic ? 0.07 : 1;
      u.lin.addScaledVector(u.vel, dt * freeze * SPEED * driftK);
      const ang = u.orbW * dt * freeze * SPEED * driftK;
      u.lin.sub(core).applyMatrix4(rot.makeRotationZ(ang)).add(core);
      if (matchTopic) {
        if (!u.anchor) u.anchor = new THREE.Vector3(
          core.x + (Math.random() * 2 - 1) * 5,
          core.y + (Math.random() * 2 - 1) * 3.4,
          core.z + (Math.random() * 2 - 1) * 2.4);
        u.lin.lerp(u.anchor, Math.min(dt * 0.9, 1));   // ease toward a central hover spot
      } else if (u.anchor) { u.anchor = null; }         // focus cleared → resume normal drift
      obj.position.set(
        u.lin.x + Math.sin(elapsed * 0.25 + u.phase) * u.wobAmp,
        u.lin.y + Math.cos(elapsed * 0.2 + u.phase * 1.3) * u.wobAmp * 0.7,
        u.lin.z);
      // fade in from the far edge, out as it overshoots the camera
      u.vis = visOf(u.lin.z);
      // proximity: 0 far (pure glow star) → 1 near (wireframe glyph resolved)
      u.nearness = nearnessOf(u.lin.z);
      // recycle when out of bounds (skip gathered icons — they live near the core)
      const hw = halfW(u.lin.z) + 3, hh = halfH(u.lin.z) + 2.5;
      if (!matchTopic && (Math.abs(u.lin.x) > hw || Math.abs(u.lin.y) > hh || u.lin.z > 3.5 || u.lin.z < Z_RECYCLE_FAR)) recycleComet(obj);
      obj.rotation.y += dt * u.rotSpeed * (matchTopic ? 0.3 : 1);

      // a gentle brighten/enlarge for the focused topic (reuses the hover boost)
      const lit = (obj === hovered ? 1 : 0) + (matchTopic ? 1 : 0);
      u.hover += (Math.min(lit, 1) - u.hover) * Math.min(dt * 8, 1);

      const breath = 1 + Math.sin(elapsed * 0.9 + u.phase) * 0.04;
      // hover boost is larger for FAR icons (low nearness) so a distant dot visibly
      // enlarges when the pointer is on it, while near glyphs grow more modestly.
      const cScale = u.baseScale * born * breath * (1 + u.hover * (0.4 + (1 - u.nearness) * 0.7));
      // base scale stays modest; perspective + wide z give the star→glyph range.
      obj.scale.setScalar(cScale);

      // glow sprite: always a bright star, tinted per-post; fades with vis + born; grows on hover.
      if (u.glow) {
        u.glow.material.opacity = Math.min(0.95 * born * u.vis * lf * (1 + u.hover * 0.6), 1);
        applyGlowFloor(u.glow, cScale, u.lin.z, u.hover);
      }
      // wireframe glyph: opacity + presence ramp with proximity (far = pure glow).
      if (u.glyph) {
        u.glyph.visible = (u.nearness > 0.02 || u.hover > 0.02) && lf > 0.02;
        u.glyph.traverse((m) => {
          if (m.material && !m.isSprite) {
            const base = (m.material.userData.o ?? (m.material.userData.o = m.material.opacity));
            m.material.opacity = Math.min(base * (env.light ? 1.7 : 1) * u.nearness * (1 + u.hover * 0.8) * u.vis * lf, 1);
          }
        });
      }
    });

    if (glowSprite) glowSprite.material.opacity = (env.light ? 0.1 : 0.32) + Math.sin(elapsed * 0.5) * (env.light ? 0.03 : 0.07);

    updateLabel();

    // camera: Observatory = drag-to-orbit around the fixed centre logo (bounded
    // ~270°); hero = gentle pointer parallax behind the masthead.
    if (isSystem) {
      if (!orbit.dragging) {                       // release inertia, then settle
        orbit.taz = clampN(orbit.taz + orbit.vaz, -AZ_MAX, AZ_MAX);
        orbit.tpol = clampN(orbit.tpol + orbit.vpol, -POL_MAX, POL_MAX);
        orbit.vaz *= 0.92; orbit.vpol *= 0.92;
        if (Math.abs(orbit.vaz) < 1e-4) orbit.vaz = 0;
        if (Math.abs(orbit.vpol) < 1e-4) orbit.vpol = 0;
      }
      const k = Math.min(dt * 6, 1);
      orbit.az += (orbit.taz - orbit.az) * k;
      orbit.pol += (orbit.tpol - orbit.pol) * k;
      placeOrbitCamera(tReal);
    } else {
      const tx = pointer.x * 0.9, ty = pointer.y * 0.5;
      camera.position.x += (tx - camera.position.x) * 0.03;
      camera.position.y += (ty - camera.position.y) * 0.03;
      camera.lookAt(0, 0, -2);
    }

    // landscape: keep each layer a fixed horizontal distance ahead of the camera at a fixed world
    // height — constant apparent size (no zoom), drops/rises with up-down look, gentle side parallax.
    // sun: keep it high in the sky ahead of the camera (camera-relative, gentle drift — never swings off)
    if (sunSprite) {
      _lf.set(0, 0, -1).applyQuaternion(camera.quaternion); _lf.y = 0; _lf.normalize();
      _lr.set(1, 0, 0).applyQuaternion(camera.quaternion); _lr.y = 0; _lr.normalize();
      const az = isSystem ? orbit.az : pointer.x * 0.4;
      sunSprite.position.set(
        camera.position.x + _lf.x * 104 - _lr.x * az * 2.5,
        env.sun.pos[1],
        camera.position.z + _lf.z * 104 - _lr.z * az * 2.5);
    }
    // landscape layer: gentle parallax — sideways with azimuth, vertical with up/down look
    if (landDiv) {
      landDiv.style.transform = `translate3d(${(-orbit.az * 3).toFixed(2)}%, ${(orbit.pol * 6).toFixed(2)}%, 0)`;
    }

    for (const f of ambientFields) {
      if (f.rise) {
        const p = f.points.geometry.attributes.position, a = p.array;
        for (let i = 0, n = a.length / 3; i < n; i++) {
          a[i * 3 + 1] += f.rise[i] * dt;                               // rise toward the surface
          a[i * 3] += Math.sin(elapsed * 0.7 + i * 1.3) * dt * 0.3;     // sway on a gentle current
          if (a[i * 3 + 1] > 25) { a[i * 3 + 1] = -25; a[i * 3] = (Math.random() - 0.5) * 70; }
        }
        p.needsUpdate = true;
      } else if (f.drift) {
        const p = f.points.geometry.attributes.position, a = p.array, d = f.drift;
        for (let i = 0, n = a.length / 3; i < n; i++) {
          a[i * 3] += d.vx * dt + (d.sway ? Math.sin(elapsed * 0.6 + i) * dt * d.sway : 0);
          a[i * 3 + 1] += d.vy * dt;
          if (a[i * 3] > 38) a[i * 3] = -38; else if (a[i * 3] < -38) a[i * 3] = 38;
          if (a[i * 3 + 1] > 24) a[i * 3 + 1] = -24; else if (a[i * 3 + 1] < -24) a[i * 3 + 1] = 24;
        }
        p.needsUpdate = true;
      } else {
        f.points.rotation.z = elapsed * 0.004;
      }
    }
    if (rayGroup) {
      for (const m of rayGroup.children) {
        const u = m.userData;
        m.material.opacity = u.baseOp * (0.55 + 0.45 * (0.5 + 0.5 * Math.sin(elapsed * 0.4 + u.phase)));
        m.position.x += Math.sin(elapsed * 0.13 + u.phase) * dt * 0.12;   // slow shimmer drift
      }
    }

    renderer.render(scene, camera);
  }

  function loop() { if (!running) return; step(); raf = requestAnimationFrame(loop); }
  function start() { if (running || reduced) return; running = true; clock.getDelta(); loop(); }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

  function renderOnce() {
    // reduced-motion / paused single frame: place icons at their lin, glow on,
    // glyphs at their proximity opacity, then draw a single legible frame.
    if (sun) sun.scale.setScalar(sun.userData.baseScale);
    pickables.forEach((obj) => {
      const u = obj.userData; // posts only
      obj.position.copy(u.lin);
      u.hover += ((obj === hovered ? 1 : 0) - u.hover) * 0.5;
      u.vis = visOf(u.lin.z);
      u.nearness = nearnessOf(u.lin.z);
      const cScale = u.baseScale * (1 + u.hover * 0.15);
      obj.scale.setScalar(cScale);
      if (u.glow) { u.glow.material.opacity = Math.min(0.95 * u.vis * (1 + u.hover * 0.5), 1); applyGlowFloor(u.glow, cScale, u.lin.z); }
      if (u.glyph) {
        u.glyph.visible = u.nearness > 0.02 || u.hover > 0.02;
        u.glyph.traverse((m) => {
          if (m.material && !m.isSprite) {
            const base = (m.material.userData.o ?? (m.material.userData.o = m.material.opacity));
            m.material.opacity = Math.min(base * (env.light ? 1.7 : 1) * u.nearness * (1 + u.hover * 0.8) * u.vis, 1);
          }
        });
      }
    });
    if (isSystem) placeOrbitCamera(0); else camera.lookAt(0, 0, -2);
    renderer.render(scene, camera);
  }

  // ---- visibility / off-screen pause ----
  function onVisibility() { if (document.hidden) stop(); else if (io_visible) start(); }
  let io_visible = true;
  const io = new IntersectionObserver((entries) => {
    io_visible = entries[0].isIntersecting;
    if (io_visible && !document.hidden) start(); else stop();
  }, { threshold: 0.01 });
  io.observe(canvas);
  document.addEventListener('visibilitychange', onVisibility);

  // ---- boot ----
  resize();
  if (reduced) renderOnce(); else start();

  // ---- dispose ----
  function disposeMat(mat) {
    (Array.isArray(mat) ? mat : [mat]).forEach((m) => { m.map?.dispose?.(); m.dispose?.(); });
  }
  let disposed = false;
  function dispose() {
    if (disposed) return;
    disposed = true;
    stop();
    io.disconnect();
    ro.disconnect();
    if (resizeRaf) { cancelAnimationFrame(resizeRaf); resizeRaf = 0; }
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('click', onClick);
    if (isSystem && !reduced) {
      canvas.removeEventListener('pointerdown', onDragStart);
      window.removeEventListener('pointermove', onDragMove);
      window.removeEventListener('pointerup', onDragEnd);
      window.removeEventListener('pointercancel', onDragEnd);
    }
    scene.traverse((o) => { o.geometry?.dispose?.(); if (o.material) disposeMat(o.material); });
    starGlowTex.dispose?.(); // shared glow texture (idempotent even if a sprite already disposed it)
    renderer.dispose();
    label.remove();
    card.remove();
  }

  return { dispose, focusPlanet };
}
