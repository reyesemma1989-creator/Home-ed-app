// Pick the next track from a group, avoiding the last N played.
const KEY = 'firefly-recent-tracks-v1';
const RECENT_MAX = 3;

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function saveRecent(list: string[]): void {
  localStorage.setItem(KEY, JSON.stringify(list.slice(-RECENT_MAX)));
}

export function pickNextTrack(trackIds: string[]): string | null {
  if (trackIds.length === 0) return null;
  const recent = loadRecent();
  const avoid = new Set(recent);
  const candidates = trackIds.filter((id) => !avoid.has(id));
  const pool = candidates.length > 0 ? candidates : trackIds;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  saveRecent([...recent, pick]);
  return pick;
}
