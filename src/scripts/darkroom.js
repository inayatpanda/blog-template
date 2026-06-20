// Darkroom — client interactivity: faceted filtering + PhotoSwipe lightbox.
//
// The grid (#darkroom-grid) holds <a.dr-shot> thumbnails, each carrying its
// facet data (data-year / data-topics / data-camera / data-tags / data-album /
// data-post) plus PhotoSwipe attrs (href=full image, data-pswp-width/height)
// and caption data (data-caption / data-posttitle / data-postslug).
//
// Filtering: chip buttons are grouped by data-facet. We keep a Set of selected
// values per facet. An item is visible iff, for EVERY facet that has at least
// one selection, the item matches ONE of that facet's selected values
// (AND across facets, OR within a facet). Default (nothing selected) = all.
//
// PhotoSwipe: dynamically imported (off the critical path). Because the open /
// next / prev set must track the *visible* photos, we destroy + recreate the
// lightbox whenever the filter changes (children: 'a.dr-shot:not(.is-hidden)').
//
// Base-aware: the post link is built from the grid's data-blogbase (already run
// through withBase server-side), so this file never hardcodes '/'.

// Map a chip's data-facet → the item's data-* attribute name. Facet names are
// singular (year/topic/camera/tag/album/post); some item attrs are plural.
const FACET_ATTR = {
  year: 'year',
  topic: 'topics',
  camera: 'camera',
  tag: 'tags',
  album: 'album',
  post: 'post',
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initDarkroom() {
  const grid = document.getElementById('darkroom-grid');
  // Guard against double-binding (module runs on import AND on astro:page-load).
  if (!grid || grid.dataset.drBound) return;
  grid.dataset.drBound = '1';

  const shots = Array.from(grid.querySelectorAll('.dr-shot'));
  const chips = Array.from(document.querySelectorAll('.darkroom-filter .chip[data-facet]'));
  const countEl = document.getElementById('dr-count');
  const clearBtn = document.getElementById('dr-clear');
  const blogBase = grid.dataset.blogbase || '/blog/';

  // selected values, keyed by facet name.
  const selected = new Map();
  for (const chip of chips) {
    const facet = chip.dataset.facet;
    if (facet && !selected.has(facet)) selected.set(facet, new Set());
  }

  // Split an item's space-joined data-<attr> into a value list. Empty/absent → [].
  const itemValues = (shot, facet) => {
    const raw = (shot.dataset[FACET_ATTR[facet]] || '').trim();
    return raw ? raw.split(/\s+/) : [];
  };

  // PhotoSwipe lifecycle — recreated on every filter change so the active set
  // matches the visible photos. Loaded lazily on first need.
  let lightbox = null;
  let PhotoSwipeLightbox = null;

  function buildLightbox() {
    if (!PhotoSwipeLightbox) return; // module not loaded yet
    if (lightbox) { lightbox.destroy(); lightbox = null; }
    lightbox = new PhotoSwipeLightbox({
      gallery: '#darkroom-grid',
      children: 'a.dr-shot:not(.is-hidden)',
      pswpModule: () => import('photoswipe'),
      showHideAnimationType: reducedMotion ? 'none' : 'zoom',
      bgOpacity: 1,
    });
    // Caption + "from this post →" link, rendered into the PhotoSwipe UI.
    lightbox.on('uiRegister', () => {
      lightbox.pswp.ui.registerElement({
        name: 'dr-caption',
        order: 9,
        isButton: false,
        appendTo: 'root',
        html: '',
        onInit: (el, pswp) => {
          const update = () => {
            const a = pswp.currSlide?.data?.element;
            if (!a) { el.innerHTML = ''; return; }
            const text = a.dataset.caption || a.dataset.posttitle || '';
            const slug = a.dataset.postslug || '';
            // Caption text and the "from this post →" link are separate nodes so
            // the stylesheet can put them on their own rows (the .pswp-cap-text
            // spans the full width) — they must never run together. The link is
            // tinted cyan via .pswp-cap-link in global.css.
            let html = '';
            if (text) html += `<span class="pswp-cap-text"></span>`;
            if (slug) html += `<a class="pswp-cap-link" href="${blogBase}${slug}/">from this post &rarr;</a>`;
            el.innerHTML = html;
            // Set caption text via textContent to avoid any HTML injection.
            const span = el.querySelector('.pswp-cap-text');
            if (span) span.textContent = text;
          };
          update();
          pswp.on('change', update);
        },
      });
    });
    lightbox.init();
  }

  // Lazy-load PhotoSwipe, then build the lightbox. Safe to call repeatedly.
  let pswpLoading = null;
  function ensureLightbox() {
    if (PhotoSwipeLightbox) { buildLightbox(); return; }
    if (pswpLoading) return;
    pswpLoading = import('photoswipe/lightbox')
      .then((mod) => {
        PhotoSwipeLightbox = mod.default;
        buildLightbox();
      })
      .catch((e) => console.error('PhotoSwipe failed to load', e));
  }

  function applyFilter() {
    // Facets that actually have a selection right now.
    const activeFacets = [];
    for (const [facet, set] of selected) {
      if (set.size) activeFacets.push([facet, set]);
    }

    let shown = 0;
    for (const shot of shots) {
      // AND across facets: every active facet must match one of the item's values.
      const visible = activeFacets.every(([facet, set]) =>
        itemValues(shot, facet).some((v) => set.has(v)),
      );
      shot.classList.toggle('is-hidden', !visible);
      if (visible) shown++;
    }

    if (countEl) countEl.textContent = `${shown} photo${shown === 1 ? '' : 's'}`;

    // Reflect chip state.
    for (const chip of chips) {
      const set = selected.get(chip.dataset.facet);
      const on = !!(set && set.has(chip.dataset.value));
      chip.classList.toggle('is-active', on);
      chip.classList.toggle('active', on); // reuse the shared .chip.active styling
      chip.setAttribute('aria-pressed', String(on));
    }

    // Rebuild the lightbox so its open/next/prev set tracks the visible photos.
    buildLightbox();
  }

  for (const chip of chips) {
    chip.setAttribute('aria-pressed', 'false');
    chip.addEventListener('click', () => {
      const set = selected.get(chip.dataset.facet);
      if (!set) return;
      const val = chip.dataset.value;
      if (set.has(val)) set.delete(val);
      else set.add(val);
      applyFilter();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      for (const set of selected.values()) set.clear();
      applyFilter();
    });
  }

  // Initial paint (all visible) + bring PhotoSwipe online.
  ensureLightbox();
  applyFilter();
}

// Run on first load and after every Astro view transition. The dataset guard
// inside initDarkroom() makes re-entry a no-op once a grid is bound.
initDarkroom();
document.addEventListener('astro:page-load', initDarkroom);
