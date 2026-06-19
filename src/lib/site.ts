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
}

export const site = siteData as SiteConfig;

/** Page <title>: "<title> — <name>" for sub-pages; pass no argument to use the masthead
 *  as the title segment ("<masthead> — <name>"). */
export function pageTitle(title?: string): string {
  return title ? `${title} — ${site.name}` : `${site.masthead} — ${site.name}`;
}
