// Series helpers — group posts by their `series` frontmatter name and order them.
//
// Membership is by exact `series` name. Order within a series is by `seriesPart`
// (when present) ascending, then date ascending (oldest first → Part 1 first),
// with the title as a final tiebreaker so the order is always stable. Drafts are
// excluded by the caller (it passes only published posts).
import type { CollectionEntry } from 'astro:content';

export type BlogEntry = CollectionEntry<'blog'>;

/** A slug-safe key for a series name, used for /series/<key>/ URLs. */
export function seriesSlug(name: string): string {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Order a set of posts within one series (oldest first). */
export function orderSeries(posts: BlogEntry[]): BlogEntry[] {
  return [...posts].sort((a, b) => {
    const pa = a.data.seriesPart, pb = b.data.seriesPart;
    const hasA = typeof pa === 'number', hasB = typeof pb === 'number';
    // explicit part numbers sort first and ascending; parts-present beat parts-absent
    if (hasA && hasB && pa !== pb) return pa - pb;
    if (hasA !== hasB) return hasA ? -1 : 1;
    const da = a.data.date.valueOf(), db = b.data.date.valueOf();
    if (da !== db) return da - db; // oldest first within a series
    return a.data.title.localeCompare(b.data.title);
  });
}

export interface Series {
  name: string;
  slug: string;
  posts: BlogEntry[];
}

/** Build every series from the published posts. Returns a Map keyed by series slug. */
export function buildSeries(posts: BlogEntry[]): Map<string, Series> {
  const groups = new Map<string, Series>();
  for (const p of posts) {
    const name = (p.data.series || '').trim();
    if (!name) continue;
    const slug = seriesSlug(name);
    if (!slug) continue;
    if (!groups.has(slug)) groups.set(slug, { name, slug, posts: [] });
    groups.get(slug)!.posts.push(p);
  }
  for (const s of groups.values()) s.posts = orderSeries(s.posts);
  return groups;
}

export interface SeriesContext {
  name: string;
  slug: string;
  posts: BlogEntry[];
  index: number;   // 0-based position of the current post
  part: number;    // 1-based "Part N"
  total: number;   // M in "Part N of M"
  prev: BlogEntry | null;
  next: BlogEntry | null;
}

/**
 * Resolve the series context for a single post, or null if it isn't in a series
 * (or its series only has the one post — nothing to navigate). `posts` is the full
 * published collection.
 */
export function seriesContextFor(post: BlogEntry, posts: BlogEntry[]): SeriesContext | null {
  const name = (post.data.series || '').trim();
  if (!name) return null;
  const ordered = orderSeries(posts.filter((p) => (p.data.series || '').trim() === name));
  if (ordered.length < 2) return null; // a one-post "series" needs no nav
  const index = ordered.findIndex((p) => p.slug === post.slug);
  if (index < 0) return null;
  return {
    name,
    slug: seriesSlug(name),
    posts: ordered,
    index,
    part: index + 1,
    total: ordered.length,
    prev: index > 0 ? ordered[index - 1] : null,
    next: index < ordered.length - 1 ? ordered[index + 1] : null,
  };
}
