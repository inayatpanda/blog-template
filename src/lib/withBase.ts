// Prefix a root-absolute INTERNAL path with the configured base so links work
// at a GitHub Pages project sub-path (https://<user>.github.io/<repo>/).
// No-op when base is '/' (the owner's root-domain site) — so applying it
// everywhere is byte-for-byte safe there.
//
// Leaves untouched: external URLs (http/https), protocol-relative ('//cdn…'),
// in-page anchors ('#latest'), mailto:/tel:, and relative paths — anything that
// does not start with a single '/'.
export function withBase(path: string): string {
  if (typeof path !== 'string') return path;
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  const base = import.meta.env.BASE_URL || '/';
  // base is '/' → '' + '/observatory/' = '/observatory/' (unchanged);
  // base is '/repo/' → '/repo' + '/observatory/' = '/repo/observatory/'.
  return base.replace(/\/$/, '') + path;
}
