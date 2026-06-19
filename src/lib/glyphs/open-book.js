import { wire } from '../galaxy/wire.js';
export const meta = { label: 'Open book', tris: 600 };
export default function openBook(THREE, c1, c2) {
  const g = new THREE.Group();
  const pageL = wire(THREE, new THREE.PlaneGeometry(1.25, 1.7, 5, 6), c1, 0.55);
  pageL.rotation.y = 0.62; pageL.position.x = -0.55; g.add(pageL);
  const pageR = wire(THREE, new THREE.PlaneGeometry(1.25, 1.7, 5, 6), c1, 0.55);
  pageR.rotation.y = -0.62; pageR.position.x = 0.55; g.add(pageR);
  g.add(wire(THREE, new THREE.CylinderGeometry(0.06, 0.06, 1.7, 6, 1), c2, 0.7));
  g.rotation.x = -0.35;
  return g;
}
