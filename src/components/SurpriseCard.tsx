import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { SURPRISE_PROMPTS } from '../game/copy';

type Props = { onClaim: (surpriseId: string) => void };

function promptFor(id: string): string {
  const base = id.split('-')[0];
  const entry = SURPRISE_PROMPTS.find((p) => p.id === base);
  return entry?.prompt ?? 'Tiny bonus task ✨';
}

export function SurpriseCard({ onClaim }: Props) {
  const surprises = useStore((s) => s.surprises);
  const [, force] = useState(0);

  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const active = surprises.find((s) => !s.claimed && s.expiresAt > Date.now());

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="rounded-2xl border border-glow-legendary/40 bg-glow-legendary/10 p-3"
        >
          <div className="flex items-center justify-between text-xs uppercase tracking-wider text-glow-legendary">
            <span>✨ Surprise — 5 min bonus</span>
            <span>{Math.max(0, Math.ceil((active.expiresAt - Date.now()) / 1000))}s</span>
          </div>
          <div className="mt-2 text-sm text-white/90">{promptFor(active.id)}</div>
          <button
            onClick={() => onClaim(active.id)}
            className="mt-3 w-full rounded-xl bg-glow-legendary/80 py-2 text-sm font-medium text-night-900"
          >
            Done → catch bonus firefly
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
