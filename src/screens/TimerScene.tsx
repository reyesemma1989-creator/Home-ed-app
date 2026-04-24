import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Habit } from '../store/types';
import { useStore } from '../store/useStore';
import { getTrackUrl, getTrackMeta } from '../lib/tracks';
import { pickNextTrack } from '../lib/rotation';
import { startGenerative, stopGenerative } from '../lib/generative';
import { playTimerEnd, unlockAudio, playCatchChime } from '../lib/audio';
import { haptic, HAPTICS } from '../lib/haptic';
import { fireflyBurst } from '../lib/confetti';
import { bumpRarity } from '../game/gacha';
import type { Species } from '../game/species';

type Props = { habit: Habit; onBack: () => void; onLegendary: (s: Species) => void };

export function TimerScene({ habit, onBack, onLegendary }: Props) {
  const settings = useStore((s) => s.settings);
  const playlistGroups = useStore((s) => s.playlistGroups);
  const completeHabit = useStore((s) => s.completeHabit);

  const durationSec = (habit.timerMinutes ?? 20) * 60;
  const [remaining, setRemaining] = useState(durationSec);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<'file' | 'generative' | 'silent'>('silent');
  const [trackName, setTrackName] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const endAtRef = useRef<number | null>(null);
  const finishedRef = useRef(false);

  const group = habit.playlistGroupId
    ? playlistGroups.find((g) => g.id === habit.playlistGroupId)
    : null;

  useEffect(() => {
    const interval = setInterval(() => {
      if (!running || !endAtRef.current) return;
      const left = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0 && !finishedRef.current) {
        finishedRef.current = true;
        finish();
      }
    }, 250);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      stopGenerative();
    };
  }, []);

  const start = async (audioChoice: 'file' | 'generative' | 'silent') => {
    unlockAudio();
    endAtRef.current = Date.now() + remaining * 1000;
    setRunning(true);
    finishedRef.current = false;

    if (audioChoice === 'file' && group) {
      const id = pickNextTrack(group.trackIds);
      if (id) {
        const url = await getTrackUrl(id);
        const meta = await getTrackMeta(id);
        if (url && audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.loop = true;
          audioRef.current.play().catch(() => {});
          setMode('file');
          setTrackName(meta?.name ?? null);
          return;
        }
      }
      // fall through to generative if no tracks
      await startGenerative(group.generativeMood);
      setMode('generative');
      setTrackName(null);
    } else if (audioChoice === 'generative') {
      await startGenerative(group?.generativeMood ?? 'hype');
      setMode('generative');
      setTrackName(null);
    } else {
      setMode('silent');
      setTrackName(null);
    }
  };

  const finish = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    stopGenerative();
    setRunning(false);
    if (settings.sound) playTimerEnd();
    if (settings.haptic) haptic(HAPTICS.rare);
    const result = completeHabit(habit.id, { rarityFloor: bumpRarity('common') });
    if (settings.sound) setTimeout(() => playCatchChime(result.rarity), 400);
    fireflyBurst(result.rarity);
    if (result.rarity === 'legendary') onLegendary(result.species);
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    stopGenerative();
    setRunning(false);
    endAtRef.current = null;
    setMode('silent');
  };

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progress = 1 - remaining / durationSec;

  return (
    <div className="flex h-full flex-col bg-night-900 text-white">
      <header className="safe-top flex items-center justify-between px-4 py-2">
        <button onClick={onBack} className="rounded-full bg-white/5 px-3 py-1 text-sm">
          ← back
        </button>
        <div className="text-sm text-white/60">
          {habit.emoji} {habit.name}
        </div>
        <div className="w-16" />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
        <motion.div
          className="relative flex h-60 w-60 items-center justify-center"
          animate={running ? { scale: [1, 1.03, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg className="absolute inset-0" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" className="fill-none stroke-white/10" strokeWidth="4" />
            <motion.circle
              cx="50"
              cy="50"
              r="46"
              className="fill-none"
              stroke="#ffd666"
              strokeWidth="4"
              strokeLinecap="round"
              style={{
                strokeDasharray: 2 * Math.PI * 46,
                strokeDashoffset: 2 * Math.PI * 46 * (1 - progress),
                transform: 'rotate(-90deg)',
                transformOrigin: '50% 50%',
                transition: 'stroke-dashoffset 0.3s linear',
              }}
            />
          </svg>
          <div className="text-center">
            <div className="font-display text-6xl font-semibold tabular-nums">
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </div>
            <div className="mt-1 text-xs uppercase tracking-widest text-white/50">
              {running ? 'glowing…' : remaining === 0 ? 'done' : 'ready'}
            </div>
          </div>
        </motion.div>

        {trackName && (
          <div className="text-sm text-white/70">🎵 {trackName}</div>
        )}
        {mode === 'generative' && (
          <div className="text-sm text-white/70">✨ Generative {group?.generativeMood ?? 'hype'} mix</div>
        )}

        {!running && remaining > 0 && (
          <div className="flex w-full max-w-sm flex-col gap-2">
            {group && group.trackIds.length > 0 && (
              <button
                onClick={() => start('file')}
                className="rounded-2xl bg-glow-common/90 py-3 font-medium text-night-900 active:scale-[0.98]"
              >
                ▶ Start with a track
              </button>
            )}
            <button
              onClick={() => start('generative')}
              className="rounded-2xl border border-white/10 bg-white/5 py-3 text-white active:scale-[0.98]"
            >
              ✨ Start with generative music
            </button>
            <button
              onClick={() => start('silent')}
              className="rounded-2xl border border-white/10 bg-transparent py-2 text-sm text-white/70 active:scale-[0.98]"
            >
              Start in silence
            </button>
            {group && group.trackIds.length === 0 && (
              <div className="text-center text-xs text-white/50">
                Tip: add tracks to "{group.name}" in Settings for ad-free playback.
              </div>
            )}
          </div>
        )}

        {running && (
          <button
            onClick={stop}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm"
          >
            Stop
          </button>
        )}

        {remaining === 0 && (
          <button
            onClick={onBack}
            className="rounded-full bg-white/10 px-5 py-2 text-sm"
          >
            Back to meadow
          </button>
        )}
      </div>

      <audio ref={audioRef} />
    </div>
  );
}
