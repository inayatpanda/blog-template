import { wire } from '../galaxy/wire.js';
export const meta = { label: 'Sydney Opera House', tris: 1000 };
// Two clusters of thin, leaning curved shells on a podium — the sail silhouette.
export default function operaHouse(THREE, c1, c2) {
  const g = new THREE.Group();
  g.add(wire(THREE, new THREE.BoxGeometry(2.7, 0.18, 1.0, 4, 1, 2), c1, 0.45));
  // a sail = a thin half-shell, tall, leaning
  const sail = (x, h, lean) => {
    const s = wire(THREE, new THREE.SphereGeometry(0.6, 9, 7, 0, Math.PI, 0, Math.PI / 2), c2, 0.6);
    s.scale.set(0.55, h, 0.18);
    s.position.set(x, 0.1, 0);
    s.rotation.z = lean;
    g.add(s);
  };
  // left cluster leaning right, right cluster leaning left — they nest toward centre
  sail(-0.9, 1.5, -0.55);
  sail(-0.58, 2.0, -0.38);
  sail(-0.26, 1.5, -0.22);
  sail(0.95, 1.3, 0.55);
  sail(0.62, 1.7, 0.38);
  return g;
}
