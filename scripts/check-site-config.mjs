// Swaps site.json for sentinel values, rebuilds, and asserts the built output reflects them
// (and no original identity leaks). RED while identity is hardcoded; GREEN once config-driven.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';

const CFG = 'src/data/site.json';
const BAK = 'src/data/site.json.bak';
const SENT = {
  name: 'ZZNAME', masthead: 'ZZMAST', tagline: 'ZZTAG',
  description: 'ZZDESC', url: 'https://example.test', defaultTheme: 'rivendell',
  socials: { linkedin: 'https://zz.test/li', instagram: '', github: '' },
  newsletter: { endpoint: 'https://formspree.io/f/ZZNEWS' },
  contact: { endpoint: 'https://formspree.io/f/ZZCONTACT' },
};
const fail = (m) => { console.error('FAIL:', m); restore(); process.exit(1); };
const restore = () => { try { copyFileSync(BAK, CFG); rmSync(BAK); } catch {} };

copyFileSync(CFG, BAK);
writeFileSync(CFG, JSON.stringify(SENT, null, 2));
try { execSync('npm run build', { stdio: 'inherit' }); }
catch (e) { fail('build errored'); }

const read = (p) => readFileSync(p, 'utf8');
let home, writing, rss;
try {
  home = read('dist/index.html');
  // The archive lives at /posts/ now (/writing/ is a 301 redirect stub with no
  // real <title>), so the title-suffix/name assertions read the posts page.
  writing = read('dist/posts/index.html');
  rss = read('dist/rss.xml');
} catch (e) { fail(`could not read dist output: ${e.message}`); }

const checks = [
  [home.includes('ZZMAST'), 'home masthead = site.masthead'],
  [home.includes('ZZTAG'), 'home tagline = site.tagline'],
  [home.includes('rivendell'), 'home no-flash script uses site.defaultTheme'],
  [home.includes('ZZNEWS'), 'newsletter endpoint = site.newsletter'],
  [writing.includes('— ZZNAME'), 'page title suffix = site.name'],
  [rss.includes('ZZMAST') || rss.includes('ZZNAME'), 'rss title from site'],
  [!home.includes('Bone Appetite'), 'no hardcoded masthead in home'],
  [!writing.includes('Inayat Panda'), 'no hardcoded name in page title'],
];
const bad = checks.filter(([ok]) => !ok).map(([, m]) => m);
restore();
if (bad.length) { console.error('FAILED checks:\n - ' + bad.join('\n - ')); process.exit(1); }
console.log('✅ site-config rebrand check passed');
