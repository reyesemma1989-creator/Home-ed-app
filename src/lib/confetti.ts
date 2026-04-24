import confetti from 'canvas-confetti';
import type { Rarity } from '../game/species';

const COLORS: Record<Rarity, string[]> = {
  common: ['#ffd666', '#ffb347', '#fff1a8'],
  uncommon: ['#7cf8b7', '#9ff0d2', '#b7f27c'],
  rare: ['#7ec8ff', '#a0a8ff', '#ffb0d8'],
  legendary: ['#ff9cf2', '#ffe28a', '#ffffff', '#c9f5ff'],
};

export function fireflyBurst(rarity: Rarity = 'common') {
  const colors = COLORS[rarity];
  const base = { startVelocity: 18, spread: 70, ticks: 90, shapes: ['circle'] as ('circle' | 'square')[], scalar: 0.7 };
  confetti({
    ...base,
    particleCount: rarity === 'legendary' ? 80 : rarity === 'rare' ? 55 : rarity === 'uncommon' ? 35 : 22,
    origin: { y: 0.62 },
    colors,
  });
  if (rarity === 'rare' || rarity === 'legendary') {
    setTimeout(() => {
      confetti({ ...base, particleCount: 30, origin: { x: 0.2, y: 0.5 }, colors, angle: 60 });
      confetti({ ...base, particleCount: 30, origin: { x: 0.8, y: 0.5 }, colors, angle: 120 });
    }, 160);
  }
  if (rarity === 'legendary') {
    setTimeout(() => {
      confetti({ ...base, particleCount: 100, origin: { y: 0.45 }, colors, scalar: 1 });
    }, 320);
  }
}
