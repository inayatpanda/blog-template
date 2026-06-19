import { wire } from '../galaxy/wire.js';
export const meta = { label: 'Torus knot', tris: 1440 };
export default function torusKnot(THREE, c1, c2) {
  const g = new THREE.Group();
  g.add(wire(THREE, new THREE.TorusKnotGeometry(0.8, 0.26, 72, 10), c1, 0.5));
  g.add(wire(THREE, new THREE.IcosahedronGeometry(0.28, 0), c2, 0.65));
  return g;
}
