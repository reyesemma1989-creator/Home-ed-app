import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { SPECIES, RARITY_LABELS, type Rarity } from '../game/species';

const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'legendary'];

export function Collection() {
  const catches = useStore((s) => s.catches);
  const countsBySpecies = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of catches) m[c.speciesId] = (m[c.speciesId] ?? 0) + 1;
    return m;
  }, [catches]);

  const grouped = useMemo(() => {
    const g: Record<Rarity, typeof SPECIES> = { common: [], uncommon: [], rare: [], legendary: [] };
    for (const s of SPECIES) g[s.rarity].push(s);
    return g;
  }, []);

  const seen = Object.keys(countsBySpecies).length;

  return (
    <div className="safe-top safe-bottom flex h-full flex-col px-4 py-3">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-white/50">Collection</div>
          <div className="text-lg font-semibold">
            {seen} / {SPECIES.length} species
          </div>
        </div>
        <div className="text-sm text-white/60">{catches.length} caught total</div>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto pb-6">
        {RARITY_ORDER.map((r) => (
          <section key={r}>
            <div className="mb-2 text-xs uppercase tracking-wider text-white/50">
              {RARITY_LABELS[r]}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {grouped[r].map((s) => {
                const n = countsBySpecies[s.id] ?? 0;
                const seen = n > 0;
                return (
                  <div
                    key={s.id}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-3 ${
                      seen
                        ? 'border-white/10 bg-white/5'
                        : 'border-white/5 bg-white/[0.02]'
                    }`}
                  >
                    <div
                      className={`h-10 w-10 rounded-full ${seen ? 'firefly-glow' : ''}`}
                      style={{
                        background: seen
                          ? `radial-gradient(circle, ${s.glowColor} 0%, ${s.glowColor}aa 40%, transparent 70%)`
                          : 'radial-gradient(circle, #333 0%, #111 70%)',
                        color: seen ? s.glowColor : '#555',
                      }}
                    />
                    <div className={`text-center text-xs font-medium ${seen ? 'text-white' : 'text-white/40'}`}>
                      {seen ? s.name : '???'}
                    </div>
                    {seen && <div className="text-[10px] text-white/50">×{n}</div>}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
