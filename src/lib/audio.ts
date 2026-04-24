// Tiny Web Audio chime synth. No assets, no licensing. Works offline.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function note(freq: number, start: number, duration: number, gainPeak: number, type: OscillatorType = 'sine') {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(c.destination);
  const t0 = c.currentTime + start;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(gainPeak, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

// Soft three-note pentatonic chime on catch.
export function playCatchChime(rarity: 'common' | 'uncommon' | 'rare' | 'legendary' = 'common') {
  const base = { common: 660, uncommon: 740, rare: 830, legendary: 988 }[rarity];
  note(base, 0, 0.32, 0.09);
  note(base * 1.5, 0.05, 0.32, 0.07);
  note(base * 2, 0.11, 0.38, 0.05);
  if (rarity === 'rare' || rarity === 'legendary') {
    note(base * 3, 0.18, 0.45, 0.04);
  }
  if (rarity === 'legendary') {
    note(base * 4, 0.28, 0.6, 0.035);
    note(base * 2.5, 0.42, 0.6, 0.03);
  }
}

export function playTap() {
  note(520, 0, 0.08, 0.04, 'triangle');
}

export function playMorningChime() {
  // A small rising 4-note arpeggio.
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(f, i * 0.12, 0.42, 0.06));
}

export function playTimerEnd() {
  [523.25, 659.25, 783.99].forEach((f, i) => note(f, i * 0.18, 0.55, 0.08));
}

export function playTimerTick() {
  note(440, 0, 0.04, 0.03, 'square');
}

export function unlockAudio() {
  getCtx();
}
