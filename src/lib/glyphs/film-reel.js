import { wire } from '../galaxy/wire.js';
export const meta = { label: 'Film reel', tris: 500 };
export default function filmReel(THREE, c1, c2) {
  const g = new THREE.Group();
  g.add(wire(THREE, new THREE.TorusGeometry(0.85, 0.07, 6, 24), c1, 0.55));
  const hub = wire(THREE, new THREE.CylinderGeometry(0.18, 0.18, 0.16, 10), c2, 0.7);
  hub.rotation.x = Math.PI / 2; g.add(hub);
  for (let i = 0; i < 5; i++) {
    const spoke = wire(THREE, new THREE.BoxGeometry(0.06, 1.5, 0.06, 1, 3, 1), c1, 0.45);
    spoke.rotation.z = (i / 5) * Math.PI * 2; g.add(spoke);
  }
  return g;
}
