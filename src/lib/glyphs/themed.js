// Per-theme glyph shapes for the Observatory. When a non-default site theme is active the
// drifting post objects swap to a themed silhouette set (Vista = sea life, Atlas = anatomy,
// Blueprint = drawing-office parts) so each theme is a distinct WORLD, not just a recolour.
// Same builder contract as the other glyphs: (THREE, c1, c2) => THREE.Group of wire() meshes.
import { wire } from '../galaxy/wire.js';

/* ───────────────────────── Vista — sea life ───────────────────────── */

export function fish(THREE, c1, c2) {
  const g = new THREE.Group();
  const body = wire(THREE, new THREE.SphereGeometry(0.5, 10, 7), c1, 0.5);
  body.scale.set(1.5, 0.85, 0.7); g.add(body);
  const tail = wire(THREE, new THREE.ConeGeometry(0.42, 0.6, 4), c2, 0.6);
  tail.position.set(-1, 0, 0); tail.rotation.z = Math.PI / 2; tail.scale.set(1, 1, 0.35); g.add(tail);
  const dorsal = wire(THREE, new THREE.ConeGeometry(0.26, 0.5, 4), c2, 0.55);
  dorsal.position.set(0.05, 0.45, 0); dorsal.scale.set(1, 1, 0.3); g.add(dorsal);
  return g;
}

export function jellyfish(THREE, c1, c2) {
  const g = new THREE.Group();
  const bell = wire(THREE, new THREE.SphereGeometry(0.6, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), c1, 0.5);
  bell.scale.set(1, 0.85, 1); g.add(bell);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const t = wire(THREE, new THREE.CylinderGeometry(0.015, 0.015, 0.9, 4), c2, 0.5);
    t.position.set(Math.cos(a) * 0.34, -0.5, Math.sin(a) * 0.34);
    g.add(t);
  }
  return g;
}

export function shell(THREE, c1, c2) {
  const g = new THREE.Group();
  g.add(wire(THREE, new THREE.ConeGeometry(0.6, 1.0, 9, 3), c1, 0.5));
  for (let i = 0; i < 3; i++) {
    const ring = wire(THREE, new THREE.TorusGeometry(0.5 - i * 0.14, 0.04, 5, 12), c2, 0.5);
    ring.position.y = -0.3 + i * 0.3; ring.rotation.x = Math.PI / 2; g.add(ring);
  }
  return g;
}

export function urchin(THREE, c1, c2) {
  const g = new THREE.Group();
  g.add(wire(THREE, new THREE.IcosahedronGeometry(0.4, 0), c1, 0.5));
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < 16; i++) {
    const a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1);
    const dir = new THREE.Vector3(Math.sin(b) * Math.cos(a), Math.cos(b), Math.sin(b) * Math.sin(a));
    const spike = wire(THREE, new THREE.ConeGeometry(0.06, 0.5, 4), c2, 0.5);
    spike.position.copy(dir.clone().multiplyScalar(0.55));
    spike.quaternion.setFromUnitVectors(up, dir);
    g.add(spike);
  }
  return g;
}

export function starfish(THREE, c1, c2) {
  const g = new THREE.Group();
  g.add(wire(THREE, new THREE.SphereGeometry(0.24, 8, 6), c1, 0.5));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const arm = wire(THREE, new THREE.ConeGeometry(0.17, 0.72, 4), c2, 0.55);
    arm.position.set(Math.cos(a) * 0.45, Math.sin(a) * 0.45, 0);
    arm.rotation.z = a - Math.PI / 2;
    g.add(arm);
  }
  g.rotation.x = -0.5;
  return g;
}

export function coral(THREE, c1, c2) {
  const g = new THREE.Group();
  (function branch(x, y, len, ang, depth) {
    if (depth <= 0 || len < 0.12) return;
    const seg = wire(THREE, new THREE.CylinderGeometry(0.03, 0.05, len, 4), depth > 1 ? c1 : c2, 0.5);
    seg.position.set(x + Math.sin(ang) * len / 2, y + Math.cos(ang) * len / 2, 0);
    seg.rotation.z = -ang; g.add(seg);
    const ex = x + Math.sin(ang) * len, ey = y + Math.cos(ang) * len;
    branch(ex, ey, len * 0.72, ang - 0.5, depth - 1);
    branch(ex, ey, len * 0.72, ang + 0.5, depth - 1);
  })(0, -0.6, 0.6, 0, 3);
  return g;
}

/* ───────────────────────── Atlas — anatomy ───────────────────────── */

