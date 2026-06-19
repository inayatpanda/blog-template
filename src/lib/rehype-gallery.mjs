// Wrap runs of consecutive image-only paragraphs into a `<div class="gallery">`
// grid. A lone image stays inline. The Helm composer's drag-to-resize feature can
// set a gallery WIDTH + alignment: it emits a sentinel marker line
// `[[blk-gallery:w=NN,a=left|center|right]]` directly before the image run. We read
// that marker, apply `--blk-w` + `data-align` to the gallery wrapper (honoured by
// the site CSS, responsive — full width ≤640px), then drop the marker node. No
// marker = today's behaviour exactly.
const MARKER = /^\[\[blk-gallery:w=(\d{1,3}),a=(left|center|right)\]\]$/;

// A paragraph whose only text content is the gallery marker → { w, align }, else null.
function galleryMarker(n) {
  if (!n || n.tagName !== 'p' || !n.children) return null;
  const kids = n.children.filter((c) => !(c.type === 'text' && !String(c.value).trim()));
  if (kids.length !== 1 || kids[0].type !== 'text') return null;
  const m = MARKER.exec(String(kids[0].value).trim());
  if (!m) return null;
  const w = Math.max(20, Math.min(99, Number(m[1])));
  return { w, align: m[2] };
}

export default function rehypeGallery() {
  return (tree) => {
    const out = [];
    let run = []; // accumulated <img> nodes across consecutive image-only paragraphs
    let pending = null; // a gallery width/align hint waiting for the next gallery

    // Images in a paragraph that contains ONLY images (whitespace text nodes
    // ignored), else null. Handles both "one image per line" (each its own <p>)
    // and "several images in one paragraph" (single-newline-separated) — markdown
    // produces either, and a paragraph carries stray whitespace text nodes.
    const paraImgs = (n) => {
      if (n.tagName !== 'p' || !n.children) return null;
      const kids = n.children.filter((c) => !(c.type === 'text' && !String(c.value).trim()));
      return kids.length > 0 && kids.every((c) => c.tagName === 'img') ? kids : null;
    };

    const flush = () => {
      if (run.length >= 2) {
        const properties = { className: ['gallery'] };
        if (pending) {
          properties.style = `--blk-w:${pending.w}%`;
          properties['data-align'] = pending.align;
        }
        out.push({ type: 'element', tagName: 'div', properties, children: run });
      } else if (run.length === 1) {
        // a single image still honours a width hint (becomes a sized figure-like p)
        const properties = {};
        if (pending) {
          properties.className = ['gallery', 'gallery--one'];
          properties.style = `--blk-w:${pending.w}%`;
          properties['data-align'] = pending.align;
          out.push({ type: 'element', tagName: 'div', properties, children: [run[0]] });
        } else {
          out.push({ type: 'element', tagName: 'p', properties, children: [run[0]] }); // lone image stays inline
        }
      }
      run = [];
      pending = null;
    };

    for (const node of tree.children) {
      // whitespace-only text nodes sit between block elements. Skip them: pushing a
      // flush here would (a) drop a freshly-armed `pending` before its gallery, or
      // (b) split a run of image paragraphs. When idle, keep the whitespace for
      // faithful output; when mid-run/armed, just drop it.
      if (node.type === 'text' && !String(node.value).trim()) {
        if (!run.length && !pending) out.push(node);
        continue;
      }
      const hint = galleryMarker(node);
      if (hint) { flush(); pending = hint; continue; } // marker arms the next gallery; node dropped
      const imgs = paraImgs(node);
      if (imgs) run.push(...imgs);
      else { flush(); out.push(node); }
    }
    flush();
    tree.children = out;

    const lazify = (n) => { if (n.tagName === 'img') (n.properties ||= {}).loading = 'lazy';
      n.children?.forEach?.(lazify); };
    tree.children.forEach(lazify);
  };
}
