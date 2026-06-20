import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { site } from '../lib/site';
import { withBase } from '../lib/withBase';

export async function GET(context) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  // @astrojs/rss does NOT apply Astro's `base`, so do it ourselves: the channel
  // self-link points at the deploy root (site + base) and each item link is
  // base-prefixed before being joined to `site`. No-op at base '/'.
  const channelSite = new URL(import.meta.env.BASE_URL || '/', context.site).href;

  return rss({
    title: `${site.masthead} — ${site.name}`,
    description: site.description,
    site: channelSite,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: withBase(`/blog/${post.slug}/`),
      categories: post.data.tags,
    })),
    customData: '<language>en-gb</language>',
  });
}