export function skull(THREE, c1, c2) {
  const g = new THREE.Group();
  const cranium = wire(THREE, new THREE.SphereGeometry(0.5, 10, 8), c1, 0.5);
  cranium.scale.set(1, 1, 1.05); g.add(cranium);
  const jaw = wire(THREE, new THREE.BoxGeometry(0.55, 0.3, 0.6), c1, 0.45);
  jaw.position.set(0, -0.5, 0.05); g.add(jaw);
  for (const sx of [-0.2, 0.2]) {
    const eye = wire(THREE, new THREE.SphereGeometry(0.13, 7, 6), c2, 0.6);
    eye.position.set(sx, -0.05, 0.42); g.add(eye);
  }
  return g;
}

export function vertebra(THREE, c1, c2) {
  const g = new THREE.Group();
  g.add(wire(THREE, new THREE.TorusGeometry(0.34, 0.16, 7, 14), c1, 0.5));
  const sp = wire(THREE, new THREE.ConeGeometry(0.12, 0.5, 5), c2, 0.55);
  sp.position.set(0, -0.5, 0); sp.rotation.z = Math.PI; g.add(sp);
  for (const sx of [-1, 1]) {
    const tp = wire(THREE, new THREE.ConeGeometry(0.1, 0.35, 5), c2, 0.5);
    tp.position.set(sx * 0.42, 0.1, 0); tp.rotation.z = sx * Math.PI / 2; g.add(tp);
  }
  return g;
}

export function ribcage(THREE, c1, c2) {
  const g = new THREE.Group();
  g.add(wire(THREE, new THREE.CylinderGeometry(0.05, 0.05, 1.3, 5), c1, 0.5));
  for (let i = 0; i < 5; i++) {
    const rib = wire(THREE, new THREE.TorusGeometry(0.5 - Math.abs(i - 2) * 0.07, 0.03, 4, 12, Math.PI), c2, 0.5);
    rib.position.set(0, 0.5 - i * 0.25, 0); rib.rotation.x = Math.PI / 2; rib.scale.set(1, 1, 0.6); g.add(rib);
  }
  return g;
}

export function heart(THREE, c1, c2) {
  const g = new THREE.Group();
  for (const sx of [-0.25, 0.25]) {
    const lobe = wire(THREE, new THREE.SphereGeometry(0.32, 9, 7), c1, 0.5);
    lobe.position.set(sx, 0.25, 0); g.add(lobe);
  }
  const tip = wire(THREE, new THREE.ConeGeometry(0.55, 0.72, 8), c2, 0.5);
  tip.position.set(0, -0.35, 0); tip.rotation.z = Math.PI; g.add(tip);
  return g;
}

/* ───────────────────────── Blueprint — drawing office ───────────────────────── */

export function gear(THREE, c1, c2) {
  const g = new THREE.Group();
  g.add(wire(THREE, new THREE.TorusGeometry(0.45, 0.12, 6, 18), c1, 0.5));
  const hub = wire(THREE, new THREE.CylinderGeometry(0.14, 0.14, 0.25, 8), c2, 0.5);
  hub.rotation.x = Math.PI / 2; g.add(hub);
  const teeth = 10;
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const t = wire(THREE, new THREE.BoxGeometry(0.12, 0.12, 0.18), c2, 0.55);
    t.position.set(Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0); t.rotation.z = a; g.add(t);
  }
  return g;
}

export function bolt(THREE, c1, c2) {
  const g = new THREE.Group();
  g.add(wire(THREE, new THREE.CylinderGeometry(0.4, 0.4, 0.3, 6), c1, 0.5));
  const shaft = wire(THREE, new THREE.CylinderGeometry(0.18, 0.18, 0.9, 8), c2, 0.5);
  shaft.position.y = -0.6; g.add(shaft);
  for (let i = 0; i < 4; i++) {
    const r = wire(THREE, new THREE.TorusGeometry(0.18, 0.03, 4, 10), c2, 0.45);
    r.position.y = -0.3 - i * 0.2; r.rotation.x = Math.PI / 2; g.add(r);
  }
  g.rotation.z = 0.5;
  return g;
}

export function compass(THREE, c1, c2) {
  const g = new THREE.Group();
  const hinge = wire(THREE, new THREE.SphereGeometry(0.12, 7, 6), c1, 0.6);
  hinge.position.y = 0.5; g.add(hinge);
  for (const s of [-1, 1]) {
    const leg = wire(THREE, new THREE.CylinderGeometry(0.04, 0.02, 1.1, 5), c2, 0.5);
    leg.position.set(s * 0.22, -0.05, 0); leg.rotation.z = s * 0.4; g.add(leg);
  }
  const arc = wire(THREE, new THREE.TorusGeometry(0.4, 0.025, 4, 12, Math.PI * 0.6), c2, 0.45);
  arc.position.y = -0.1; arc.rotation.z = Math.PI * 1.2; g.add(arc);
  return g;
}

/* ───────────────────────── Daybreak — sky ───────────────────────── */

