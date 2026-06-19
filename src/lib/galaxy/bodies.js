import { wire, glowTexture } from './wire.js';
import { PALETTE } from './palette.js';

export function sunMonogram(THREE, opts = {}) {
  const g = new THREE.Group();
  // The "I" — near-white with a cyan heart on the dark themes; on LIGHT themes a bold dark-ink
  // monogram (high contrast) with a coloured heart and a much fainter glow.
  const TINT = opts.tint ?? 0xd6eef2;
  const HEART = opts.heart ?? 0x7fe3ef;
  const lo = opts.lineOpacity ?? 1;            // line-opacity multiplier
  const glowOpacity = opts.glowOpacity ?? 0.32;
  const shaft = wire(THREE, new THREE.OctahedronGeometry(0.5, 1), TINT, Math.min(1, 0.45 * lo));
  shaft.scale.set(0.62, 2.1, 0.62); g.add(shaft);
  const serifTop = wire(THREE, new THREE.BoxGeometry(1.05, 0.13, 0.42, 3, 1, 2), TINT, Math.min(1, 0.55 * lo));
  serifTop.position.y = 1.28; g.add(serifTop);
  const serifBot = wire(THREE, new THREE.BoxGeometry(1.05, 0.13, 0.42, 3, 1, 2), TINT, Math.min(1, 0.55 * lo));
  serifBot.position.y = -1.28; g.add(serifBot);
  g.add(wire(THREE, new THREE.IcosahedronGeometry(0.16, 0), HEART, 0.9));
  const tex = glowTexture(THREE);
  const glow1 = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, color: opts.glowColor ?? PALETTE.marrow, transparent: true, opacity: glowOpacity,
    blending: THREE.AdditiveBlending, depthWrite: false }));
  glow1.scale.setScalar(7); glow1.name = 'glow1';
  const glow2 = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, color: opts.glowColor ?? 0xffffff, transparent: true, opacity: glowOpacity * 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false }));
  glow2.scale.setScalar(3.4);
  g.add(glow1, glow2);
  return g;
}

export function nebulaCloud(THREE) {
  const g = new THREE.Group();
  const N = 420, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const palette = [PALETTE.marginalia, PALETTE.marrow, 0xc4b5fd, 0xffffff, PALETTE['after-hours']].map(c => new THREE.Color(c));
  for (let i = 0; i < N; i++) {
    const r = Math.pow(Math.random(), 0.55) * 1.9;
    const a = Math.random() * Math.PI * 2, b = (Math.random() - 0.5) * Math.PI;
    pos[i * 3]     = Math.cos(a) * Math.cos(b) * r * 1.35;
    pos[i * 3 + 1] = Math.sin(b) * r * 0.7;
    pos[i * 3 + 2] = Math.sin(a) * Math.cos(b) * r;
    const c = palette[(Math.random() * palette.length) | 0];
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.add(new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.085, vertexColors: true, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false })));
  for (let i = 0; i < 5; i++) {
    const s = wire(THREE, new THREE.OctahedronGeometry(0.09), 0xffffff, 0.9);
    s.position.set((Math.random() - 0.5) * 2.2, (Math.random() - 0.5) * 1.1, (Math.random() - 0.5) * 1.6);
    g.add(s);
  }
  return g;
}

// ---------- planet builders (one per topic) ----------

function planetMarrow(THREE) { // teal, with a small moon
  const g = new THREE.Group();
  g.add(wire(THREE, new THREE.SphereGeometry(0.55, 12, 9), PALETTE.marrow, 0.6));
  const moon = wire(THREE, new THREE.SphereGeometry(0.11, 6, 5), 0x5eead4, 0.7);
  moon.position.set(0.95, 0.25, 0); g.add(moon);
  return g;
}

function planetForge(THREE) { // cyan, ringed
  const g = new THREE.Group();
  g.add(wire(THREE, new THREE.SphereGeometry(0.48, 9, 7), PALETTE.forge, 0.6));
  const ring = wire(THREE, new THREE.TorusGeometry(0.78, 0.025, 4, 26), 0x67e8f9, 0.5);
  ring.rotation.x = 1.25; g.add(ring);
  return g;
}

function planetOldBones(THREE) { // amber, craggy
  const g = new THREE.Group();
  g.add(wire(THREE, new THREE.IcosahedronGeometry(0.52, 1), PALETTE['old-bones'], 0.55));
  return g;
}

function planetMarginalia(THREE) { // violet, twin moons
  const g = new THREE.Group();
  g.add(wire(THREE, new THREE.SphereGeometry(0.5, 10, 8), PALETTE.marginalia, 0.6));
  for (const [x, y] of [[0.85, 0.3], [-0.8, -0.35]]) {
    const m = wire(THREE, new THREE.SphereGeometry(0.09, 6, 5), 0xc4b5fd, 0.7);
    m.position.set(x, y, 0); g.add(m);
  }
  return g;
}

function planetAfterHours(THREE) { // magenta, tilted ring
  const g = new THREE.Group();
  g.add(wire(THREE, new THREE.SphereGeometry(0.46, 9, 7), PALETTE['after-hours'], 0.6));
  const ring = wire(THREE, new THREE.TorusGeometry(0.72, 0.02, 4, 26), 0xf9a8d4, 0.5);
  ring.rotation.x = 0.6; ring.rotation.z = 0.5; g.add(ring);
  return g;
}

function planetAtlas(THREE) { // ember orange, dense lat-long grid like a globe
  const g = new THREE.Group();
  g.add(wire(THREE, new THREE.SphereGeometry(0.55, 14, 11), PALETTE.atlas, 0.55));
  return g;
}

export const PLANET_BUILDERS = {
  marrow: planetMarrow, forge: planetForge, 'old-bones': planetOldBones,
  marginalia: planetMarginalia, 'after-hours': planetAfterHours, atlas: planetAtlas,
};
