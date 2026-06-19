import { wire } from '../galaxy/wire.js';
export const meta = { label: 'Taj Mahal', tris: 1000 };
export default function tajMahal(THREE, c1, c2) {
  const g = new THREE.Group();
  g.add(wire(THREE, new THREE.BoxGeometry(3, 0.22, 3, 4, 1, 4), c1, 0.4));
  const body = wire(THREE, new THREE.BoxGeometry(1.5, 1.05, 1.5, 3, 2, 3), c1);
  body.position.y = 0.72; g.add(body);
  const dome = wire(THREE, new THREE.SphereGeometry(0.72, 12, 9), c2, 0.6);
  dome.scale.y = 1.18; dome.position.y = 1.82; g.add(dome);
  const finial = wire(THREE, new THREE.ConeGeometry(0.06, 0.34, 5), c2, 0.8);
  finial.position.y = 2.74; g.add(finial);
  for (const [x, z] of [[-1.38, -1.38], [1.38, -1.38], [-1.38, 1.38], [1.38, 1.38]]) {
    const m = wire(THREE, new THREE.CylinderGeometry(0.06, 0.09, 1.7, 6, 3), c1, 0.45);
    m.position.set(x, 0.95, z); g.add(m);
    const cap = wire(THREE, new THREE.SphereGeometry(0.12, 6, 5), c2, 0.6);
    cap.position.set(x, 1.9, z); g.add(cap);
  }
  return g;
}