export function bird(THREE, c1, c2) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    const wing = wire(THREE, new THREE.BoxGeometry(0.7, 0.05, 0.18), c1, 0.6);
    wing.position.set(s * 0.32, 0.08, 0); wing.rotation.z = s * 0.5; g.add(wing);
  }
  g.add(wire(THREE, new THREE.SphereGeometry(0.1, 6, 5), c2, 0.6));
  return g;
}

export function cloud(THREE, c1, c2) {
  const g = new THREE.Group();
  [[-0.45, 0, 0.32], [0, 0.12, 0.42], [0.45, 0, 0.34], [0.18, -0.06, 0.3]].forEach(([x, y, r], i) => {
    const p = wire(THREE, new THREE.SphereGeometry(r, 8, 6), i % 2 ? c2 : c1, 0.5);
    p.position.set(x, y, 0); p.scale.set(1, 0.78, 0.7); g.add(p);
  });
  return g;
}

export function kite(THREE, c1, c2) {
  const g = new THREE.Group();
  const d = wire(THREE, new THREE.OctahedronGeometry(0.5, 0), c1, 0.55); d.scale.set(0.7, 1, 0.2); g.add(d);
  for (let i = 0; i < 3; i++) {
    const b = wire(THREE, new THREE.TetrahedronGeometry(0.1), c2, 0.6);
    b.position.set(i % 2 ? 0.12 : -0.12, -0.6 - i * 0.22, 0); g.add(b);
  }
  return g;
}

/* ───────────────────────── Dune — desert ───────────────────────── */

export function cactus(THREE, c1, c2) {
  const g = new THREE.Group();
  g.add(wire(THREE, new THREE.CylinderGeometry(0.18, 0.2, 1.3, 7), c1, 0.55));
  for (const s of [-1, 1]) {
    const arm = wire(THREE, new THREE.CylinderGeometry(0.1, 0.11, 0.45, 6), c2, 0.55);
    arm.position.set(s * 0.28, 0.02, 0); arm.rotation.z = s * Math.PI / 2; g.add(arm);
    const up = wire(THREE, new THREE.CylinderGeometry(0.1, 0.1, 0.4, 6), c2, 0.55);
    up.position.set(s * 0.46, 0.28, 0); g.add(up);
  }
  return g;
}

export function pyramid(THREE, c1, c2) {
  const g = new THREE.Group();
  g.add(wire(THREE, new THREE.ConeGeometry(0.72, 0.95, 4), c1, 0.55));
  g.add(wire(THREE, new THREE.TorusGeometry(0.7, 0.02, 4, 4), c2, 0.4));  // faint sand base
  return g;
}

export function palm(THREE, c1, c2) {
  const g = new THREE.Group();
  const trunk = wire(THREE, new THREE.CylinderGeometry(0.07, 0.1, 1.0, 5), c1, 0.55);
  trunk.position.y = -0.1; trunk.rotation.z = 0.12; g.add(trunk);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const fr = wire(THREE, new THREE.ConeGeometry(0.12, 0.6, 4), c2, 0.55);
    fr.position.set(Math.cos(a) * 0.28, 0.5 + Math.sin(a) * 0.08, 0); fr.rotation.z = a; fr.scale.set(1, 1, 0.3); g.add(fr);
  }
  return g;
}

/* ───────────────────────── Rivendell — map icons ───────────────────────── */

export function mountain(THREE, c1, c2) {
  const g = new THREE.Group();
  [[-0.4, 0.0, 0.6], [0.15, 0.1, 0.9], [0.55, -0.05, 0.55]].forEach(([x, y, h], i) => {
    const p = wire(THREE, new THREE.ConeGeometry(h * 0.62, h, 4), i === 1 ? c1 : c2, 0.55);
    p.position.set(x, y - 0.1, 0); g.add(p);
  });
  return g;
}

export function tower(THREE, c1, c2) {
  const g = new THREE.Group();
  const body = wire(THREE, new THREE.CylinderGeometry(0.22, 0.26, 0.95, 7), c1, 0.55);
  body.position.y = -0.12; g.add(body);
  const roof = wire(THREE, new THREE.ConeGeometry(0.3, 0.5, 7), c2, 0.6);
  roof.position.y = 0.6; g.add(roof);
  return g;
}

export function tree(THREE, c1, c2) {
  const g = new THREE.Group();
  const trunk = wire(THREE, new THREE.CylinderGeometry(0.08, 0.1, 0.5, 5), c2, 0.55);
  trunk.position.y = -0.45; g.add(trunk);
  const crown = wire(THREE, new THREE.IcosahedronGeometry(0.5, 0), c1, 0.5);
  crown.position.y = 0.15; g.add(crown);
  return g;
}
