import { wire } from '../galaxy/wire.js';
export const meta = { label: 'Manuscript', tris: 700 };
export default function scroll(THREE, c1, c2) {
  const g = new THREE.Group();
  g.add(wire(THREE, new THREE.PlaneGeometry(1.5, 1.15, 6, 4), c1, 0.5));
  for (const y of [0.66, -0.66]) {
    const roller = wire(THREE, new THREE.CylinderGeometry(0.13, 0.13, 1.85, 8, 1), c2, 0.6);
    roller.rotation.z = Math.PI / 2; roller.position.y = y; g.add(roller);
    for (const x of [-0.95, 0.95]) {
      const knob = wire(THREE, new THREE.SphereGeometry(0.07, 5, 4), c2, 0.7);
      knob.position.set(x, y, 0); g.add(knob);
    }
  }
  g.rotation.x = -0.2;
  return g;
}
