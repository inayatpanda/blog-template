import { wire } from '../galaxy/wire.js';
export const meta = { label: 'Navigation reticle', tris: 700 };
export default function reticle(THREE, c1, c2) {
  const g = new THREE.Group();
  g.add(wire(THREE, new THREE.SphereGeometry(0.5, 10, 8), c1, 0.55));
  const ring = wire(THREE, new THREE.TorusGeometry(0.85, 0.025, 4, 32), c2, 0.6);
  g.add(ring);
  for (let i = 0; i < 4; i++) {
    const tick = wire(THREE, new THREE.BoxGeometry(0.04, 0.3, 0.04), c2, 0.75);
    const a = (i / 4) * Math.PI * 2;
    tick.position.set(Math.cos(a) * 0.85, Math.sin(a) * 0.85, 0);
    tick.rotation.z = a; g.add(tick);
  }
  return g;
}
