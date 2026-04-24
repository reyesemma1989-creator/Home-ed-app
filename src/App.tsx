import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { TabBar, type Tab } from './components/TabBar';
import { Meadow } from './screens/Meadow';
import { Habits } from './screens/Habits';
import { Collection } from './screens/Collection';
import { Settings } from './screens/Settings';
import { TimerScene } from './screens/TimerScene';
import { LegendaryScene } from './components/LegendaryScene';
import type { Habit } from './store/types';
import type { Species } from './game/species';
import { installVisibilityRescheduler, scheduleAll } from './lib/reminders';

export default function App() {
  const [tab, setTab] = useState<Tab>('meadow');
  const [timerHabit, setTimerHabit] = useState<Habit | null>(null);
  const [legendary, setLegendary] = useState<Species | null>(null);
  const seedIfEmpty = useStore((s) => s.seedIfEmpty);
  const habits = useStore((s) => s.habits);
  const settings = useStore((s) => s.settings);

  useEffect(() => {
    seedIfEmpty();
  }, [seedIfEmpty]);

  useEffect(() => {
    if (settings.notifications) scheduleAll(habits);
    return installVisibilityRescheduler(() => useStore.getState().habits);
  }, [settings.notifications, habits]);

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-night-900 text-white">
      <main className="relative flex-1 overflow-hidden">
        {timerHabit ? (
          <TimerScene
            habit={timerHabit}
            onBack={() => setTimerHabit(null)}
            onLegendary={(s) => setLegendary(s)}
          />
        ) : (
          <>
            {tab === 'meadow' && <Meadow onOpenTimer={(h) => setTimerHabit(h)} />}
            {tab === 'habits' && <Habits />}
            {tab === 'collection' && <Collection />}
            {tab === 'settings' && <Settings />}
          </>
        )}
      </main>
      {!timerHabit && <TabBar active={tab} onChange={setTab} />}
      <LegendaryScene species={legendary} onClose={() => setLegendary(null)} />
    </div>
  );
}
