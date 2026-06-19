import { wire } from '../galaxy/wire.js';
export const meta = { label: 'Music note', tris: 500 };
// An eighth note — non-spherical, unmistakably arts/after-hours.
export default function musicNote(THREE, c1, c2) {
  const g = new THREE.Group();
  // note head — a small tilted ellipse (flattened, reads as a disc not a ball)
  const head = wire(THREE, new THREE.SphereGeometry(0.32, 10, 6), c1, 0.62);
  head.scale.set(1.3, 0.78, 0.4);
  head.rotation.z = -0.42;
  head.position.set(-0.45, -0.75, 0);
  g.add(head);
  // stem
  const stem = wire(THREE, new THREE.BoxGeometry(0.08, 1.85, 0.08, 1, 4, 1), c1, 0.6);
  stem.position.set(0.04, 0.18, 0);
  g.add(stem);
  // flag
  const flag = wire(THREE, new THREE.BoxGeometry(0.5, 0.6, 0.04, 2, 3, 1), c2, 0.55);
  flag.position.set(0.3, 0.95, 0);
  flag.rotation.z = -0.5;
  g.add(flag);
  return g;
}
