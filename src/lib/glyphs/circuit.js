import { wire } from '../galaxy/wire.js';
export const meta = { label: 'Circuit board', tris: 700 };
// A PCB read head-on: board, a raised chip with legs, traces, two capacitors.
export default function circuit(THREE, c1, c2) {
  const g = new THREE.Group();
  g.add(wire(THREE, new THREE.BoxGeometry(1.8, 1.3, 0.08, 3, 2, 1), c1, 0.5));
  // raised chip
  const chip = wire(THREE, new THREE.BoxGeometry(0.6, 0.6, 0.2, 1, 1, 1), c2, 0.8);
  chip.position.z = 0.14; g.add(chip);
  // chip legs on two sides
  for (let s = -1; s <= 1; s += 2) {
    for (let i = -1; i <= 1; i++) {
      const leg = wire(THREE, new THREE.BoxGeometry(0.06, 0.13, 0.05), c2, 0.7);
      leg.position.set(s * 0.37, i * 0.17, 0.14); g.add(leg);
    }
  }
  // traces fanning to the board edges
  for (const [x, y, len, horiz] of [[-0.75, 0.42, 0.7, true], [0.78, -0.38, 0.6, true], [0.35, 0.6, 0.4, false], [-0.45, -0.55, 0.35, false]]) {
    const t = wire(THREE, horiz ? new THREE.BoxGeometry(len, 0.035, 0.02) : new THREE.BoxGeometry(0.035, len, 0.02), c1, 0.65);
    t.position.set(x, y, 0.06); g.add(t);
  }
  // two capacitors standing off the board
  for (const x of [-0.62, -0.34]) {
    const cap = wire(THREE, new THREE.CylinderGeometry(0.12, 0.12, 0.26, 8, 1), c2, 0.65);
    cap.position.set(x, -0.42, 0.18); g.add(cap);
  }
  return g;
}
