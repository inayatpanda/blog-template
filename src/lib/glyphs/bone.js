import { wire } from '../galaxy/wire.js';
export const meta = { label: 'Bone', tris: 600 };
export default function bone(THREE, c1, c2) {
  const g = new THREE.Group();
  const shaft = wire(THREE, new THREE.CylinderGeometry(0.16, 0.16, 1.5, 7, 3), c1, 0.5);
  g.add(shaft);
  for (const sy of [1, -1]) {
    for (const sx of [0.18, -0.18]) {
      const lobe = wire(THREE, new THREE.SphereGeometry(0.22, 7, 6), c2, 0.6);
      lobe.position.set(sx, sy * 0.82, 0); g.add(lobe);
    }
  }
  g.rotation.z = 0.6;
  return g;
}
