export type Tab = 'meadow' | 'habits' | 'collection' | 'settings';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'meadow', label: 'Meadow', icon: '🌾' },
  { id: 'habits', label: 'Habits', icon: '🌱' },
  { id: 'collection', label: 'Jar', icon: '✨' },
  { id: 'settings', label: 'Setup', icon: '⚙️' },
];

export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="safe-bottom relative z-20 flex items-stretch border-t border-white/5 bg-night-900/80 backdrop-blur">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
            active === t.id ? 'text-white' : 'text-white/50'
          }`}
        >
          <span className="text-xl leading-none">{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
