import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { CHALLENGE_LABELS } from '../game/copy';
import type { ChallengeKind } from '../store/types';

export function DayChallengeCard({ onClaim }: { onClaim: () => void }) {
  const challenge = useStore((s) => s.challenge);
  const pick = useStore((s) => s.pickChallenge);
  const kinds: ChallengeKind[] = ['no-sugar', 'no-carb', 'fasting'];
  const hour = new Date().getHours();
  const claimUnlocked = hour >= 18;

  if (!challenge || challenge.claimedAt) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wider text-white/50">
        <span>Day Challenge</span>
        {challenge.kind && !challenge.claimedAt && (
          <button
            className="text-white/60 hover:text-white/90"
            onClick={() => pick(null)}
          >
            clear
          </button>
        )}
      </div>
      <AnimatePresence mode="wait">
        {!challenge.kind ? (
          <motion.div
            key="picker"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-3 gap-2"
          >
            {kinds.map((k) => (
              <button
                key={k}
                onClick={() => pick(k)}
                className="flex flex-col items-center gap-1 rounded-xl bg-white/5 p-2 text-center hover:bg-white/10"
              >
                <span className="text-xl">{CHALLENGE_LABELS[k].emoji}</span>
                <span className="text-xs">{CHALLENGE_LABELS[k].title}</span>
              </button>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-xl">
              {CHALLENGE_LABELS[challenge.kind].emoji}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{CHALLENGE_LABELS[challenge.kind].title} day</div>
              <div className="text-xs text-white/60">{CHALLENGE_LABELS[challenge.kind].flavor}</div>
            </div>
            <button
              onClick={onClaim}
              disabled={!claimUnlocked}
              className={`rounded-full px-3 py-1.5 text-xs ${
                claimUnlocked
                  ? 'bg-glow-legendary/80 font-medium text-night-900 hover:bg-glow-legendary'
                  : 'bg-white/10 text-white/40'
              }`}
            >
              {claimUnlocked ? 'Claim ✨' : 'Claim at 6 PM'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
