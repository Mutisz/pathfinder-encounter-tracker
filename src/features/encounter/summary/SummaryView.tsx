import { Link } from 'react-router';
import { summary } from '@/lib/encounter';
import type { Encounter, SummaryStatus } from '@/types/encounter';
import { KindBadge } from '../HpBadge';

const label: Record<SummaryStatus, string> = {
  survived: 'Survived',
  dead: 'Dead',
  ranAway: 'Ran away',
  surrendered: 'Surrendered',
};
const cls: Record<SummaryStatus, string> = {
  survived: 'bg-green-100 text-green-800',
  dead: 'bg-red-100 text-red-800',
  ranAway: 'bg-amber-100 text-amber-800',
  surrendered: 'bg-blue-100 text-blue-800',
};

export function SummaryView({ enc }: { enc: Encounter }) {
  const rows = summary(enc);
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        <Link to="/encounters" className="text-stone-500 hover:underline">
          Encounters
        </Link>{' '}
        / {enc.name}{' '}
        <span className="text-sm font-normal text-stone-500">
          (ended after {enc.round} round{enc.round === 1 ? '' : 's'})
        </span>
      </h2>
      <table className="w-full rounded border border-stone-200 bg-white text-sm">
        <thead className="text-left text-xs uppercase text-stone-500">
          <tr>
            <th className="px-3 py-2">Participant</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">HP</th>
            <th className="px-3 py-2">Removed in round</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ participant: p, status }) => (
            <tr key={p.id} className="border-t border-stone-200">
              <td className="px-3 py-1.5">
                <KindBadge kind={p.kind} /> <span className="font-medium">{p.name}</span>
              </td>
              <td className="px-3 py-1.5">
                <span className={`rounded px-2 py-0.5 text-xs font-semibold ${cls[status]}`}>
                  {label[status]}
                  {status === 'survived' && p.currentHp === 0 && ' (0 HP)'}
                </span>
              </td>
              <td className="px-3 py-1.5">
                {p.currentHp}/{p.maxHp}
              </td>
              <td className="px-3 py-1.5 text-stone-500">{p.removedRound ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
