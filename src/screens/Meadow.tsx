import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { MeadowCanvas } from '../components/MeadowCanvas';
import { HabitCard } from '../components/HabitCard';
import { DayChallengeCard } from '../components/DayChallengeCard';
import { MorningPanel } from '../components/MorningPanel';
import { SurpriseCard } from '../components/SurpriseCard';
import { LegendaryScene } from '../components/LegendaryScene';
import { fireflyBurst } from '../lib/confetti';
import { playCatchChime, unlockAudio } from '../lib/audio';
import { haptic, HAPTICS } from '../lib/haptic';
import type { Habit } from '../store/types';
import type { Species } from '../game/species';

type Props = { onOpenTimer: (habit: Habit) => void };

export function Meadow({ onOpenTimer }: Props) {
  const habits = useStore((s) => s.habits);
  const catches = useStore((s) => s.catches);
  const daily = useStore((s) => s.daily);
  const ensureDaily = useStore((s) => s.ensureDaily);
  const completeHabit = useStore((s) => s.completeHabit);
  const claimChallenge = useStore((s) => s.claimChallenge);
  const maybeSpawnSurprise = useStore((s) => s.maybeSpawnSurprise);
  const claimSurprise = useStore((s) => s.claimSurprise);
  const expireSurprises = useStore((s) => s.expireSurprises);
  const settings = useStore((s) => s.settings);

  const [legendary, setLegendary] = useState<Species | null>(null);

  useEffect(() => {
    ensureDaily();
    expireSurprises();
    maybeSpawnSurprise();
  }, [ensureDaily, expireSurprises, maybeSpawnSurprise]);

  useEffect(() => {
    if ('setAppBadge' in navigator && daily) {
      const remaining = daily.habitIds.length - daily.completed.length;
      (navigator as any).setAppBadge?.(remaining).catch(() => {});
    }
  }, [daily]);

  const d = daily ?? ensureDaily();
  const dailyHabits = d.habitIds
    .map((id) => habits.find((h) => h.id === id))
    .filter((h): h is Habit => Boolean(h));

  const handleComplete = (habit: Habit) => {
    if (habit.timerMinutes) {
      onOpenTimer(habit);
      return;
    }
    unlockAudio();
    const result = completeHabit(habit.id);
    if (settings.sound) playCatchChime(result.rarity);
    if (settings.haptic) {
      haptic(
        result.rarity === 'legendary'
          ? HAPTICS.legendary
          : result.rarity === 'rare'
            ? HAPTICS.rare
            : HAPTICS.catch,
      );
    }
    fireflyBurst(result.rarity);
    if (result.rarity === 'legendary') setLegendary(result.species);
  };

  const handleChallengeClaim = () => {
    const res = claimChallenge();
    if (!res) return;
    if (settings.sound) playCatchChime('legendary');
    if (settings.haptic) haptic(HAPTICS.legendary);
    fireflyBurst('legendary');
    setLegendary(res.species);
  };

  const handleSurpriseClaim = (id: string) => {
    const res = claimSurprise(id);
    if (!res) return;
    if (settings.sound) playCatchChime(res.rarity);
    if (settings.haptic) haptic(HAPTICS.catch);
    fireflyBurst(res.rarity);
    if (res.rarity === 'legendary') setLegendary(res.species);
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MeadowCanvas catches={catches} />

      <div className="relative z-10 flex h-full flex-col">
        <header className="safe-top px-4 pt-2">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between"
          >
            <div>
              <div className="text-xs uppercase tracking-widest text-white/50">Your meadow</div>
              <div className="text-lg font-semibold">
                {catches.length} firefl{catches.length === 1 ? 'y' : 'ies'} caught
              </div>
            </div>
            <div className="text-right text-xs text-white/50">
              {d.completed.length} / {d.habitIds.length} today
            </div>
          </motion.div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 pt-3">
          <div className="space-y-3">
            <MorningPanel onStarted={() => maybeSpawnSurprise()} />
            <DayChallengeCard onClaim={handleChallengeClaim} />
            <SurpriseCard onClaim={handleSurpriseClaim} />
          </div>
        </div>

        <div className="safe-bottom space-y-2 px-4 pt-3">
          <div className="text-xs uppercase tracking-widest text-white/50">Today's spark</div>
          {dailyHabits.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              Add some habits in the Habits tab and tomorrow's spark will light up.
            </div>
          ) : (
            dailyHabits.map((h) => (
              <HabitCard
                key={h.id}
                habit={h}
                done={d.completed.includes(h.id)}
                onTap={() => handleComplete(h)}
              />
            ))
          )}
        </div>
      </div>

      <LegendaryScene species={legendary} onClose={() => setLegendary(null)} />
    </div>
  );
}
