import siteData from '../data/site.json';

export interface SiteConfig {
  name: string;
  masthead: string;
  tagline: string;
  description: string;
  url: string;
  defaultTheme: 'observatory' | 'vista' | 'blueprint' | 'atlas' | 'daybreak' | 'dune' | 'rivendell';
  socials: { linkedin?: string; instagram?: string; github?: string };
  newsletter: { endpoint: string };
  contact: { endpoint: string };
  /** Header/footer nav. Optional: when absent, Base.astro falls back to its built-in nav.
   *  `primary` items show in the mobile quick-access row; `themeLabel` items get renamed
   *  per active site theme (e.g. Observatory → The Deep) by applyThemeTerms(). */
  nav?: Array<{ href: string; label: string; primary?: boolean; themeLabel?: boolean }>;
}

export const site = siteData as SiteConfig;

/** Page <title>: "<title> — <name>" for sub-pages; pass no argument to use the masthead
 *  as the title segment ("<masthead> — <name>"). */
export function pageTitle(title?: string): string {
  return title ? `${title} — ${site.name}` : `${site.masthead} — ${site.name}`;
}
