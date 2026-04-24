import { motion } from 'framer-motion';
import type { Rarity } from '../game/species';
import { RARITY_COLORS } from '../game/species';

type Props = {
  x: number; // 0..100 (vw%)
  y: number; // 0..100 (vh%)
  rarity?: Rarity;
  glowColor?: string;
  size?: number; // px
  drift?: number; // seconds per drift cycle
  delay?: number;
};

export function Firefly({ x, y, rarity = 'common', glowColor, size = 10, drift = 8, delay = 0 }: Props) {
  const color = glowColor ?? RARITY_COLORS[rarity];
  const strong = rarity === 'rare' || rarity === 'legendary';
  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{ left: `${x}%`, top: `${y}%`, color }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{
        opacity: [0.55, 1, 0.55],
        scale: [1, 1.15, 1],
        x: [0, 12, -8, 4, 0],
        y: [0, -10, 6, -4, 0],
      }}
      transition={{
        duration: drift,
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'easeInOut',
        delay,
      }}
    >
      <div
        className={strong ? 'firefly-glow-strong' : 'firefly-glow'}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color} 0%, ${color}aa 40%, transparent 70%)`,
          color,
        }}
      />
    </motion.div>
  );
}
