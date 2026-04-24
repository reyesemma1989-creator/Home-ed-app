import { motion, AnimatePresence } from 'framer-motion';
import type { Species } from '../game/species';
import { RARITY_LABELS } from '../game/species';

type Props = { species: Species | null; onClose: () => void };

export function LegendaryScene({ species, onClose }: Props) {
  return (
    <AnimatePresence>
      {species && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-night-900/90 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="flex flex-col items-center gap-4 px-6 text-center"
            initial={{ scale: 0.7, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.7 }}
            transition={{ type: 'spring', stiffness: 180, damping: 16 }}
          >
            <motion.div
              className="firefly-glow-strong h-28 w-28 rounded-full"
              style={{
                background: `radial-gradient(circle, ${species.glowColor} 0%, ${species.glowColor}aa 40%, transparent 70%)`,
                color: species.glowColor,
              }}
              animate={{ scale: [1, 1.12, 1], rotate: [0, 3, -3, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="text-sm uppercase tracking-widest text-white/60">
              {RARITY_LABELS[species.rarity]}
            </div>
            <div className="text-3xl font-semibold">{species.name}</div>
            <div className="max-w-xs text-white/70">{species.flavor}</div>
            <button
              className="mt-6 rounded-full bg-white/10 px-5 py-2 text-sm text-white/90 hover:bg-white/20"
              onClick={onClose}
            >
              Tap anywhere to close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
