import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import type { Habit, HabitReminder, Frequency } from '../store/types';

const EMOJI_PICKS = ['✨', '🌱', '💧', '🧘', '🍋', '🥗', '🏋️', '🚶', '📖', '🎨', '🧹', '🍵', '☀️', '🌙', '🫖', '🧴'];

function FreqPicker({ value, onChange }: { value: Frequency; onChange: (f: Frequency) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {(['daily', 'weekly', 'flexible'] as const).map((k) => (
          <button
            key={k}
            onClick={() =>
              onChange(k === 'weekly' ? { kind: 'weekly', target: 2 } : ({ kind: k } as Frequency))
            }
            className={`flex-1 rounded-xl px-3 py-2 text-sm ${
              value.kind === k ? 'bg-glow-common text-night-900' : 'bg-white/5 text-white/80'
            }`}
          >
            {k}
          </button>
        ))}
      </div>
      {value.kind === 'weekly' && (
        <label className="flex items-center gap-3 text-sm text-white/70">
          Target per week
          <input
            type="number"
            min={1}
            max={7}
            value={value.target}
            onChange={(e) => onChange({ kind: 'weekly', target: Math.max(1, Math.min(7, Number(e.target.value))) })}
            className="w-20 rounded-lg bg-white/5 px-2 py-1 text-white"
          />
        </label>
      )}
    </div>
  );
}

