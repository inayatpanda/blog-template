import { defineConfig } from 'astro/config';
import rehypeGallery from './src/lib/rehype-gallery.mjs';
import remarkBasePath from './src/plugins/remark-base-path.mjs';
import siteConfig from './src/data/site.json';

export default defineConfig({
  site: siteConfig.url,
  // Serve at a GitHub Pages project sub-path when BASE_PATH is set
  // (e.g. BASE_PATH=/repo/). Unset → '/' → the owner's root-domain site,
  // byte-for-byte unchanged. Astro auto-prefixes its own _astro/ assets.
  base: process.env.BASE_PATH || '/',
  compressHTML: true,
  markdown: {
    remarkPlugins: [remarkBasePath],
    rehypePlugins: [rehypeGallery],
  },
});
