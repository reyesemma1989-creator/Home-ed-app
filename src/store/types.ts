import type { Rarity } from '../game/species';

export type Frequency =
  | { kind: 'daily' }
  | { kind: 'weekly'; target: number }
  | { kind: 'flexible' };

export type HabitReminder =
  | { kind: 'time'; time: string } // "HH:mm"
  | { kind: 'morning-stack'; order: number } // fires when "I'm up" is tapped
  | { kind: 'flexible' }
  | { kind: 'none' };

export type Habit = {
  id: string;
  name: string;
  emoji: string;
  frequency: Frequency;
  reminder: HabitReminder;
  prepReminder?: { hoursBefore: number; text: string };
  timerMinutes?: number;
  playlistGroupId?: string;
  tags: string[];
  createdAt: number;
  archived?: boolean;
};

export type Catch = {
  speciesId: string;
  caughtAt: number;
  source: string; // habitId | 'surprise' | 'challenge:no-sugar' | 'prep:<habitId>'
  rarity: Rarity;
};

export type DailySpark = {
  date: string; // YYYY-MM-DD local
  habitIds: string[];
  completed: string[];
  morningStarted?: number; // timestamp the user tapped "I'm up"
  morningCompleted?: boolean;
};

export type ChallengeKind = 'no-sugar' | 'no-carb' | 'fasting';
export type DayChallenge = {
  date: string;
  kind: ChallengeKind | null;
  claimedAt?: number;
};

export type WeeklyProgress = {
  habitId: string;
  isoWeek: string;
  completions: number[];
};

export type Surprise = {
  id: string; // one of SURPRISE_PROMPTS ids
  createdAt: number;
  expiresAt: number;
  claimed: boolean;
};

export type PlaylistGroup = {
  id: string;
  name: string;
  trackIds: string[]; // references Track.id in IDB
  generativeMood: 'morning' | 'hype' | 'calm';
};

export type Track = {
  id: string;
  name: string;
  groupId: string;
  mimeType: string;
  size: number;
  addedAt: number;
};

export type Settings = {
  sound: boolean;
  haptic: boolean;
  notifications: boolean;
  theme: 'night' | 'twilight' | 'dawn';
  hasSeeded: boolean;
  installPromptDismissed?: number;
};