function ReminderPicker({ value, onChange }: { value: HabitReminder; onChange: (r: HabitReminder) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {(['time', 'morning-stack', 'flexible', 'none'] as const).map((k) => {
          const label =
            k === 'time' ? 'fixed time' : k === 'morning-stack' ? 'after I wake' : k;
          return (
            <button
              key={k}
              onClick={() =>
                onChange(
                  k === 'time'
                    ? { kind: 'time', time: '08:00' }
                    : k === 'morning-stack'
                      ? { kind: 'morning-stack', order: 99 }
                      : ({ kind: k } as HabitReminder),
                )
              }
              className={`rounded-xl px-3 py-1.5 text-xs ${
                value.kind === k ? 'bg-glow-common text-night-900' : 'bg-white/5 text-white/80'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      {value.kind === 'time' && (
        <input
          type="time"
          value={value.time}
          onChange={(e) => onChange({ kind: 'time', time: e.target.value })}
          className="rounded-lg bg-white/5 px-3 py-2 text-white"
        />
      )}
      {value.kind === 'morning-stack' && (
        <label className="flex items-center gap-3 text-sm text-white/70">
          Order in stack
          <input
            type="number"
            min={1}
            max={20}
            value={value.order}
            onChange={(e) => onChange({ kind: 'morning-stack', order: Math.max(1, Number(e.target.value)) })}
            className="w-20 rounded-lg bg-white/5 px-2 py-1 text-white"
          />
        </label>
      )}
    </div>
  );
}

function HabitEditor({
  initial,
  onSave,
  onCancel,
  onDelete,
}: {
  initial: Partial<Habit>;
  onSave: (h: Omit<Habit, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(initial.name ?? '');
  const [emoji, setEmoji] = useState(initial.emoji ?? '✨');
  const [frequency, setFrequency] = useState<Frequency>(initial.frequency ?? { kind: 'daily' });
  const [reminder, setReminder] = useState<HabitReminder>(initial.reminder ?? { kind: 'flexible' });
  const [timer, setTimer] = useState<number | ''>(initial.timerMinutes ?? '');
  const [prepOn, setPrepOn] = useState(Boolean(initial.prepReminder));
  const [prepHours, setPrepHours] = useState(initial.prepReminder?.hoursBefore ?? 10);
  const [prepText, setPrepText] = useState(initial.prepReminder?.text ?? 'Small prep for tomorrow');

  const playlistGroups = useStore((s) => s.playlistGroups);
  const [playlistGroupId, setPlaylistGroupId] = useState(initial.playlistGroupId ?? '');

  const save = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      emoji,
      frequency,
      reminder,
      timerMinutes: typeof timer === 'number' && timer > 0 ? timer : undefined,
      prepReminder: prepOn ? { hoursBefore: prepHours, text: prepText } : undefined,
      playlistGroupId: playlistGroupId || undefined,
      tags: initial.tags ?? [],
    });
  };

  return (
    <div className="space-y-4 rounded-2xl bg-white/5 p-4">
      <div>
        <label className="text-xs uppercase tracking-wider text-white/50">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Take meds"
          className="mt-1 w-full rounded-lg bg-night-800 px-3 py-2 text-white outline-none"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-wider text-white/50">Emoji</label>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {EMOJI_PICKS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`h-9 w-9 rounded-lg text-lg ${emoji === e ? 'bg-glow-common text-night-900' : 'bg-white/5'}`}
            >
              {e}
            </button>
          ))}
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value.slice(0, 2))}
            className="h-9 w-14 rounded-lg bg-white/5 text-center"
          />
        </div>
      </div>
      <div>
        <label className="text-xs uppercase tracking-wider text-white/50">Frequency</label>
        <div className="mt-1">
          <FreqPicker value={frequency} onChange={setFrequency} />
        </div>
      </div>
      <div>
        <label className="text-xs uppercase tracking-wider text-white/50">Reminder</label>
        <div className="mt-1">
          <ReminderPicker value={reminder} onChange={setReminder} />
        </div>
      </div>
      <div>
        <label className="text-xs uppercase tracking-wider text-white/50">Timer (minutes, optional)</label>
        <input
          type="number"
          min={1}
          max={180}
          placeholder="none"
          value={timer}
          onChange={(e) => setTimer(e.target.value === '' ? '' : Number(e.target.value))}
          className="mt-1 w-28 rounded-lg bg-night-800 px-3 py-2 text-white"
        />
      </div>
      {timer !== '' && (
        <div>
          <label className="text-xs uppercase tracking-wider text-white/50">Playlist group (optional)</label>
          <select
            value={playlistGroupId}
            onChange={(e) => setPlaylistGroupId(e.target.value)}
            className="mt-1 w-full rounded-lg bg-night-800 px-3 py-2 text-white"
          >
            <option value="">— none —</option>
            {playlistGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input type="checkbox" checked={prepOn} onChange={(e) => setPrepOn(e.target.checked)} />
          Prep reminder (night before)
        </label>
        {prepOn && (
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-2 text-xs text-white/60">
              Hours before main reminder
              <input
                type="number"
                min={1}
                max={24}
                value={prepHours}
                onChange={(e) => setPrepHours(Math.max(1, Math.min(24, Number(e.target.value))))}
                className="w-20 rounded-lg bg-night-800 px-2 py-1 text-white"
              />
            </label>
            <input
              value={prepText}
              onChange={(e) => setPrepText(e.target.value)}
              className="w-full rounded-lg bg-night-800 px-3 py-2 text-sm text-white"
              placeholder="Prep message"
            />
          </div>
        )}
      </div>
      <div className="flex gap-2 pt-2">
        <button
          onClick={save}
          className="flex-1 rounded-xl bg-glow-common py-2 font-medium text-night-900"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm"
        >
          Cancel
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm text-red-300"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

export function Habits() {
  const habits = useStore((s) => s.habits);
  const addHabit = useStore((s) => s.addHabit);
  const updateHabit = useStore((s) => s.updateHabit);
  const deleteHabit = useStore((s) => s.deleteHabit);
  const [editing, setEditing] = useState<string | 'new' | null>(null);

  const editingHabit = editing && editing !== 'new' ? habits.find((h) => h.id === editing) : null;

  return (
    <div className="safe-top safe-bottom flex h-full flex-col px-4 py-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-white/50">Habits</div>
          <div className="text-lg font-semibold">{habits.length} tracked</div>
        </div>
        <button
          onClick={() => setEditing('new')}
          className="rounded-full bg-glow-common px-4 py-1.5 text-sm font-medium text-night-900"
        >
          + add
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        <AnimatePresence>
          {habits.map((h) => (
            <motion.button
              key={h.id}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              onClick={() => setEditing(h.id)}
              className="flex w-full items-center gap-3 rounded-xl bg-white/5 p-3 text-left hover:bg-white/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-xl">
                {h.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{h.name}</div>
                <div className="text-xs text-white/60">
                  {h.frequency.kind === 'weekly'
                    ? `weekly × ${h.frequency.target}`
                    : h.frequency.kind}
                  {' · '}
                  {h.reminder.kind === 'time'
                    ? h.reminder.time
                    : h.reminder.kind === 'morning-stack'
                      ? 'after wake'
                      : h.reminder.kind}
                  {h.timerMinutes ? ` · ⏱ ${h.timerMinutes}m` : ''}
                  {h.prepReminder ? ' · 🌱 prep' : ''}
                </div>
              </div>
              <div className="text-white/40">›</div>
            </motion.button>
          ))}
        </AnimatePresence>
        {habits.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/60">
            No habits yet. Tap "+ add" to start.
          </div>
        )}
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-end bg-black/60 sm:items-center sm:justify-center"
            onClick={() => setEditing(null)}
          >
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-night-800 p-4 sm:rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <HabitEditor
                initial={editingHabit ?? {}}
                onSave={(h) => {
                  if (editing === 'new') addHabit(h);
                  else if (editingHabit) updateHabit(editingHabit.id, h);
                  setEditing(null);
                }}
                onCancel={() => setEditing(null)}
                onDelete={
                  editingHabit
                    ? () => {
                        deleteHabit(editingHabit.id);
                        setEditing(null);
                      }
                    : undefined
                }
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
