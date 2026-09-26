import type { Participant } from '@/types/encounter';

export function HpBadge({ p }: { p: Participant }) {
  const ratio = p.maxHp > 0 ? p.currentHp / p.maxHp : 0;
  const color =
    p.currentHp === 0 ? 'bg-stone-400' : ratio > 0.5 ? 'bg-green-600' : ratio > 0.25 ? 'bg-amber-500' : 'bg-red-600';
  return (
    <div className="w-28">
      <div className="flex justify-between text-xs">
        <span className="font-semibold">
          {p.currentHp}/{p.maxHp} HP
        </span>
        {p.currentHp === 0 && <span className="font-semibold text-red-700">0 HP</span>}
      </div>
      <div className="h-1.5 w-full rounded bg-stone-200">
        <div className={`h-1.5 rounded ${color}`} style={{ width: `${Math.round(ratio * 100)}%` }} />
      </div>
    </div>
  );
}

export function KindBadge({ kind }: { kind: Participant['kind'] }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${kind === 'player' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}
    >
      {kind === 'player' ? 'PC' : 'NPC'}
    </span>
  );
}
