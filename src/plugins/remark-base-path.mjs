// Rewrite root-absolute INTERNAL link/image URLs in markdown post content so
// they work at a GitHub Pages project sub-path. Mirrors withBase() for prose:
// a link like [x](/blog/y/) becomes /<base>/blog/y/ when BASE_PATH is set.
//
// Runs in Node at build time → reads process.env.BASE_PATH (import.meta.env is
// not available here). No BASE_PATH (the owner's root-domain build) → no-op, so
// post content is byte-for-byte unchanged there.
//
// Untouched: external (http/https), protocol-relative ('//…'), in-page anchors
// ('#…'), mailto:/tel: and relative paths — anything not starting with a single '/'.
export default function remarkBasePath() {
  const raw = process.env.BASE_PATH || '/';
  const prefix = raw.replace(/\/$/, ''); // '/demo/' → '/demo'; '/' → ''
  return (tree) => {
    if (!prefix) return; // base '/' → nothing to do
    const visit = (node) => {
      if (!node || typeof node !== 'object') return;
      if ((node.type === 'link' || node.type === 'image') && typeof node.url === 'string') {
        const u = node.url;
        if (u.startsWith('/') && !u.startsWith('//')) node.url = prefix + u;
      }
      if (Array.isArray(node.children)) node.children.forEach(visit);
    };
    visit(tree);
  };
}
