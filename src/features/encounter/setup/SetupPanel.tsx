import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/Button';
import { NumberInput, Select } from '@/components/ui/Field';
import { canMoveTiedPlayer, canStart } from '@/lib/encounter';
import { formatModifier, initiativeOptions } from '@/lib/statblock';
import { useLibraryEntries } from '@/store/libraryStore';
import type { Encounter, Participant } from '@/types/encounter';
import { KindBadge } from '../HpBadge';
import { useEncounterActions } from '../useEncounterActions';
import { AddNpcDialog } from './AddNpcDialog';

export function SetupPanel({ enc }: { enc: Encounter }) {
  const actions = useEncounterActions(enc.id);
  const entries = useLibraryEntries();
  const [adding, setAdding] = useState(false);

  const present = new Set(Object.values(enc.participants).map((p) => p.templateId));
  const missingPlayers = entries.filter((e) => e.kind === 'player' && !present.has(e.id));
  const rows = enc.order.map((id) => enc.participants[id]);
  const ready = canStart(enc);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="grow text-lg font-semibold">
          <Link to="/encounters" className="text-stone-500 hover:underline">
            Encounters
          </Link>{' '}
          / {enc.name} <span className="text-sm font-normal text-stone-500">(setup)</span>
        </h2>
        <Button onClick={() => setAdding(true)}>+ Add NPCs</Button>
        {missingPlayers.length > 0 && (
          <Button onClick={() => missingPlayers.forEach((e) => actions.addPlayer(e))}>
            + Add {missingPlayers.length} missing player{missingPlayers.length === 1 ? '' : 's'}
          </Button>
        )}
        <Button
          onClick={actions.rollMissingNpcs}
          disabled={!rows.some((p) => p.kind === 'npc' && p.initiative === null)}
        >
          Roll remaining NPCs
        </Button>
        <Button
          variant="primary"
          onClick={actions.start}
          disabled={!ready}
          title={ready ? '' : 'Every participant needs an initiative'}
        >
          Start encounter
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded border border-dashed border-stone-300 p-6 text-center text-stone-500">
          No participants. Add NPCs, or create players in the library.
        </p>
      ) : (
        <table className="w-full border-separate border-spacing-0 rounded border border-stone-200 bg-white text-sm">
          <thead className="text-left text-xs uppercase text-stone-500">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Initiative skill</th>
              <th className="px-3 py-2">Initiative</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <SetupRow key={p.id} enc={enc} p={p} index={i} actions={actions} />
            ))}
          </tbody>
        </table>
      )}
      <p className="text-sm text-stone-500">
        Order: highest initiative first; NPCs win ties against players; tied players can be swapped with the arrows. The
        order is frozen when the encounter starts.
      </p>

      <AddNpcDialog open={adding} onClose={() => setAdding(false)} onAdd={actions.addNpcs} />
    </div>
  );
}

function SetupRow({
  enc,
  p,
  index,
  actions,
}: {
  enc: Encounter;
  p: Participant;
  index: number;
  actions: ReturnType<typeof useEncounterActions>;
}) {
  const options = initiativeOptions(p.statblock);
  const group = p.initiativeGroupId
    ? Object.values(enc.participants).filter((q) => q.initiativeGroupId === p.initiativeGroupId).length
    : 0;
  return (
    <tr className="border-t border-stone-200 odd:bg-stone-50/50">
      <td className="px-3 py-1.5 text-stone-400">{index + 1}</td>
      <td className="px-3 py-1.5">
        <KindBadge kind={p.kind} /> <span className="font-medium">{p.name}</span>
        {group > 1 && <span className="ml-1 text-xs text-stone-500">(batch of {group})</span>}
      </td>
      <td className="px-3 py-1.5">
        <Select
          value={p.initiativeSkill}
          onChange={(e) => actions.setInitiativeSkill(p.id, e.target.value)}
          className="max-w-56"
        >
          {options.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label} {formatModifier(o.modifier)}
            </option>
          ))}
        </Select>
      </td>
      <td className="px-3 py-1.5">
        <div className="flex items-center gap-1">
          <NumberInput
            value={p.initiative ?? Number.NaN}
            onChange={(v) => actions.setInitiative(p.id, v)}
            className="w-20"
            placeholder="—"
          />
          <Button size="sm" onClick={() => actions.roll(p.id)} title="Roll d20 + modifier">
            Roll
          </Button>
          {p.lastRoll && (
            <span className="text-xs text-stone-500">
              d20 {p.lastRoll.d20} {formatModifier(p.lastRoll.modifier)}
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-1.5 text-right whitespace-nowrap">
        <Button
          size="sm"
          variant="ghost"
          disabled={!canMoveTiedPlayer(enc, p.id, 'up')}
          onClick={() => actions.moveTiedPlayer(p.id, 'up')}
          title="Move up (tied players only)"
        >
          ▲
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={!canMoveTiedPlayer(enc, p.id, 'down')}
          onClick={() => actions.moveTiedPlayer(p.id, 'down')}
          title="Move down (tied players only)"
        >
          ▼
        </Button>
        <Button size="sm" variant="ghost" onClick={() => actions.removeFromSetup(p.id)} title="Remove from encounter">
          ✕
        </Button>
      </td>
    </tr>
  );
}
