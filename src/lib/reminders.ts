// Local reminder scheduler. Uses setTimeout while the app is running + showNotification
// for the visible side. For reliability when the app is closed, the PWA relies on
// Android Chrome's service-worker wake; as a pragmatic fallback we also re-schedule
// every time the app is opened (on visibilitychange), and when the user opens the
// app past a missed reminder time we surface an in-app banner instead.

import type { Habit } from '../store/types';
import { PREP_REMINDER_TEXTS, REMINDER_TEXTS } from '../game/copy';

const TIMERS: number[] = [];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function nextOccurrence(hhmm: string, offsetHours = 0): number {
  const [h, m] = hhmm.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  target.setTime(target.getTime() - offsetHours * 3_600_000);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  return target.getTime() - now.getTime();
}

function clearAll() {
  TIMERS.forEach((id) => window.clearTimeout(id));
  TIMERS.length = 0;
}

async function showNotif(title: string, body: string, data?: Record<string, unknown>) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg) {
      reg.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data,
        tag: (data?.tag as string) ?? 'firefly',
      });
    } else {
      new Notification(title, { body });
    }
  } catch {
    // ignore
  }
}

export async function requestNotifications(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  const res = await Notification.requestPermission();
  return res === 'granted';
}

export function scheduleAll(habits: Habit[]) {
  clearAll();
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

  for (const h of habits) {
    if (h.reminder.kind === 'time') {
      const delay = nextOccurrence(h.reminder.time);
      const id = window.setTimeout(() => {
        showNotif(`${h.emoji} ${h.name}`, randomFrom(REMINDER_TEXTS), { tag: `h-${h.id}` });
        scheduleAll(habits); // re-schedule for next day
      }, delay);
      TIMERS.push(id);

      if (h.prepReminder) {
        const prepDelay = nextOccurrence(h.reminder.time, h.prepReminder.hoursBefore);
        const pid = window.setTimeout(() => {
          showNotif(
            `${h.emoji} Prep for ${h.name}`,
            h.prepReminder!.text || randomFrom(PREP_REMINDER_TEXTS),
            { tag: `prep-${h.id}`, habitId: h.id, prep: true },
          );
        }, prepDelay);
        TIMERS.push(pid);
      }
    }
  }
}

// Re-schedule when the tab becomes visible again (guards against timers missed
// while the SW was asleep).
export function installVisibilityRescheduler(getHabits: () => Habit[]) {
  const handler = () => {
    if (document.visibilityState === 'visible') scheduleAll(getHabits());
  };
  document.addEventListener('visibilitychange', handler);
  return () => document.removeEventListener('visibilitychange', handler);
}
