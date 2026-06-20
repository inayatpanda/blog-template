import { getCollection } from 'astro:content';
import topics from '../../data/topics.json';
import { withBase } from '../withBase.ts';

const BROAD = new Set(topics.map((t) => t.tag));

export async function galaxyData() {
  const posts = (await getCollection('blog')).filter((p) => !p.data.draft);
  const items = posts.flatMap((p) => {
    const g = p.data.glyph;
    if (g === 'none') return [];
    const topic = (p.data.tags || []).find((t) => BROAD.has(t)) || 'forge';
    let type = 'model', ref = g || null;
    if (g?.startsWith('icon:')) { type = 'icon'; ref = g.slice(5); }
    else if (g?.startsWith('image:')) { type = 'image'; ref = g.slice(6); }
    return [{
      title: p.data.title, url: withBase(`/blog/${p.slug}/`), topic, type, ref,
      accent: p.data.accent || null,
      date: p.data.date instanceof Date ? p.data.date.toISOString() : p.data.date,
    }];
  });
  const planets = topics
    .filter((t) => t.tag !== 'nebula')
    .map((t) => ({
      slug: t.tag, name: t.name, subtitle: t.subtitle, color: t.color,
      url: withBase(`/c/${t.tag}/`),
      count: items.filter((i) => i.topic === t.tag).length,
    }));
  return { items, planets };
}
