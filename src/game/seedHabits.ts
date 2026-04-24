import type { Habit } from '../store/types';

export function createSeedHabits(): Habit[] {
  const now = Date.now();
  const mk = (h: Omit<Habit, 'id' | 'createdAt'>): Habit => ({
    ...h,
    id: crypto.randomUUID(),
    createdAt: now,
  });
  return [
    mk({
      name: 'Tongue scraping',
      emoji: '👅',
      frequency: { kind: 'daily' },
      reminder: { kind: 'morning-stack', order: 1 },
      tags: ['morning'],
    }),
    mk({
      name: 'Oil pulling',
      emoji: '🥥',
      frequency: { kind: 'daily' },
      reminder: { kind: 'morning-stack', order: 2 },
      timerMinutes: 15,
      tags: ['morning'],
    }),
    mk({
      name: 'Chia seeds + lemon',
      emoji: '🍋',
      frequency: { kind: 'daily' },
      reminder: { kind: 'morning-stack', order: 3 },
      prepReminder: { hoursBefore: 10, text: 'Soak your chia seeds for tomorrow 🌙' },
      tags: ['morning', 'food'],
    }),
    mk({
      name: 'Gym',
      emoji: '🏋️',
      frequency: { kind: 'weekly', target: 2 },
      reminder: { kind: 'flexible' },
      tags: ['move'],
    }),
    mk({
      name: 'Downstairs mini clean',
      emoji: '🧹',
      frequency: { kind: 'daily' },
      reminder: { kind: 'flexible' },
      timerMinutes: 20,
      playlistGroupId: 'cleaning-hype',
      tags: ['home'],
    }),
    mk({
      name: 'Tea + reading',
      emoji: '🍵',
      frequency: { kind: 'daily' },
      reminder: { kind: 'time', time: '20:00' },
      tags: ['wind-down'],
    }),
  ];
}
