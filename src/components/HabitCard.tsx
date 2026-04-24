import { motion } from 'framer-motion';
import type { Habit } from '../store/types';
import { useStore } from '../store/useStore';
import { isoWeekKey } from '../lib/date';

type Props = {
  habit: Habit;
  done: boolean;
  onTap: () => void;
  compact?: boolean;
};

export function HabitCard({ habit, done, onTap, compact }: Props) {
  const weekly = useStore((s) => s.weekly);
  let weeklyInfo: string | null = null;
  if (habit.frequency.kind === 'weekly') {
    const prog = weekly.find((w) => w.habitId === habit.id && w.isoWeek === isoWeekKey());
    const n = prog?.completions.length ?? 0;
    weeklyInfo = `${n} / ${habit.frequency.target} this week`;
  }
  const timer = habit.timerMinutes;

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onTap}
      disabled={done}
      className={`relative flex w-full items-center gap-3 rounded-2xl border ${
        done
          ? 'border-emerald-400/30 bg-emerald-500/10'
          : 'border-white/10 bg-white/5 hover:bg-white/10'
      } ${compact ? 'p-3' : 'p-4'} text-left transition-colors`}
    >
      <div
        className={`flex h-12 w-12 flex-none items-center justify-center rounded-xl text-2xl ${
          done ? 'bg-emerald-500/20' : 'bg-white/10'
        }`}
      >
        {done ? '✨' : habit.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className={`truncate font-medium ${done ? 'text-emerald-200' : 'text-white'}`}>
          {habit.name}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-white/60">
          {timer && <span>⏱ {timer} min</span>}
          {weeklyInfo && <span>📅 {weeklyInfo}</span>}
          {habit.reminder.kind === 'time' && <span>🕗 {habit.reminder.time}</span>}
          {habit.reminder.kind === 'morning-stack' && <span>☀ morning stack</span>}
          {habit.prepReminder && <span>🌱 night-before prep</span>}
        </div>
      </div>
      <div className="text-2xl text-white/40">{done ? '✓' : '›'}</div>
    </motion.button>
  );
}
