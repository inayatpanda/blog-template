import { wire } from '../galaxy/wire.js';
export const meta = { label: 'Globe', tris: 700 };
export default function globe(THREE, c1, c2) {
  const g = new THREE.Group();
  const sphere = wire(THREE, new THREE.SphereGeometry(0.62, 12, 9), c1, 0.55);
  sphere.rotation.z = 0.41; // axial tilt
  g.add(sphere);
  const meridian = wire(THREE, new THREE.TorusGeometry(0.78, 0.018, 5, 28, Math.PI), c2, 0.6);
  meridian.rotation.z = Math.PI / 2 + 0.41;
  g.add(meridian);
  const stand = wire(THREE, new THREE.CylinderGeometry(0.22, 0.3, 0.1, 8), c2, 0.45);
  stand.position.y = -0.92;
  g.add(stand);
  return g;
}
