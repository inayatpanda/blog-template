export function initLightbox() {
  if (document.getElementById('gx-lightbox')) return bind();
  const box = document.createElement('div');
  box.id = 'gx-lightbox'; box.className = 'gx-lightbox';
  box.innerHTML = '<img alt="">';
  document.body.appendChild(box);
  bind();
  function bind() {
    const lb = document.getElementById('gx-lightbox');
    const big = lb.querySelector('img');
    if (!lb.dataset.bound) {
      lb.dataset.bound = '1';
      lb.addEventListener('click', () => lb.classList.remove('open'));
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lb.classList.remove('open'); });
      document.addEventListener('click', (e) => {
        const img = e.target.closest('.gallery img');
        if (!img) return;
        big.src = img.currentSrc || img.src; big.alt = img.alt || '';
        lb.classList.add('open');
      });
    }
  }
}
