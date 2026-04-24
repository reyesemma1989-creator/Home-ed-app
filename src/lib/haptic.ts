export function haptic(pattern: number | number[] = 18): void {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // ignore
  }
}

export const HAPTICS = {
  tap: 10,
  catch: [12, 40, 18],
  rare: [20, 60, 30, 60, 20],
  legendary: [30, 80, 40, 80, 40, 80, 60],
};
