import { GACHA_SPECIES, RARITY_WEIGHTS, type Rarity, type Species } from './species';

const PITY_THRESHOLD = 20;

function pickRarity(pityNoRare: number): Rarity {
  if (pityNoRare >= PITY_THRESHOLD) return Math.random() < 0.1 ? 'legendary' : 'rare';
  const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const r of ['legendary', 'rare', 'uncommon', 'common'] as Rarity[]) {
    roll -= RARITY_WEIGHTS[r];
    if (roll <= 0) return r;
  }
  return 'common';
}

function pickSpeciesOfRarity(rarity: Rarity): Species {
  const pool = GACHA_SPECIES.filter((s) => s.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function bumpRarity(r: Rarity, by = 1): Rarity {
  const order: Rarity[] = ['common', 'uncommon', 'rare', 'legendary'];
  const i = Math.min(order.length - 1, order.indexOf(r) + by);
  return order[i];
}

export type GachaResult = { species: Species; rarity: Rarity; pityReset: boolean };

export function rollGacha(pityNoRare: number, options?: { rarityFloor?: Rarity }): GachaResult {
  let rarity = pickRarity(pityNoRare);
  if (options?.rarityFloor) {
    const order: Rarity[] = ['common', 'uncommon', 'rare', 'legendary'];
    if (order.indexOf(rarity) < order.indexOf(options.rarityFloor)) {
      rarity = options.rarityFloor;
    }
  }
  const species = pickSpeciesOfRarity(rarity);
  const pityReset = rarity === 'rare' || rarity === 'legendary';
  return { species, rarity, pityReset };
}
