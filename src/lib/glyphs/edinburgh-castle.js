import { wire } from '../galaxy/wire.js';
export const meta = { label: 'Edinburgh Castle', tris: 1000 };
// Castle Rock + a crenellated keep flanked by two round towers with conical roofs.
export default function edinburghCastle(THREE, c1, c2) {
  const g = new THREE.Group();
  // the crag (Castle Rock) — a broad, irregular base
  const crag = wire(THREE, new THREE.ConeGeometry(1.4, 1.0, 6, 2), c1, 0.4);
  crag.position.y = -0.85; crag.scale.set(1, 0.6, 0.8); g.add(crag);
  // main keep
  const keep = wire(THREE, new THREE.BoxGeometry(1.0, 0.7, 0.7, 1, 1, 1), c1, 0.55);
  keep.position.y = -0.1; g.add(keep);
  // crenellations along the keep top
  for (let i = -1; i <= 1; i++) {
    const merlon = wire(THREE, new THREE.BoxGeometry(0.16, 0.16, 0.7, 1, 1, 1), c2, 0.6);
    merlon.position.set(i * 0.32, 0.33, 0); g.add(merlon);
  }
  // two flanking round towers with conical roofs and flag spikes
  for (const x of [-0.62, 0.62]) {
    const tower = wire(THREE, new THREE.CylinderGeometry(0.2, 0.24, 1.1, 8, 2), c1, 0.55);
    tower.position.set(x, 0.05, 0); g.add(tower);
    const roof = wire(THREE, new THREE.ConeGeometry(0.26, 0.42, 8), c2, 0.7);
    roof.position.set(x, 0.8, 0); g.add(roof);
    const flag = wire(THREE, new THREE.BoxGeometry(0.02, 0.24, 0.02), c2, 0.8);
    flag.position.set(x, 1.13, 0); g.add(flag);
  }
  return g;
}
