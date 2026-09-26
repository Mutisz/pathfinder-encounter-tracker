import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/Button';
import { canDelay, delayedParticipants, removedParticipants, visibleOrder } from '@/lib/encounter';
import type { Encounter, Participant } from '@/types/encounter';
import { StatblockView } from '@/features/library/StatblockView/StatblockView';
import { HpBadge, KindBadge } from '../HpBadge';
import { useEncounterActions } from '../useEncounterActions';
import { EndEncounterDialog, HpDialog, RemoveDialog, RemovedDialog, ZeroHpDialog, type HpDialogState } from './dialogs';

export function RunningPanel({ enc }: { enc: Encounter }) {
  const actions = useEncounterActions(enc.id);
  const [hpDialog, setHpDialog] = useState<HpDialogState | null>(null);
  const [zeroHp, setZeroHp] = useState<Participant | null>(null);
  const [removing, setRemoving] = useState<Participant | null>(null);
  const [showRemoved, setShowRemoved] = useState(false);
  const [ending, setEnding] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = visibleOrder(enc);
  const delayed = delayedParticipants(enc);
  const active = enc.activeId ? enc.participants[enc.activeId] : null;
  const removedCount = removedParticipants(enc).length;
  const selected = selectedId ? enc.participants[selectedId] : null;

  const applyHp = (id: string, mode: 'damage' | 'heal', amount: number) => {
    setHpDialog(null);
    if (mode === 'heal') {
      actions.heal(id, amount);
      return;
    }
    const dropped = actions.damage(id, amount);
    if (dropped) setZeroHp(enc.participants[id]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="grow text-lg font-semibold">
          <Link to="/encounters" className="text-stone-500 hover:underline">
            Encounters
          </Link>{' '}
          / {enc.name}
        </h2>
        <span className="rounded bg-ink px-3 py-1 font-semibold text-white">Round {enc.round}</span>
        <Button onClick={() => setShowRemoved(true)}>Removed ({removedCount})</Button>
        <Button variant="danger" onClick={() => setEnding(true)}>
          End encounter
        </Button>
      </div>

      <div className={`grid gap-4 ${selected ? 'lg:grid-cols-[1fr_24rem]' : ''}`}>
        <div className="space-y-4">
          {rows.length === 0 ? (
            <p className="rounded border border-dashed border-stone-300 p-6 text-center text-stone-500">
              Nobody is left in the initiative order. End the encounter or restore a removed participant.
            </p>
          ) : (
            <ol className="divide-y divide-stone-200 rounded border border-stone-200 bg-white">
              {rows.map((p) => (
                <ParticipantRow
                  key={p.id}
                  p={p}
                  isActive={p.id === enc.activeId}
                  isSelected={p.id === selectedId}
                  canDelay={canDelay(enc)}
                  onSelect={() => setSelectedId((s) => (s === p.id ? null : p.id))}
                  onDamage={() => setHpDialog({ participant: p, mode: 'damage' })}
                  onHeal={() => setHpDialog({ participant: p, mode: 'heal' })}
                  onRemove={() => setRemoving(p)}
                  onEndTurn={actions.endTurn}
                  onDelay={actions.delay}
                />
              ))}
            </ol>
          )}

          <section className="rounded border border-stone-200 bg-white">
            <h3 className="border-b border-stone-200 px-3 py-2 text-sm font-semibold uppercase tracking-wide text-stone-600">
              Delayed
            </h3>
            {delayed.length === 0 ? (
              <p className="px-3 py-2 text-sm text-stone-500">
                No one is delaying. Use "Delay" on the active participant's turn.
              </p>
            ) : (
              <ul className="divide-y divide-stone-200">
                {delayed.map((p) => {
                  const qIdx = enc.pendingReturns.indexOf(p.id);
                  return (
                    <li key={p.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                      <KindBadge kind={p.kind} />
                      <button
                        type="button"
                        className="cursor-pointer font-medium hover:underline"
                        onClick={() => setSelectedId(p.id)}
                      >
                        {p.name}
                      </button>
                      <HpBadge p={p} />
                      <span className="grow" />
                      {qIdx === -1 ? (
                        <Button size="sm" onClick={() => actions.queueReturn(p.id)} disabled={!active}>
                          Return after {active?.name ?? '—'}
                        </Button>
                      ) : (
                        <>
                          <span className="text-xs text-stone-600">
                            Returns after {active?.name} ({qIdx + 1}/{enc.pendingReturns.length})
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={qIdx === 0}
                            onClick={() => actions.moveInQueue(p.id, 'up')}
                          >
                            ▲
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={qIdx === enc.pendingReturns.length - 1}
                            onClick={() => actions.moveInQueue(p.id, 'down')}
                          >
                            ▼
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => actions.unqueueReturn(p.id)}>
                            Stay delayed
                          </Button>
                        </>
                      )}
                      <Button size="sm" onClick={() => setHpDialog({ participant: p, mode: 'damage' })}>
                        Damage
                      </Button>
                      <Button size="sm" onClick={() => setHpDialog({ participant: p, mode: 'heal' })}>
                        Heal
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setRemoving(p)}>
                        Remove
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
            {enc.pendingReturns.length > 0 && (
              <p className="border-t border-stone-200 px-3 py-1.5 text-xs text-stone-500">
                Queued participants re-enter directly after {active?.name} when that turn ends, in the order shown.
              </p>
            )}
          </section>
        </div>

        {selected && (
          <aside className="lg:sticky lg:top-4 lg:self-start">
            <div className="mb-1 flex justify-end">
              <Button size="sm" variant="ghost" onClick={() => setSelectedId(null)}>
                Close
              </Button>
            </div>
            <StatblockView statblock={selected.statblock} />
          </aside>
        )}
      </div>

      <HpDialog state={hpDialog} onClose={() => setHpDialog(null)} onApply={applyHp} />
      <ZeroHpDialog
        participant={zeroHp}
        onClose={() => setZeroHp(null)}
        onDead={(id) => {
          actions.remove(id, 'dead');
          setZeroHp(null);
        }}
        onOutcome={(id, outcome) => {
          actions.knockOut(id, outcome);
          setZeroHp(null);
        }}
      />
      <RemoveDialog
        participant={removing}
        onClose={() => setRemoving(null)}
        onRemove={(id, reason) => {
          actions.remove(id, reason);
          setRemoving(null);
        }}
      />
      <RemovedDialog enc={enc} open={showRemoved} onClose={() => setShowRemoved(false)} onRestore={actions.restore} />
      <EndEncounterDialog
        enc={enc}
        open={ending}
        onClose={() => setEnding(false)}
        onEnd={() => {
          setEnding(false);
          actions.end();
        }}
      />
    </div>
  );
}

function ParticipantRow({
  p,
  isActive,
  isSelected,
  canDelay,
  onSelect,
  onDamage,
  onHeal,
  onRemove,
  onEndTurn,
  onDelay,
}: {
  p: Participant;
  isActive: boolean;
  isSelected: boolean;
  canDelay: boolean;
  onSelect: () => void;
  onDamage: () => void;
  onHeal: () => void;
  onRemove: () => void;
  onEndTurn: () => void;
  onDelay: () => void;
}) {
  return (
    <li
      className={`flex flex-wrap items-center gap-3 px-3 py-2 ${isActive ? 'border-l-4 border-accent bg-amber-50' : 'border-l-4 border-transparent'} ${isSelected ? 'ring-1 ring-inset ring-accent/40' : ''}`}
    >
      <span
        className="w-10 text-right font-mono text-lg"
        title={p.initiativeChanged ? 'Position changed by Delay or being knocked out' : 'Initiative'}
      >
        {p.initiative}
        {p.initiativeChanged && <span className="text-xs text-stone-400">*</span>}
      </span>
      <KindBadge kind={p.kind} />
      <button
        type="button"
        onClick={onSelect}
        className="min-w-32 grow cursor-pointer text-left font-medium hover:underline"
      >
        {p.name}
        {isActive && <span className="ml-2 text-xs font-semibold uppercase text-accent">Active</span>}
        {p.lastZeroHpOutcome && p.currentHp === 0 && (
          <span className="ml-2 text-xs text-stone-500">
            {p.lastZeroHpOutcome === 'dying' ? 'dying' : 'heroic recovery'}
          </span>
        )}
      </button>
      <HpBadge p={p} />
      <span className="flex flex-wrap gap-1">
        <Button size="sm" onClick={onDamage}>
          Damage
        </Button>
        <Button size="sm" onClick={onHeal}>
          Heal
        </Button>
        <Button size="sm" variant="danger" onClick={onRemove}>
          Remove
        </Button>
      </span>
      {isActive && (
        <span className="flex gap-1">
          <Button
            size="sm"
            onClick={onDelay}
            disabled={!canDelay}
            title="Delay: leave the order and return after any later turn"
          >
            Delay
          </Button>
          <Button size="sm" variant="primary" onClick={onEndTurn}>
            End turn
          </Button>
        </span>
      )}
    </li>
  );
}
