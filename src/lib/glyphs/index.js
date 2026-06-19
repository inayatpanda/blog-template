import torusKnot from './torus-knot.js';
import bone from './bone.js';
import circuit from './circuit.js';
import scroll from './scroll.js';
import openBook from './open-book.js';
import filmReel from './film-reel.js';
import musicNote from './music-note.js';
import globe from './globe.js';
import glenohumeral from './glenohumeral.js';
import reticle from './reticle.js';
import tajMahal from './taj-mahal.js';
import operaHouse from './opera-house.js';
import edinburghCastle from './edinburgh-castle.js';
import {
  fish, jellyfish, shell, urchin, starfish, coral,
  skull, vertebra, ribcage, heart, gear, bolt, compass,
  bird, cloud, kite, cactus, pyramid, palm, mountain, tower, tree,
} from './themed.js';

export const GLYPHS = {
  'torus-knot': torusKnot, bone, circuit, scroll,
  'open-book': openBook, 'film-reel': filmReel, 'music-note': musicNote, globe,
  glenohumeral, reticle, 'taj-mahal': tajMahal,
  'opera-house': operaHouse, 'edinburgh-castle': edinburghCastle,
};
// After Hours defaults to the music note (film-reel stays available for film posts).
export const TOPIC_DEFAULTS = {
  marrow: 'bone', forge: 'circuit', 'old-bones': 'scroll',
  marginalia: 'open-book', 'after-hours': 'music-note', atlas: 'globe',
  nebula: null,
};
export function resolveGlyph(name, topic) {
  if (name && GLYPHS[name]) return GLYPHS[name];
  const d = TOPIC_DEFAULTS[topic];
  return d ? GLYPHS[d] : null;
}

// Per-theme silhouette set: a non-default theme maps each topic to a themed shape so the whole
// scene reads as that world (Vista = sea life, Atlas = anatomy, Blueprint = drawing-office parts).
// Reuses existing glyphs where they already fit (bone, glenohumeral, circuit, reticle, torus-knot).
const THEME_GLYPHS = {
  vista: {
    marrow: fish, forge: urchin, 'old-bones': shell, marginalia: jellyfish,
    'after-hours': starfish, atlas: coral, nebula: jellyfish,
  },
  atlas: {
    marrow: bone, forge: vertebra, 'old-bones': skull, marginalia: ribcage,
    'after-hours': heart, atlas: glenohumeral, nebula: vertebra,
  },
  blueprint: {
    marrow: gear, forge: circuit, 'old-bones': compass, marginalia: bolt,
    'after-hours': reticle, atlas: torusKnot, nebula: gear,
  },
  daybreak: {
    marrow: bird, forge: kite, 'old-bones': cloud, marginalia: cloud,
    'after-hours': kite, atlas: bird, nebula: cloud,
  },
  dune: {
    marrow: cactus, forge: pyramid, 'old-bones': pyramid, marginalia: palm,
    'after-hours': palm, atlas: cactus, nebula: pyramid,
  },
  rivendell: {
    marrow: mountain, forge: tower, 'old-bones': tower, marginalia: tree,
    'after-hours': tree, atlas: mountain, nebula: tree,
  },
};
export function resolveThemeGlyph(theme, topic) {
  const m = THEME_GLYPHS[theme];
  return (m && m[topic]) || null;
}
