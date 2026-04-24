import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Catch,
  DailySpark,
  DayChallenge,
  Habit,
  PlaylistGroup,
  Settings,
  Surprise,
  WeeklyProgress,
} from './types';
import { createSeedHabits } from '../game/seedHabits';
import { rollGacha, type GachaResult } from '../game/gacha';
import { CHALLENGE_SPECIES, type Rarity } from '../game/species';
import { todayKey, isoWeekKey, daysLeftInIsoWeek } from '../lib/date';
import { SURPRISE_PROMPTS } from '../game/copy';

type State = {
  habits: Habit[];
  catches: Catch[];
  daily: DailySpark | null;
  challenge: DayChallenge | null;
  weekly: WeeklyProgress[];
  surprises: Surprise[];
  playlistGroups: PlaylistGroup[];
  settings: Settings;
  pityNoRare: number;
  lastPickedYesterday: string[];
  version: 1;
};

type Actions = {
  seedIfEmpty: () => void;
  addHabit: (h: Omit<Habit, 'id' | 'createdAt'>) => void;
  updateHabit: (id: string, patch: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  ensureDaily: () => DailySpark;
  startMorning: () => void;
  completeHabit: (habitId: string, opts?: { rarityFloor?: Rarity }) => GachaResult;
  completePrep: (habitId: string) => GachaResult;
  pickChallenge: (kind: DayChallenge['kind']) => void;
  claimChallenge: () => GachaResult | null;
  maybeSpawnSurprise: () => void;
  claimSurprise: (id: string) => GachaResult | null;
  expireSurprises: () => void;
  upsertPlaylistGroup: (g: PlaylistGroup) => void;
  removeTrackFromGroup: (groupId: string, trackId: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  importState: (s: Partial<State>) => void;
  exportState: () => string;
  reset: () => void;
};

const defaultSettings: Settings = {
  sound: true,
  haptic: true,
  notifications: false,
  theme: 'night',
  hasSeeded: false,
};

const defaultGroups: PlaylistGroup[] = [
  { id: 'morning-wake', name: 'Morning wake-up', trackIds: [], generativeMood: 'morning' },
  { id: 'cleaning-hype', name: 'Cleaning hype', trackIds: [], generativeMood: 'hype' },
];

function pickDailyHabits(
  habits: Habit[],
  weekly: WeeklyProgress[],
  pickedYesterday: string[],
): string[] {
  const active = habits.filter((h) => !h.archived);
  if (active.length <= 3) return active.map((h) => h.id);
  const week = isoWeekKey();
  const daysLeft = daysLeftInIsoWeek();

  const scored = active.map((h) => {
    let weight = 1;
    if (h.reminder.kind === 'time') weight += 0.4;
    if (h.reminder.kind === 'morning-stack') weight += 0.3;
    if (pickedYesterday.includes(h.id)) weight -= 0.3;
    if (h.frequency.kind === 'weekly') {
      const prog = weekly.find((w) => w.habitId === h.id && w.isoWeek === week);
      const done = prog?.completions.length ?? 0;
      const remaining = Math.max(0, h.frequency.target - done);
      if (remaining > 0) {
        weight += Math.min(1.5, remaining / daysLeft);
      } else {
        weight -= 0.8; // already hit target this week
      }
    }
    weight += Math.random() * 0.6;
    return { h, weight };
  });
  scored.sort((a, b) => b.weight - a.weight);
  return scored.slice(0, 3).map((s) => s.h.id);
}

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      habits: [],
      catches: [],
      daily: null,
      challenge: null,
      weekly: [],
      surprises: [],
      playlistGroups: defaultGroups,
      settings: defaultSettings,
      pityNoRare: 0,
      lastPickedYesterday: [],
      version: 1,

      seedIfEmpty: () => {
        const { habits, settings } = get();
        if (habits.length === 0 && !settings.hasSeeded) {
          set({
            habits: createSeedHabits(),
            settings: { ...settings, hasSeeded: true },
          });
        }
      },

      addHabit: (h) =>
        set((s) => ({
          habits: [...s.habits, { ...h, id: crypto.randomUUID(), createdAt: Date.now() }],
        })),

      updateHabit: (id, patch) =>
        set((s) => ({
          habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
        })),

      deleteHabit: (id) =>
        set((s) => ({
          habits: s.habits.filter((h) => h.id !== id),
          daily: s.daily
            ? {
                ...s.daily,
                habitIds: s.daily.habitIds.filter((x) => x !== id),
                completed: s.daily.completed.filter((x) => x !== id),
              }
            : s.daily,
        })),

      ensureDaily: () => {
        const state = get();
        const today = todayKey();
        if (state.daily && state.daily.date === today) return state.daily;
        const prev = state.daily;
        const picked = pickDailyHabits(state.habits, state.weekly, state.lastPickedYesterday);
        const newDaily: DailySpark = { date: today, habitIds: picked, completed: [] };
        set({
          daily: newDaily,
          lastPickedYesterday: prev?.habitIds ?? [],
          challenge: state.challenge?.date === today ? state.challenge : { date: today, kind: null },
        });
        return newDaily;
      },

      startMorning: () => {
        const daily = get().ensureDaily();
        if (daily.morningStarted) return;
        set({ daily: { ...daily, morningStarted: Date.now() } });
      },

      completeHabit: (habitId, opts) => {
        const state = get();
        const result = rollGacha(state.pityNoRare, opts);
        const daily = state.ensureDaily();
        const alreadyDone = daily.completed.includes(habitId);
        const habit = state.habits.find((h) => h.id === habitId);

        const isMorningStack = habit?.reminder.kind === 'morning-stack';
        const morningIds = state.habits
          .filter((h) => h.reminder.kind === 'morning-stack')
          .map((h) => h.id);
        const morningDone = [...daily.completed, habitId].filter((id) => morningIds.includes(id));
        const morningCompleted = isMorningStack && morningIds.length > 0 && morningDone.length >= morningIds.length;

        const newCatch: Catch = {
          speciesId: result.species.id,
          caughtAt: Date.now(),
          source: habitId,
          rarity: result.rarity,
        };

        // weekly tracking
        let weekly = state.weekly;
        if (habit?.frequency.kind === 'weekly') {
          const week = isoWeekKey();
          const existing = weekly.find((w) => w.habitId === habitId && w.isoWeek === week);
          if (existing) {
            weekly = weekly.map((w) =>
              w === existing ? { ...w, completions: [...w.completions, Date.now()] } : w,
            );
          } else {
            weekly = [...weekly, { habitId, isoWeek: week, completions: [Date.now()] }];
          }
        }

        set({
          catches: alreadyDone ? state.catches : [...state.catches, newCatch],
          daily: alreadyDone
            ? daily
            : {
                ...daily,
                completed: [...daily.completed, habitId],
                morningCompleted: morningCompleted || daily.morningCompleted,
              },
          weekly,
          pityNoRare: result.pityReset ? 0 : state.pityNoRare + 1,
        });
        return result;
      },

      completePrep: (habitId) => {
        const state = get();
        const result = rollGacha(state.pityNoRare, { rarityFloor: 'uncommon' });
        const newCatch: Catch = {
          speciesId: result.species.id,
          caughtAt: Date.now(),
          source: `prep:${habitId}`,
          rarity: result.rarity,
        };
        set({
          catches: [...state.catches, newCatch],
          pityNoRare: result.pityReset ? 0 : state.pityNoRare + 1,
        });
        return result;
      },

      pickChallenge: (kind) => {
        const today = todayKey();
        set({ challenge: { date: today, kind } });
      },

      claimChallenge: () => {
        const state = get();
        const today = todayKey();
        const c = state.challenge;
        if (!c || c.date !== today || !c.kind || c.claimedAt) return null;
        const sp = CHALLENGE_SPECIES[c.kind];
        const catchEntry: Catch = {
          speciesId: sp.id,
          caughtAt: Date.now(),
          source: `challenge:${c.kind}`,
          rarity: 'legendary',
        };
        set({
          challenge: { ...c, claimedAt: Date.now() },
          catches: [...state.catches, catchEntry],
          pityNoRare: 0,
        });
        return { species: sp, rarity: 'legendary', pityReset: true };
      },

      maybeSpawnSurprise: () => {
        const state = get();
        const active = state.surprises.filter((s) => !s.claimed && s.expiresAt > Date.now());
        if (active.length > 0) return;
        const todayCount = state.surprises.filter(
          (s) => new Date(s.createdAt).toDateString() === new Date().toDateString(),
        ).length;
        if (todayCount >= 3) return;
        if (Math.random() > 0.4) return;
        const prompt = SURPRISE_PROMPTS[Math.floor(Math.random() * SURPRISE_PROMPTS.length)];
        const s: Surprise = {
          id: `${prompt.id}-${Date.now()}`,
          createdAt: Date.now(),
          expiresAt: Date.now() + 5 * 60_000,
          claimed: false,
        };
        set({ surprises: [...state.surprises, s] });
      },

      claimSurprise: (id) => {
        const state = get();
        const s = state.surprises.find((x) => x.id === id);
        if (!s || s.claimed || s.expiresAt < Date.now()) return null;
        const result = rollGacha(state.pityNoRare, { rarityFloor: 'uncommon' });
        const catchEntry: Catch = {
          speciesId: result.species.id,
          caughtAt: Date.now(),
          source: 'surprise',
          rarity: result.rarity,
        };
        set({
          surprises: state.surprises.map((x) => (x.id === id ? { ...x, claimed: true } : x)),
          catches: [...state.catches, catchEntry],
          pityNoRare: result.pityReset ? 0 : state.pityNoRare + 1,
        });
        return result;
      },

      expireSurprises: () => {
        const now = Date.now();
        set((s) => ({ surprises: s.surprises.filter((x) => x.expiresAt > now - 60_000) }));
      },

      upsertPlaylistGroup: (g) =>
        set((s) => {
          const exists = s.playlistGroups.some((x) => x.id === g.id);
          return {
            playlistGroups: exists
              ? s.playlistGroups.map((x) => (x.id === g.id ? g : x))
              : [...s.playlistGroups, g],
          };
        }),

      removeTrackFromGroup: (groupId, trackId) =>
        set((s) => ({
          playlistGroups: s.playlistGroups.map((g) =>
            g.id === groupId ? { ...g, trackIds: g.trackIds.filter((t) => t !== trackId) } : g,
          ),
        })),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      importState: (s) =>
        set((current) => ({
          ...current,
          habits: s.habits ?? current.habits,
          catches: s.catches ?? current.catches,
          daily: s.daily ?? current.daily,
          challenge: s.challenge ?? current.challenge,
          weekly: s.weekly ?? current.weekly,
          playlistGroups: s.playlistGroups ?? current.playlistGroups,
          settings: s.settings ?? current.settings,
        })),

      exportState: () => {
        const s = get();
        const payload = {
          version: s.version,
          habits: s.habits,
          catches: s.catches,
          daily: s.daily,
          challenge: s.challenge,
          weekly: s.weekly,
          playlistGroups: s.playlistGroups,
          settings: s.settings,
        };
        return JSON.stringify(payload, null, 2);
      },

      reset: () =>
        set({
          habits: [],
          catches: [],
          daily: null,
          challenge: null,
          weekly: [],
          surprises: [],
          playlistGroups: defaultGroups,
          settings: { ...defaultSettings, hasSeeded: false },
          pityNoRare: 0,
          lastPickedYesterday: [],
        }),
    }),
    {
      name: 'firefly-meadow-v1',
      partialize: (s) => ({
        habits: s.habits,
        catches: s.catches,
        daily: s.daily,
        challenge: s.challenge,
        weekly: s.weekly,
        surprises: s.surprises,
        playlistGroups: s.playlistGroups,
        settings: s.settings,
        pityNoRare: s.pityNoRare,
        lastPickedYesterday: s.lastPickedYesterday,
        version: s.version,
      }),
    },
  ),
);
