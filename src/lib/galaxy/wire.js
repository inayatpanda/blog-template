// Wireframe lines are 1px in WebGL, so we read "weight" through opacity:
// boost it ~1.4x (clamped) so every glyph's lines sit bolder and brighter.
export const wire = (THREE, geo, color, opacity = 0.5) =>
  new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    color, wireframe: true, transparent: true, opacity: Math.min(1, opacity * 1.4) }));

export function glowTexture(THREE) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const ctx = cv.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,.9)');
  grad.addColorStop(0.35, 'rgba(255,255,255,.25)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(cv);
}
