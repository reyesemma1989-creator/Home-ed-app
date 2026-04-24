export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type Species = {
  id: string;
  name: string;
  rarity: Rarity;
  glowColor: string;
  pulseMs: number;
  flavor: string;
  source?: 'gacha' | 'challenge-nosugar' | 'challenge-nocarb' | 'challenge-fasting';
};

export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 70,
  uncommon: 22,
  rare: 7,
  legendary: 1,
};

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#ffd666',
  uncommon: '#7cf8b7',
  rare: '#7ec8ff',
  legendary: '#ff9cf2',
};

export const RARITY_LABELS: Record<Rarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  legendary: 'Legendary',
};

export const SPECIES: Species[] = [
  // common
  { id: 'dusk-ember', name: 'Dusk Ember', rarity: 'common', glowColor: '#ffd666', pulseMs: 1600, flavor: 'A warm little flicker that loves the first hour of night.' },
  { id: 'candlewick', name: 'Candlewick', rarity: 'common', glowColor: '#ffb347', pulseMs: 1800, flavor: 'Steady, patient, honey-colored.' },
  { id: 'honeylamp', name: 'Honeylamp', rarity: 'common', glowColor: '#ffcf70', pulseMs: 1500, flavor: 'Hums softly if you listen.' },
  { id: 'porchlight', name: 'Porchlight', rarity: 'common', glowColor: '#fff1a8', pulseMs: 1700, flavor: 'Always glad you came home.' },
  { id: 'pebble-spark', name: 'Pebble Spark', rarity: 'common', glowColor: '#ffe28a', pulseMs: 1400, flavor: 'Tiny but surprisingly bright.' },

  // uncommon
  { id: 'mint-wisp', name: 'Mint Wisp', rarity: 'uncommon', glowColor: '#7cf8b7', pulseMs: 1300, flavor: 'Cool and herbal, like a breath on a still morning.' },
  { id: 'seafoam', name: 'Seafoam', rarity: 'uncommon', glowColor: '#9ff0d2', pulseMs: 1200, flavor: 'Carries the hush of distant waves.' },
  { id: 'meadow-sage', name: 'Meadow Sage', rarity: 'uncommon', glowColor: '#b7f27c', pulseMs: 1400, flavor: 'Grows where the grass is tallest.' },
  { id: 'clover-glim', name: 'Clover Glim', rarity: 'uncommon', glowColor: '#8ee39d', pulseMs: 1300, flavor: 'Lucky, but quietly about it.' },

  // rare
  { id: 'aurora-wisp', name: 'Aurora Wisp', rarity: 'rare', glowColor: '#7ec8ff', pulseMs: 900, flavor: 'Only appears when the sky is thinking about snow.' },
  { id: 'twilight-opal', name: 'Twilight Opal', rarity: 'rare', glowColor: '#a0a8ff', pulseMs: 1000, flavor: 'Shifts color when you blink.' },
  { id: 'deep-lantern', name: 'Deep Lantern', rarity: 'rare', glowColor: '#6b8cff', pulseMs: 1100, flavor: 'Floats as if pulled by a current you cannot see.' },
  { id: 'rose-quartz', name: 'Rose Quartz', rarity: 'rare', glowColor: '#ffb0d8', pulseMs: 950, flavor: 'Gentle, shy, worth waiting for.' },

  // legendary (gacha)
  { id: 'moonshard', name: 'Moonshard', rarity: 'legendary', glowColor: '#e8e8ff', pulseMs: 700, flavor: 'A sliver of the moon that got curious.' },
  { id: 'starling', name: 'Starling', rarity: 'legendary', glowColor: '#ffffff', pulseMs: 650, flavor: 'Sings on frequencies only fireflies can hear.' },
  { id: 'phoenix-mote', name: 'Phoenix Mote', rarity: 'legendary', glowColor: '#ff7b54', pulseMs: 600, flavor: 'Rekindles itself at every dawn.' },

  // commemorative challenge species (all legendary)
  { id: 'sugarless-sprite', name: 'Sugarless Sprite', rarity: 'legendary', glowColor: '#c9f5ff', pulseMs: 800, flavor: 'Bright without being sweet. Earned by a no-sugar day.', source: 'challenge-nosugar' },
  { id: 'low-carb-lumen', name: 'Low-Carb Lumen', rarity: 'legendary', glowColor: '#a8ffcf', pulseMs: 800, flavor: 'Lean, clean, runs on patience. Earned by a no-carb day.', source: 'challenge-nocarb' },
  { id: 'fasting-phoenix', name: 'Fasting Phoenix', rarity: 'legendary', glowColor: '#ffb968', pulseMs: 750, flavor: 'Burns slower, shines longer. Earned by a fasting day.', source: 'challenge-fasting' },
];

export const SPECIES_BY_ID: Record<string, Species> = Object.fromEntries(SPECIES.map((s) => [s.id, s]));

export const GACHA_SPECIES = SPECIES.filter((s) => !s.source || s.source === 'gacha');
export const CHALLENGE_SPECIES: Record<string, Species> = {
  'no-sugar': SPECIES_BY_ID['sugarless-sprite'],
  'no-carb': SPECIES_BY_ID['low-carb-lumen'],
  'fasting': SPECIES_BY_ID['fasting-phoenix'],
};
