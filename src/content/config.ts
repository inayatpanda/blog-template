import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    tags: z.array(z.string()).default([]),
    glyph: z.string().optional(),
    accent: z.string().default('#2dd4bf'),
    draft: z.boolean().default(false),
    // Scheduled publishing: an ISO date/time. A scheduled post is committed as
    // draft:true + publishAt:<date>; the scheduled-publish GitHub Action flips
    // draft→false once publishAt is due. Drafts stay hidden everywhere regardless,
    // so a scheduled post never appears until the Action runs. Optional + coerced
    // so both "2026-09-01" and a full ISO timestamp parse to a Date.
    publishAt: z.coerce.date().optional(),
    // Optional per-post share image (root-relative, e.g. "/images/foo.png").
    // Falls back to the branded /og-default.png when absent.
    image: z.string().optional(),
    // Reading theme — the post opens as its own themed "sheet" on the dark site frame.
    // 'dark' (default) keeps the site look; others render a light/styled sheet.
    theme: z.enum(['dark', 'parchment']).default('dark'),
    // Reading TEMPLATE — restyles the reading surface (post hero + article body +
    // rail backdrop) below the fixed nav. Optional per-post LOCK: when set, this
    // template is forced for this post and the on-page switcher reflects + locks it.
    // Absent → reader's global `localStorage 'post-template'` pref applies (default
    // 'observatory', the dark house style). Keys: observatory | parchment |
    // manuscript | newsprint | slate | focus.
    template: z
      .enum(['observatory', 'parchment', 'manuscript', 'newsprint', 'slate', 'focus'])
      .optional(),
    // Manual citations (The Helm references manager). The {id,text} list is the
    // source of truth for the editor; the markdown body carries the GFM footnote
    // markers ([^id]) and definitions that actually render. Optional.
    citations: z.array(z.object({ id: z.string(), text: z.string() })).optional(),
    // Series grouping. `series` is the series NAME (membership is by exact name);
    // `seriesPart` is an optional explicit ordinal — posts in a series order by
    // seriesPart (when present) then date. Both optional; absent = standalone post.
    series: z.string().optional(),
    seriesPart: z.number().optional(),
  }),
});

export const collections = { blog };
