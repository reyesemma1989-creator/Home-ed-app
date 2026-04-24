import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { MORNING_GREETINGS } from '../game/copy';
import { playMorningChime, unlockAudio } from '../lib/audio';
import { haptic, HAPTICS } from '../lib/haptic';

type Props = { onStarted: () => void };

export function MorningPanel({ onStarted }: Props) {
  const daily = useStore((s) => s.daily);
  const habits = useStore((s) => s.habits);
  const startMorning = useStore((s) => s.startMorning);
  const greeting = useMemo(
    () => MORNING_GREETINGS[Math.floor(Math.random() * MORNING_GREETINGS.length)],
    [],
  );

  const morningHabits = habits
    .filter((h) => h.reminder.kind === 'morning-stack')
    .sort((a, b) => {
      const ao = a.reminder.kind === 'morning-stack' ? a.reminder.order : 99;
      const bo = b.reminder.kind === 'morning-stack' ? b.reminder.order : 99;
      return ao - bo;
    });

  if (morningHabits.length === 0) return null;
  if (daily?.morningStarted) return null;

  const hour = new Date().getHours();
  if (hour >= 12) return null; // only show in the morning half

  const tap = () => {
    unlockAudio();
    playMorningChime();
    haptic(HAPTICS.catch);
    startMorning();
    onStarted();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-gradient-to-br from-night-700 to-night-800 p-4"
    >
      <div className="text-xs uppercase tracking-widest text-white/50">Morning stack</div>
      <div className="mt-1 text-base text-white/85">{greeting}</div>
      <button
        onClick={tap}
        className="mt-3 w-full rounded-2xl bg-gradient-to-r from-glow-common to-glow-legendary py-3 text-lg font-semibold text-night-900 active:scale-[0.98]"
      >
        ☀ I'm up
      </button>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/60">
        {morningHabits.map((h) => (
          <span key={h.id} className="rounded-full bg-white/5 px-2 py-1">
            {h.emoji} {h.name}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
