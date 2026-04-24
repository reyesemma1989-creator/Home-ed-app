import { useMemo } from 'react';
import { Firefly } from './Firefly';
import type { Catch } from '../store/types';
import { SPECIES_BY_ID } from '../game/species';

type Props = { catches: Catch[]; maxVisible?: number };

// Deterministic hash → stable position per catch (so fireflies don't jump around).
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function MeadowCanvas({ catches, maxVisible = 120 }: Props) {
  const recent = useMemo(() => {
    const slice = catches.slice(-maxVisible);
    return slice.map((c, i) => {
      const species = SPECIES_BY_ID[c.speciesId];
      const seed = `${c.caughtAt}-${i}`;
      const h = hash(seed);
      return {
        key: seed,
        x: 5 + ((h % 9000) / 9000) * 90,
        y: 10 + (((h >> 3) % 7500) / 7500) * 70,
        drift: 6 + ((h >> 6) % 6),
        delay: ((h >> 9) % 1000) / 200,
        size: species?.rarity === 'legendary' ? 16 : species?.rarity === 'rare' ? 13 : species?.rarity === 'uncommon' ? 11 : 9,
        glow: species?.glowColor,
        rarity: species?.rarity,
      };
    });
  }, [catches, maxVisible]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {recent.map((f) => (
        <Firefly
          key={f.key}
          x={f.x}
          y={f.y}
          size={f.size}
          drift={f.drift}
          delay={f.delay}
          glowColor={f.glow}
          rarity={f.rarity}
        />
      ))}
    </div>
  );
}
