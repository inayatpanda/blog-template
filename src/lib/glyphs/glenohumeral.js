import { wire } from '../galaxy/wire.js';
export const meta = { label: 'Glenohumeral joint', tris: 800 };
export default function glenohumeral(THREE, c1, c2) {
  const g = new THREE.Group();
  const head = wire(THREE, new THREE.SphereGeometry(0.62, 14, 11), c1, 0.55);
  head.position.x = 0.28; g.add(head);
  const cup = wire(THREE, new THREE.SphereGeometry(0.92, 14, 8, 0, Math.PI * 2, 0, 1.05), c2, 0.5);
  cup.rotation.z = Math.PI / 2; cup.position.x = -0.52; g.add(cup);
  const shaft = wire(THREE, new THREE.CylinderGeometry(0.16, 0.2, 1.7, 7, 3), c1, 0.4);
  shaft.rotation.z = -0.5; shaft.position.set(1.05, -0.85, 0); g.add(shaft);
  return g;
}
