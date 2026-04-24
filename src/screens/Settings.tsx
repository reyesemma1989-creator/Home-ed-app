import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { addTrack, deleteTrack, listAllTracks } from '../lib/tracks';
import type { PlaylistGroup, Track } from '../store/types';
import { requestNotifications, scheduleAll } from '../lib/reminders';

export function Settings() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const exportState = useStore((s) => s.exportState);
  const importState = useStore((s) => s.importState);
  const reset = useStore((s) => s.reset);
  const habits = useStore((s) => s.habits);
  const groups = useStore((s) => s.playlistGroups);
  const upsertGroup = useStore((s) => s.upsertPlaylistGroup);
  const removeTrack = useStore((s) => s.removeTrackFromGroup);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  const refresh = async () => setTracks(await listAllTracks());

  useEffect(() => {
    refresh();
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleUpload = async (group: PlaylistGroup, files: FileList | null) => {
    if (!files) return;
    const addedIds: string[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith('audio/')) continue;
      const t = await addTrack(f, group.id);
      addedIds.push(t.id);
    }
    upsertGroup({ ...group, trackIds: [...group.trackIds, ...addedIds] });
    refresh();
  };

  const handleDeleteTrack = async (groupId: string, trackId: string) => {
    await deleteTrack(trackId);
    removeTrack(groupId, trackId);
    refresh();
  };

  const handleExport = () => {
    const data = exportState();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firefly-meadow-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      importState(parsed);
    } catch {
      alert('Could not read that file.');
    }
  };

  const requestNotifPerm = async () => {
    const ok = await requestNotifications();
    updateSettings({ notifications: ok });
    if (ok) scheduleAll(habits);
  };

  const installApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice?.outcome === 'accepted') setInstallPrompt(null);
  };

  const addNewGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    upsertGroup({
      id: crypto.randomUUID(),
      name,
      trackIds: [],
      generativeMood: 'calm',
    });
    setNewGroupName('');
  };

  return (
    <div className="safe-top safe-bottom flex h-full flex-col px-4 py-3">
      <div className="mb-4 text-xs uppercase tracking-widest text-white/50">Settings</div>
      <div className="flex-1 space-y-6 overflow-y-auto pb-10">
        <section className="space-y-2">
          <div className="text-sm font-semibold text-white/80">Feel</div>
          <label className="flex items-center justify-between rounded-xl bg-white/5 p-3">
            <span>Sound on catch</span>
            <input
              type="checkbox"
              checked={settings.sound}
              onChange={(e) => updateSettings({ sound: e.target.checked })}
              className="h-5 w-5"
            />
          </label>
          <label className="flex items-center justify-between rounded-xl bg-white/5 p-3">
            <span>Haptics (vibration)</span>
            <input
              type="checkbox"
              checked={settings.haptic}
              onChange={(e) => updateSettings({ haptic: e.target.checked })}
              className="h-5 w-5"
            />
          </label>
        </section>

        <section className="space-y-2">
          <div className="text-sm font-semibold text-white/80">Reminders</div>
          {settings.notifications ? (
            <div className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-200">
              On. Per-habit times + prep reminders are scheduled.
              <button
                onClick={() => scheduleAll(habits)}
                className="ml-2 rounded-lg bg-white/10 px-3 py-1 text-xs text-white"
              >
                re-sync
              </button>
            </div>
          ) : (
            <button
              onClick={requestNotifPerm}
              className="w-full rounded-xl bg-glow-common py-3 font-medium text-night-900"
            >
              Turn on reminders
            </button>
          )}
          <p className="text-xs text-white/50">
            Reminders fire at each habit's time. Prep reminders (e.g. soak chia seeds) fire N hours before. Copy is randomized each time.
          </p>
        </section>

        <section className="space-y-2">
          <div className="text-sm font-semibold text-white/80">Playlists (ad-free, on-device)</div>
          <p className="text-xs text-white/60">
            Upload audio files (mp3 / m4a / ogg). They live in this app, play offline, and never show ads.
            Each timer picks a different track — no immediate repeats.
          </p>
          {groups.map((g) => {
            const groupTracks = tracks.filter((t) => g.trackIds.includes(t.id));
            return (
              <div key={g.id} className="rounded-xl bg-white/5 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="font-medium">{g.name}</div>
                  <div className="text-xs text-white/50">{groupTracks.length} tracks</div>
                </div>
                <div className="mb-2 text-xs text-white/60">
                  Fallback mood:
                  <select
                    value={g.generativeMood}
                    onChange={(e) =>
                      upsertGroup({ ...g, generativeMood: e.target.value as any })
                    }
                    className="ml-2 rounded bg-night-800 px-2 py-1 text-white"
                  >
                    <option value="morning">morning</option>
                    <option value="hype">hype</option>
                    <option value="calm">calm</option>
                  </select>
                </div>
                <div className="space-y-1">
                  {groupTracks.map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded-lg bg-night-800 px-3 py-1.5 text-sm">
                      <span className="truncate">🎵 {t.name}</span>
                      <button
                        onClick={() => handleDeleteTrack(g.id, t.id)}
                        className="text-xs text-red-300 hover:text-red-200"
                      >
                        remove
                      </button>
                    </div>
                  ))}
                </div>
                <label className="mt-2 block">
                  <span className="inline-block cursor-pointer rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20">
                    + add audio files
                  </span>
                  <input
                    type="file"
                    accept="audio/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleUpload(g, e.target.files)}
                  />
                </label>
              </div>
            );
          })}
          <div className="flex gap-2">
            <input
              placeholder="new group name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="flex-1 rounded-lg bg-night-800 px-3 py-2 text-sm"
            />
            <button
              onClick={addNewGroup}
              className="rounded-lg bg-white/10 px-3 text-sm hover:bg-white/20"
            >
              + group
            </button>
          </div>
        </section>

        <section className="space-y-2">
          <div className="text-sm font-semibold text-white/80">Install to home screen</div>
          {installPrompt ? (
            <button
              onClick={installApp}
              className="w-full rounded-xl bg-glow-common py-3 font-medium text-night-900"
            >
              Install Firefly Meadow
            </button>
          ) : (
            <p className="text-xs text-white/60">
              Open this app in Chrome on Android. Tap the menu → "Install app" or "Add to home screen".
              Once installed, reminders and the icon badge work in the background.
            </p>
          )}
        </section>

        <section className="space-y-2">
          <div className="text-sm font-semibold text-white/80">Data</div>
          <button
            onClick={handleExport}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2 text-sm"
          >
            Export all data (JSON)
          </button>
          <label className="block w-full rounded-xl border border-white/10 bg-white/5 py-2 text-center text-sm">
            Import JSON backup
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => handleImport(e.target.files?.[0])}
            />
          </label>
          <button
            onClick={() => {
              if (confirm('Erase all habits and fireflies? This cannot be undone.')) reset();
            }}
            className="w-full rounded-xl border border-red-400/30 bg-red-500/10 py-2 text-sm text-red-300"
          >
            Reset everything
          </button>
        </section>
      </div>
    </div>
  );
}
