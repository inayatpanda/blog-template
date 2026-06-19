import { defineConfig } from 'astro/config';
import rehypeGallery from './src/lib/rehype-gallery.mjs';
import siteConfig from './src/data/site.json';

export default defineConfig({
  site: siteConfig.url,
  compressHTML: true,
  markdown: {
    rehypePlugins: [rehypeGallery],
  },
});
